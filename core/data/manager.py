"""
DataManager - unified interface для работы с историческими данными.

Объединяет:
- HyperliquidClient (API запросы)
- DataFetcher (валидация)
- DataStorage (локальное хранилище)

Предоставляет простой API:
- get_candles() - получить данные (с кэшированием)
- update_candles() - обновить существующие данные
- get_multiple_markets() - загрузить несколько рынков
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Union
from core.data.hyperliquid_client import HyperliquidClient
from core.data.fetcher import DataFetcher
from core.data.storage import DataStorage


class DataManager:
    """
    Unified interface для работы с данными.
    
    Автоматически:
    - Проверяет наличие данных локально
    - Загружает с API если отсутствуют
    - Кэширует в Parquet
    - Обновляет устаревшие данные
    """
    
    # Валидные интервалы (совпадают с HyperliquidClient)
    VALID_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d']
    
    def __init__(
        self,
        client: Optional[HyperliquidClient] = None,
        fetcher: Optional[DataFetcher] = None,
        storage: Optional[DataStorage] = None
    ):
        """
        Инициализация DataManager.
        
        client: HyperliquidClient (если None, создается автоматически).
        fetcher: DataFetcher (если None, создается автоматически).
        storage: DataStorage (если None, создается автоматически).
        """
        # Создаем dependencies если не переданы (для продакшена)
        self.client = client or HyperliquidClient()
        self.fetcher = fetcher or DataFetcher(self.client)
        self.storage = storage or DataStorage()
        # Track whether last request was from cache
        self.last_from_cache = False
    
    def get_candles(
        self,
        market: str,
        interval: str,
        days_back: int = 30,
        force_refresh: bool = False
    ) -> pd.DataFrame:
        """
        Получить свечи для указанного рынка.
        
        Логика:
        1. Если force_refresh=True, загружаем с API
        2. Если данные есть локально, загружаем из storage
        3. Если данных нет, загружаем с API и сохраняем
        
        market: Торговая пара (например, 'BTC-PERP').
        interval: Интервал свечей ('1d', '4h', и т.д.).
        days_back: Сколько дней истории загрузить (по умолчанию 30).
        force_refresh: Если True, игнорируем кэш и загружаем с API.
        
        Возвращает: DataFrame с OHLCV данными.
        """
        # Валидация interval
        if interval not in self.VALID_INTERVALS:
            raise ValueError(
                f"Invalid interval: {interval}. "
                f"Must be one of {self.VALID_INTERVALS}"
            )
        
        # Если force_refresh, загружаем с API
        if force_refresh:
            print(f"🔄 Force refresh: загружаем {market}/{interval} с API...")
            self.last_from_cache = False
            df = self._fetch_from_api(market, interval, days_back)
            self.storage.save(df=df, market=market, interval=interval)
            return df
        
        # Проверяем наличие данных локально
        if self.storage.exists(market=market, interval=interval):
            print(f"📦 Загружаем {market}/{interval} из кэша...")
            self.last_from_cache = True
            return self.storage.load(market=market, interval=interval)
        
        # Данных нет - загружаем с API
        print(f"📥 Загружаем {market}/{interval} с API (первый раз)...")
        self.last_from_cache = False
        df = self._fetch_from_api(market, interval, days_back)
        self.storage.save(df=df, market=market, interval=interval)
        return df
    
    def _fetch_from_api(
        self,
        market: str,
        interval: str,
        days_back: int
    ) -> pd.DataFrame:
        """
        Внутренний метод для загрузки данных с API.
        
        market: Торговая пара.
        interval: Интервал свечей.
        days_back: Сколько дней назад.
        
        Возвращает: DataFrame с данными.
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        df = self.fetcher.fetch_historical(
            market=market,
            interval=interval,
            start_date=start_date,
            end_date=end_date,
            validate=True
        )
        
        return df
    
    def get_multiple_markets(
        self,
        markets: List[str],
        interval: str,
        days_back: int = 30,
        force_refresh: bool = False
    ) -> Dict[str, pd.DataFrame]:
        """
        Получить данные для нескольких рынков.
        
        markets: Список торговых пар (например, ['BTC-PERP', 'ETH-PERP']).
        interval: Интервал свечей.
        days_back: Сколько дней истории.
        force_refresh: Игнорировать кэш.
        
        Возвращает: Словарь {market: DataFrame}.
        """
        result = {}
        
        for market in markets:
            print(f"\n📊 Обрабатываем {market}...")
            df = self.get_candles(
                market=market,
                interval=interval,
                days_back=days_back,
                force_refresh=force_refresh
            )
            result[market] = df
        
        print(f"\n✅ Загружено {len(result)} рынков")
        return result
    
    def update_candles(
        self,
        market: str,
        interval: str,
        end_date: Optional[datetime] = None
    ) -> pd.DataFrame:
        """
        Обновить существующие данные новыми свечами.
        
        Загружает только новые данные (после последней свечи) и объединяет
        со старыми данными.
        
        market: Торговая пара.
        interval: Интервал свечей.
        end_date: До какой даты обновить (по умолчанию - сейчас).
        
        Возвращает: Обновленный DataFrame.
        """
        if end_date is None:
            end_date = datetime.now()
        
        # Проверяем наличие старых данных
        if not self.storage.exists(market=market, interval=interval):
            print(f"⚠️  Старые данные не найдены, загружаем с нуля...")
            return self.get_candles(market=market, interval=interval)
        
        # Загружаем старые данные
        old_df = self.storage.load(market=market, interval=interval)
        
        # Находим последнюю дату в старых данных
        if 'timestamp' in old_df.columns:
            last_timestamp = old_df['timestamp'].max()
        else:
            # timestamp может быть в индексе
            last_timestamp = old_df.index.max()
        
        # Конвертируем в datetime если нужно
        if isinstance(last_timestamp, (int, float)):
            last_timestamp = pd.to_datetime(last_timestamp, unit='ms')
        
        # Добавляем 1 день к последней дате (чтобы не дублировать)
        start_date = last_timestamp + timedelta(days=1)
        
        print(f"🔄 Обновляем {market}/{interval} с {start_date.date()} по {end_date.date()}...")
        
        # Если start_date >= end_date, нечего обновлять
        if start_date >= end_date:
            print(f"✅ Данные уже актуальны")
            return old_df
        
        # Загружаем новые данные
        new_df = self.fetcher.fetch_historical(
            market=market,
            interval=interval,
            start_date=start_date,
            end_date=end_date,
            validate=True
        )
        
        if new_df.empty:
            print(f"✅ Новых данных нет")
            return old_df
        
        # Объединяем старые и новые данные
        combined_df = pd.concat([old_df, new_df], ignore_index=True)
        
        # Удаляем дубликаты по timestamp
        if 'timestamp' in combined_df.columns:
            combined_df = combined_df.drop_duplicates(subset=['timestamp'], keep='last')
            combined_df = combined_df.sort_values('timestamp').reset_index(drop=True)
        
        # Сохраняем обновленные данные
        self.storage.save(df=combined_df, market=market, interval=interval)
        
        print(f"✅ Добавлено {len(new_df)} новых свечей")
        return combined_df
    
    def list_available(self) -> List[str]:
        """
        Получить список всех доступных данных в storage.
        
        Возвращает: Список строк вида 'MARKET/INTERVAL'.
        """
        return self.storage.list_available()
    
    def delete(self, market: str, interval: str) -> bool:
        """
        Удалить данные для указанного рынка и интервала.
        
        market: Торговая пара.
        interval: Интервал свечей.
        
        Возвращает: True если данные были удалены, False если не существовали.
        """
        return self.storage.delete(market=market, interval=interval)
    
    def __repr__(self) -> str:
        available = self.list_available()
        return f"DataManager(available_datasets={len(available)})"

