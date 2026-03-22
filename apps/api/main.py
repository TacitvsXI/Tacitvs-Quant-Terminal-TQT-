"""
FastAPI Backend для Tacitus Quant Terminal.

Этот сервер предоставляет REST API для:
- Запуска бэктестов
- Получения EV расчетов
- Управления стратегиями
- Получения данных с exchange
"""

# ===== ИМПОРТЫ =====

# FastAPI - современный web framework для Python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Pydantic - для валидации данных (схемы запросов/ответов)
from pydantic import BaseModel, Field

# Типизация
from typing import List, Dict, Any, Optional

# Для работы с путями файлов
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent.parent.parent
API_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

import core
core.__path__.append(str(API_DIR / "core"))

from core.strategy.base import IStrategy, Signal, BarContext, SignalSide
from core.strategy.tortoise import TortoiseStrategy
from core.ev.ev_calculator import EVCalculator, EVResult
from core.risk.risk_manager import RiskManager, RiskLimits, RiskLevel


# ===== PYDANTIC MODELS (схемы данных для API) =====

class HealthResponse(BaseModel):
    """
    Ответ health check endpoint.
    
    Pydantic автоматически валидирует и сериализует данные в JSON.
    """
    status: str = Field(description="Статус сервиса")
    version: str = Field(description="Версия API")


class EVCalculationRequest(BaseModel):
    """
    Запрос для расчета EV.
    
    Field(...) означает обязательное поле.
    Field(default=X) означает опциональное поле со значением по умолчанию.
    """
    win_rate: float = Field(..., ge=0.0, le=1.0, description="Win rate (0-1)")
    avg_win_r: float = Field(..., gt=0.0, description="Средний выигрыш в R")
    avg_loss_r: float = Field(default=-1.0, le=0.0, description="Средний проигрыш в R")
    notional_in: float = Field(default=1000.0, gt=0, description="Notional на входе")
    notional_out: float = Field(default=1000.0, gt=0, description="Notional на выходе")
    fee_in_bps: Optional[float] = Field(default=None, description="Fee на вход (bps)")
    fee_out_bps: Optional[float] = Field(default=None, description="Fee на выход (bps)")
    funding_rate: float = Field(default=0.0, description="Funding rate за 8h")
    hold_time_hours: float = Field(default=24.0, gt=0, description="Время удержания")
    slippage_bps: float = Field(default=1.0, ge=0, description="Slippage (bps)")
    gas_usd: float = Field(default=0.0, ge=0, description="Gas в USD")
    r_usd: float = Field(default=100.0, gt=0, description="Размер 1R в USD")


class EVCalculationResponse(BaseModel):
    """Ответ с результатами EV."""
    ev_result: Dict[str, float]
    is_tradeable: bool
    message: str


class PositionSizeRequest(BaseModel):
    """Запрос для расчета размера позиции."""
    entry_price: float = Field(..., gt=0, description="Цена входа")
    stop_price: float = Field(..., gt=0, description="Цена стопа")
    equity: float = Field(..., gt=0, description="Капитал в USD")
    risk_pct: float = Field(default=1.0, gt=0, le=10, description="Риск в %")
    contract_size: float = Field(default=1.0, gt=0, description="Размер контракта")


class PositionSizeResponse(BaseModel):
    """Ответ с размером позиции."""
    size: float
    r_usd: float
    risk_distance: float
    message: str


class StrategySignalRequest(BaseModel):
    """Запрос для получения сигнала от стратегии."""
    strategy_id: str = Field(..., description="ID стратегии (tortoise, etc)")
    market: str = Field(..., description="Рынок (BTC-PERP)")
    
    # Текущая свеча
    current_bar: Dict[str, Any] = Field(..., description="Текущая свеча (OHLCV)")
    
    # История (упрощенно - список словарей)
    history: List[Dict[str, Any]] = Field(..., description="История свечей")
    
    # Параметры стратегии (опционально)
    strategy_params: Optional[Dict[str, Any]] = Field(default=None)


