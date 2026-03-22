"""
DataStorage для сохранения/загрузки исторических данных в Parquet.

Функции:
- Сохранение DataFrame в Parquet (эффективное колончатое хранилище)
- Загрузка DataFrame из Parquet
- Проверка существования файлов
- Удаление файлов
- Список доступных данных
"""

import pandas as pd
from pathlib import Path
from typing import Optional, List


class DataStorage:
    """
    Класс для работы с локальным хранилищем данных в формате Parquet.
    
    Структура хранения:
    base_path/
        BTC-PERP/
            1d.parquet
            4h.parquet
            1h.parquet
        ETH-PERP/
            1d.parquet
            ...
    """
    
    def __init__(self, base_path: str = "data/historical"):
        """
        Инициализация DataStorage.
        
        base_path: Путь к базовой директории для хранения данных.
                   По умолчанию 'data/historical'.
        """
        self.base_path = Path(base_path)
        # Создаем базовую директорию если не существует
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def _get_file_path(self, market: str, interval: str) -> Path:
        """
        Получает полный путь к файлу для указанного рынка и интервала.
        
        market: Торговая пара (например, 'BTC-PERP').
        interval: Интервал свечей (например, '1d').
        
        Возвращает: Path объект с полным путем к файлу.
        """
        # Создаем директорию для market если не существует
        market_dir = self.base_path / market
        market_dir.mkdir(parents=True, exist_ok=True)
        
        # Полный путь к файлу
        file_path = market_dir / f"{interval}.parquet"
        return file_path
    
    def save(self, df: pd.DataFrame, market: str, interval: str) -> None:
        """
        Сохраняет DataFrame в Parquet файл.
        
        df: DataFrame с историческими данными.
        market: Торговая пара (например, 'BTC-PERP').
        interval: Интервал свечей (например, '1d').
        """
        if df.empty:
            print(f"⚠️  DataFrame пустой, пропускаем сохранение для {market}/{interval}")
            return
        
        file_path = self._get_file_path(market, interval)
        
        # Сохраняем в Parquet с сжатием
        df.to_parquet(
            file_path,
            engine='pyarrow',
            compression='snappy',  # Быстрое сжатие
            index=False  # Не сохраняем индекс как отдельную колонку
        )
        
        print(f"✅ Сохранено {len(df)} записей в {file_path}")
    
    def load(self, market: str, interval: str) -> Optional[pd.DataFrame]:
        """
        Загружает DataFrame из Parquet файла.
        
        market: Торговая пара (например, 'BTC-PERP').
        interval: Интервал свечей (например, '1d').
        
        Возвращает: DataFrame с данными или None если файл не существует.
        """
        file_path = self._get_file_path(market, interval)
        
        if not file_path.exists():
            print(f"⚠️  Файл не найден: {file_path}")
            return None
        
        # Загружаем из Parquet
        df = pd.read_parquet(file_path, engine='pyarrow')
        
        print(f"✅ Загружено {len(df)} записей из {file_path}")
        return df
    
    def exists(self, market: str, interval: str) -> bool:
        """
        Проверяет существует ли файл с данными.
        
        market: Торговая пара (например, 'BTC-PERP').
        interval: Интервал свечей (например, '1d').
        
        Возвращает: True если файл существует, False иначе.
        """
        file_path = self._get_file_path(market, interval)
        return file_path.exists()
    
    def delete(self, market: str, interval: str) -> bool:
        """
        Удаляет файл с данными.
        
        market: Торговая пара (например, 'BTC-PERP').
        interval: Интервал свечей (например, '1d').
        
        Возвращает: True если файл был удален, False если файл не существовал.
        """
        file_path = self._get_file_path(market, interval)
        
        if not file_path.exists():
            print(f"⚠️  Файл не найден, нечего удалять: {file_path}")
            return False
        
        # Удаляем файл
        file_path.unlink()
        print(f"✅ Удален файл: {file_path}")
        return True
    
    def list_available(self) -> List[str]:
        """
        Возвращает список всех доступных данных.
        
        Возвращает: Список строк в формате 'MARKET/INTERVAL' 
                   (например, ['BTC-PERP/1d', 'ETH-PERP/4h']).
        """
        available = []
        
        # Проходимся по всем директориям (markets)
        if not self.base_path.exists():
            return available
        
        for market_dir in self.base_path.iterdir():
            if market_dir.is_dir():
                market_name = market_dir.name
                
                # Проходимся по всем файлам в директории market
                for file_path in market_dir.iterdir():
                    if file_path.suffix == '.parquet':
                        interval = file_path.stem  # Имя файла без расширения
                        available.append(f"{market_name}/{interval}")
        
        return sorted(available)

