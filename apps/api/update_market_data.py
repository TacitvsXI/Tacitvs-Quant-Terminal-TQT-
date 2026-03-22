#!/usr/bin/env python3
"""
Скрипт для загрузки актуальных рыночных данных с Binance.

Usage:
    python update_market_data.py
    
Загружает последние 1000 дневных свечей для BTC, ETH, SOL.
"""

import requests
import polars as pl
from pathlib import Path
from datetime import datetime, timezone
import time

# Binance Public API (не требует API ключей)
BINANCE_API = "https://api.binance.com/api/v3/klines"

# Маппинг наших символов на Binance
SYMBOLS_MAP = {
    "BTC-PERP": "BTCUSDT",
    "ETH-PERP": "ETHUSDT", 
    "SOL-PERP": "SOLUSDT"
}

# Директория для данных
DATA_DIR = Path(__file__).parent / "data" / "historical"


def fetch_binance_klines(symbol: str, interval: str = "1d", limit: int = 1000) -> list:
    """
    Загружает свечи с Binance.
    
    Args:
        symbol: Binance symbol (BTCUSDT, ETHUSDT, etc.)
        interval: Timeframe (1m, 5m, 15m, 1h, 4h, 1d, etc.)
        limit: Количество свечей (макс 1000)
        
    Returns:
        List of candles
    """
    url = f"{BINANCE_API}"
    params = {
        "symbol": symbol,
        "interval": interval,
        "limit": limit
    }
    
    print(f"📡 Fetching {symbol} {interval} data from Binance...")
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        print(f"✅ Received {len(data)} candles")
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching {symbol}: {e}")
        return []


def process_klines(klines: list) -> pl.DataFrame:
    """
    Конвертирует Binance klines в Polars DataFrame.
    
    Binance klines format:
    [
      [
        1499040000000,      // Open time
        "0.01634000",       // Open
        "0.80000000",       // High
        "0.01575800",       // Low
        "0.01577100",       // Close
        "148976.11427815",  // Volume
        1499644799999,      // Close time
        "2434.19055334",    // Quote asset volume
        308,                // Number of trades
        "1756.87402397",    // Taker buy base asset volume
        "28.46694368",      // Taker buy quote asset volume
        "17928899.62484339" // Ignore
      ]
    ]
    """
    if not klines:
        return pl.DataFrame()
    
    # Извлекаем нужные поля
    data = {
        "timestamp": [datetime.fromtimestamp(k[0] / 1000, tz=timezone.utc) for k in klines],
        "open": [float(k[1]) for k in klines],
        "high": [float(k[2]) for k in klines],
        "low": [float(k[3]) for k in klines],
        "close": [float(k[4]) for k in klines],
        "volume": [float(k[5]) for k in klines],
    }
    
    df = pl.DataFrame(data)
    
    print(f"📊 Data range: {df['timestamp'].min()} → {df['timestamp'].max()}")
    
    return df


def save_data(df: pl.DataFrame, symbol: str, timeframe: str):
    """Сохраняет данные в .parquet файл."""
    if df.is_empty():
        print(f"⚠️  No data to save for {symbol}")
        return
    
    # Создаем директорию если не существует
    symbol_dir = DATA_DIR / symbol
    symbol_dir.mkdir(parents=True, exist_ok=True)
    
    # Путь к файлу
    file_path = symbol_dir / f"{timeframe}.parquet"
    
    # Сохраняем
    df.write_parquet(file_path)
    
    file_size = file_path.stat().st_size / 1024  # KB
    print(f"💾 Saved: {file_path} ({file_size:.1f} KB)")
    print(f"   Candles: {len(df)}")
    print(f"   Latest price: ${df['close'][-1]:,.2f}")
    print()


def main():
    """Главная функция."""
    print("=" * 60)
    print("🚀 TEZERAKT - Market Data Updater")
    print("=" * 60)
    print()
    
    print(f"📁 Data directory: {DATA_DIR}")
    print()
    
    # Таймфреймы для загрузки
    timeframes = {
        "1d": ("1d", 1000),  # (binance_interval, limit)
    }
    
    total_success = 0
    total_failed = 0
    
    # Загружаем данные для каждого символа
    for our_symbol, binance_symbol in SYMBOLS_MAP.items():
        print(f"📈 Processing {our_symbol} ({binance_symbol})...")
        print("-" * 60)
        
        for tf_name, (binance_tf, limit) in timeframes.items():
            # Загружаем данные
            klines = fetch_binance_klines(binance_symbol, binance_tf, limit)
            
            if not klines:
                print(f"❌ Failed to get data for {our_symbol} {tf_name}")
                total_failed += 1
                continue
            
            # Обрабатываем и сохраняем
            df = process_klines(klines)
            save_data(df, our_symbol, tf_name)
            
            total_success += 1
            
            # Небольшая задержка между запросами
            time.sleep(0.5)
        
        print()
    
    # Итоги
    print("=" * 60)
    print("✅ Update Complete!")
    print(f"   Success: {total_success}")
    print(f"   Failed: {total_failed}")
    print("=" * 60)
    print()
    print("💡 Next steps:")
    print("   1. Restart Backend API (if running)")
    print("   2. Refresh browser (F5)")
    print("   3. Charts will show latest data!")
    print()


if __name__ == "__main__":
    main()