class SignalResponse(BaseModel):
    """Ответ с сигналами."""
    signals: List[Dict[str, Any]]
    count: int


# ===== FASTAPI APP =====

# Создаем экземпляр FastAPI приложения
app = FastAPI(
    title="Tacitus Quant Terminal API",
    description="REST API for quant trading terminal",
    version="0.1.0"
)

# Добавляем CORS middleware (чтобы Next.js UI мог обращаться к API)
# В production нужно ограничить origins до конкретных доменов
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В production: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Глобальные объекты (в production будут в DI container или state)
ev_calculator = EVCalculator(default_maker_bps=-1.5, default_taker_bps=4.5)

# ===== REGISTER ROUTERS =====

# Import routes
from routes.candles import router as candles_router
from routes.indicators import router as indicators_router
from routes.volume import router as volume_router
from routes.volume_profile import router as volume_profile_router

# Register routers
app.include_router(candles_router, prefix="/api", tags=["candles"])
app.include_router(indicators_router, prefix="/api", tags=["indicators"])
app.include_router(volume_router, prefix="/api", tags=["volume"])
app.include_router(volume_profile_router, prefix="/api", tags=["volume_profile"])


# ===== ENDPOINTS =====

@app.get("/", response_model=HealthResponse)
async def root():
    """
    Root endpoint - health check.
    
    GET / -> возвращает статус сервиса
    
    @app.get декоратор регистрирует функцию как GET endpoint
    response_model автоматически конвертирует ответ в JSON по схеме
    """
    return HealthResponse(
        status="ok",
        version="0.1.0"
    )


@app.get("/health")
async def health():
    """
    Health check endpoint.
    
    Используется для проверки что сервис жив.
    """
    return {"status": "healthy"}


@app.post("/api/ev/calculate", response_model=EVCalculationResponse)
async def calculate_ev(request: EVCalculationRequest):
    """
    Расчет Expected Value с полными издержками.
    
    POST /api/ev/calculate
    Body: EVCalculationRequest (JSON)
    
    Returns: EVCalculationResponse
    
    Args:
        request: Данные для расчета EV
        
    Returns:
        Результат расчета EV
    """
    try:
        # Вызываем наш EV calculator
        ev_result = ev_calculator.calculate_ev_result(
            win_rate=request.win_rate,
            avg_win_r=request.avg_win_r,
            avg_loss_r=request.avg_loss_r,
            notional_in=request.notional_in,
            notional_out=request.notional_out,
            fee_in_bps=request.fee_in_bps,
            fee_out_bps=request.fee_out_bps,
            funding_rate=request.funding_rate,
            hold_time_hours=request.hold_time_hours,
            slippage_bps=request.slippage_bps,
            gas_usd=request.gas_usd,
            r_usd=request.r_usd
        )
        
        # Формируем ответ
        is_tradeable = ev_result.is_tradeable()
        message = (
            f"EV_net = {ev_result.ev_net:.3f}R. "
            f"{'✅ Стратегия прибыльна' if is_tradeable else '❌ Стратегия убыточна'}"
        )
        
        return EVCalculationResponse(
            ev_result=ev_result.to_dict(),
            is_tradeable=is_tradeable,
            message=message
        )
    
    except Exception as e:
        # Если произошла ошибка - возвращаем HTTP 500
        # HTTPException - специальный класс FastAPI для ошибок
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/position-size", response_model=PositionSizeResponse)
async def calculate_position_size(request: PositionSizeRequest):
    """
    Расчет размера позиции по формуле 1% R.
    
    POST /api/risk/position-size
    Body: PositionSizeRequest
    
    Returns: PositionSizeResponse
    
    Args:
        request: Параметры для расчета sizing
        
    Returns:
        Размер позиции и R в USD
    """
    try:
        # Создаем временный RiskManager
        risk_mgr = RiskManager(equity=request.equity)
        
        # Рассчитываем размер
        size, r_usd = risk_mgr.calculate_position_size(
            entry_price=request.entry_price,
            stop_price=request.stop_price,
            contract_size=request.contract_size,
            custom_risk_pct=request.risk_pct
        )
        
        risk_distance = abs(request.entry_price - request.stop_price)
        
        message = (
            f"Size: {size:.4f} contracts, "
            f"Risk: ${r_usd:.2f} ({request.risk_pct}% of equity)"
        )
        
        return PositionSizeResponse(
            size=size,
            r_usd=r_usd,
            risk_distance=risk_distance,
            message=message
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy/signal", response_model=SignalResponse)
async def get_strategy_signal(request: StrategySignalRequest):
    """
    Получить торговый сигнал от стратегии.
    
    POST /api/strategy/signal
    Body: StrategySignalRequest
    
    Returns: SignalResponse со списком сигналов
    
    Args:
        request: Данные для генерации сигнала
        
    Returns:
        Список сигналов от стратегии
    """
    try:
        # --- 1) Выбираем стратегию ---
        strategy_params = request.strategy_params or {}
        
        if request.strategy_id == "tortoise":
            strategy = TortoiseStrategy(strategy_params)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown strategy: {request.strategy_id}"
            )
        
        # --- 2) Подготавливаем данные ---
        
        # Конвертируем current_bar в BarContext
        bar = request.current_bar
        ctx = BarContext(
            timestamp=bar.get('timestamp', 0),
            market=request.market,
            open=bar['open'],
            high=bar['high'],
            low=bar['low'],
            close=bar['close'],
            volume=bar.get('volume', 0),
            indicators=bar.get('indicators', {})
        )
        
        # Конвертируем history в DataFrame
        # pd.DataFrame создает таблицу из списка словарей
        import pandas as pd
        history_df = pd.DataFrame(request.history)
        
        # --- 3) Генерируем сигналы ---
        signals = strategy.on_bar(ctx, history_df)
        
        # --- 4) Конвертируем сигналы в словари для JSON ---
        signals_dict = []
        for sig in signals:
            signals_dict.append({
                'market': sig.market,
                'side': sig.side.value,  # .value берет строку из Enum
                'entry': sig.entry,
                'stop': sig.stop,
                'targets': sig.targets,
                'confidence': sig.confidence,
                'risk_reward_ratio': sig.risk_reward_ratio(),
                'metadata': sig.metadata
            })
        
        return SignalResponse(
            signals=signals_dict,
            count=len(signals_dict)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategies/list")
async def list_strategies():
    """
    Получить список доступных стратегий.
    
    GET /api/strategies/list
    
    Returns: Список стратегий с описаниями
    """
    return {
        "strategies": [
            {
                "id": "tortoise",
                "name": "Tortoise Lite",
                "description": "Donchian 20/10 breakout strategy",
                "timeframe": "1D",
                "markets": ["BTC-PERP", "ETH-PERP"],
                "params": {
                    "don_break": 20,
                    "don_exit": 10,
                    "trail_atr_len": 20,
                    "trail_mult": 2.0
                }
            }
        ]
    }


# ===== STARTUP EVENT =====

@app.on_event("startup")
async def startup_event():
    """
    Выполняется при старте сервера.
    
    Здесь можно:
    - Инициализировать подключения к БД
    - Загрузить данные
    - Настроить логирование
    """
    print("🚀 Tacitus Quant Terminal API starting...")
    print(f"📊 EV Calculator initialized (maker: -1.5bps, taker: 4.5bps)")
    print(f"✅ Ready to serve requests")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Выполняется при остановке сервера.
    
    Здесь нужно:
    - Закрыть подключения
    - Сохранить состояние
    """
    print("👋 Shutting down API...")


# ===== MAIN (для запуска напрямую) =====

if __name__ == "__main__":
    # uvicorn - ASGI сервер для FastAPI
    import uvicorn
    
    # Запускаем сервер
    # host="0.0.0.0" - слушаем на всех интерфейсах
    # port=8080 - порт
    # reload=True - автоперезагрузка при изменении кода (только для dev!)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True
    )
