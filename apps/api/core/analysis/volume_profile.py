"""
Volume Profile Calculator

Calculates POC, Value Area, LVN/HVN zones from OHLCV data.
Based on Auction Market Theory principles.
"""

import pandas as pd
import polars as pl
import numpy as np
from typing import Union, Optional

from core.types import POC, ValueArea, VolumeNode, VolumeProfile


class VolumeProfileCalculator:
    """
    Calculate Volume Profile from OHLCV data.
    
    Volume Profile shows the distribution of trading volume at different price levels.
    Key components:
    - POC (Point of Control): Price with highest volume
    - Value Area: Price range containing ~70% of volume
    - LVN (Low Volume Nodes): Areas with <30% of average volume
    - HVN (High Volume Nodes): Areas with >150% of average volume
    
    Usage:
        calculator = VolumeProfileCalculator(ohlcv_data)
        profile = calculator.calculate()
        print(f"POC: ${profile.poc.price}")
    """
    
    def __init__(self, data: Union[pd.DataFrame, pl.DataFrame]):
        """
        Initialize calculator with OHLCV data.
        
        Args:
            data: DataFrame with columns: timestamp, open, high, low, close, volume
        
        Raises:
            ValueError: If data is empty or missing required columns
        """
        if isinstance(data, pl.DataFrame):
            data = data.to_pandas()
        
        if len(data) == 0:
            raise ValueError("DataFrame cannot be empty")
        
        required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        missing = [col for col in required_cols if col not in data.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")
        
        self.data = data.copy()
        self.total_volume = float(self.data['volume'].sum())
        self.avg_volume = float(self.data['volume'].mean())
        
        # Will be set during calculation
        self._profile_bins: Optional[pd.DataFrame] = None
        self._poc: Optional[POC] = None
        self._value_area: Optional[ValueArea] = None
    
    def calculate(self, bin_size: Optional[float] = None) -> VolumeProfile:
        """
        Calculate complete Volume Profile.
        
        Args:
            bin_size: Price bin size for histogram. If None, auto-calculated.
        
        Returns:
            VolumeProfile with POC, Value Area, LVN/HVN zones
        """
        # Build volume histogram
        self._build_profile_histogram(bin_size)
        
        # Calculate components
        poc = self.calculate_poc()
        value_area = self.calculate_value_area()
        lvn_zones = self.identify_lvn()
        hvn_zones = self.identify_hvn()
        
        # Build profile data for visualization
        profile_data = self._profile_bins[['price_bin', 'volume']].rename(
            columns={'price_bin': 'price'}
        ).to_dict('records')
        
        return VolumeProfile(
            poc=poc,
            value_area=value_area,
            lvn_zones=lvn_zones,
            hvn_zones=hvn_zones,
            profile_data=profile_data,
            total_volume=self.total_volume,
            avg_volume=self.avg_volume,
            candle_count=len(self.data),
            timestamp_start=int(self.data['timestamp'].iloc[0]),
            timestamp_end=int(self.data['timestamp'].iloc[-1])
        )
    
    def calculate_poc(self) -> POC:
        """
        Calculate Point of Control (price with highest volume).
        
        Returns:
            POC object with price, volume, and index
        """
        if self._profile_bins is None:
            self._build_profile_histogram()
        
        if self._poc is not None:
            return self._poc
        
        # Find price bin with maximum volume
        max_idx = self._profile_bins['volume'].idxmax()
        max_row = self._profile_bins.loc[max_idx]
        
        self._poc = POC(
            price=float(max_row['price_bin']),
            volume=float(max_row['volume']),
            index=int(max_idx)
        )
        
        return self._poc
    
    def calculate_value_area(self, percentage: float = 0.70) -> ValueArea:
        """
        Calculate Value Area (price range containing ~70% of volume).
        
        Algorithm:
        1. Start from POC
        2. Expand up/down, adding bins with highest volume
        3. Stop when accumulated volume >= target percentage
        
        Args:
            percentage: Target volume percentage (default 0.70 for 70%)
        
        Returns:
            ValueArea with high, low, actual percentage, and range width
        """
        if self._profile_bins is None:
            self._build_profile_histogram()
        
        if self._poc is None:
            self.calculate_poc()
        
        target_volume = self.total_volume * percentage
        accumulated_volume = self._poc.volume
        
        # Start from POC index
        poc_idx = self._poc.index
        lower_idx = poc_idx
        upper_idx = poc_idx
        
        # Expand VA up and down
        while accumulated_volume < target_volume:
            # Check which side to expand
            can_go_lower = lower_idx > 0
            can_go_upper = upper_idx < len(self._profile_bins) - 1
            
            if not can_go_lower and not can_go_upper:
                break
            
            # Get volume at boundaries
            lower_vol = self._profile_bins.iloc[lower_idx - 1]['volume'] if can_go_lower else 0
            upper_vol = self._profile_bins.iloc[upper_idx + 1]['volume'] if can_go_upper else 0
            
            # Expand to side with more volume
            if lower_vol >= upper_vol and can_go_lower:
                lower_idx -= 1
                accumulated_volume += lower_vol
            elif can_go_upper:
                upper_idx += 1
                accumulated_volume += upper_vol
        
        # Extract VAH and VAL
        vah = float(self._profile_bins.iloc[upper_idx]['price_bin'])
        val = float(self._profile_bins.iloc[lower_idx]['price_bin'])
        actual_pct = accumulated_volume / self.total_volume
        range_pct = ((vah - val) / val) * 100 if val > 0 else 0
        
        self._value_area = ValueArea(
            high=vah,
            low=val,
            volume_pct=actual_pct,
            range_pct=range_pct
        )
        
        return self._value_area
    
    def identify_lvn(self, threshold: float = 0.3) -> list[VolumeNode]:
        """
        Identify Low Volume Nodes (gaps in volume distribution).
        
        LVN zones are areas where volume is significantly below average.
        These are key levels for entries in trend continuation setups.
        
        Args:
            threshold: Volume threshold as fraction of average (default 0.3 = 30%)
        
        Returns:
            List of VolumeNode objects representing LVN zones
        """
        if self._profile_bins is None:
            self._build_profile_histogram()
        
        lvn_threshold = self.avg_volume * threshold
        lvn_bins = self._profile_bins[self._profile_bins['volume'] < lvn_threshold]
        
        # Group consecutive LVN bins into zones
        lvn_zones = []
        if len(lvn_bins) > 0:
            # Simple approach: each LVN bin becomes a zone
            # TODO: Could merge consecutive bins for cleaner zones
            for _, row in lvn_bins.iterrows():
                price = float(row['price_bin'])
                volume = float(row['volume'])
                bin_width = float(row['bin_width'])
                
                lvn_zones.append(VolumeNode(
                    price=price,
                    volume=volume,
                    range_low=price - bin_width / 2,
                    range_high=price + bin_width / 2,
                    is_gap=True
                ))
        
        return lvn_zones
    
    def identify_hvn(self, threshold: float = 1.5) -> list[VolumeNode]:
        """
        Identify High Volume Nodes (areas of high activity).
        
        HVN zones are where significant trading occurred.
        These act as support/resistance and balance areas.
        
        Args:
            threshold: Volume threshold as multiple of average (default 1.5 = 150%)
        
        Returns:
            List of VolumeNode objects representing HVN zones
        """
        if self._profile_bins is None:
            self._build_profile_histogram()
        
        hvn_threshold = self.avg_volume * threshold
        hvn_bins = self._profile_bins[self._profile_bins['volume'] > hvn_threshold]
        
        hvn_zones = []
        for _, row in hvn_bins.iterrows():
            price = float(row['price_bin'])
            volume = float(row['volume'])
            bin_width = float(row['bin_width'])
            
            hvn_zones.append(VolumeNode(
                price=price,
                volume=volume,
                range_low=price - bin_width / 2,
                range_high=price + bin_width / 2,
                is_gap=False
            ))
        
        return hvn_zones
    
    def calculate_fixed_range(
        self,
        start_timestamp: int,
        end_timestamp: int,
        bin_size: Optional[float] = None
    ) -> VolumeProfile:
        """
        Calculate Volume Profile for a specific time range.
        
        Useful for analyzing specific impulses or movements.
        
        Args:
            start_timestamp: Start time (Unix seconds)
            end_timestamp: End time (Unix seconds)
            bin_size: Price bin size
        
        Returns:
            VolumeProfile for the specified range
        """
        # Filter data to range
        mask = (self.data['timestamp'] >= start_timestamp) & \
               (self.data['timestamp'] <= end_timestamp)
        range_data = self.data[mask].copy()
        
        if len(range_data) == 0:
            raise ValueError(f"No data in range {start_timestamp} to {end_timestamp}")
        
        # Create new calculator for this range
        range_calculator = VolumeProfileCalculator(range_data)
        return range_calculator.calculate(bin_size)
    
    def _build_profile_histogram(self, bin_size: Optional[float] = None):
        """
        Build volume histogram by price bins.
        
        This creates the foundation for all Volume Profile calculations.
        
        Args:
            bin_size: Size of price bins. If None, auto-calculated based on data.
        """
        # Get price range
        min_price = self.data['low'].min()
        max_price = self.data['high'].max()
        price_range = max_price - min_price
        
        # Auto-calculate bin size if not provided
        if bin_size is None:
            # Aim for ~50-100 bins for good resolution
            num_bins = min(100, max(50, len(self.data) // 2))
            bin_size = price_range / num_bins
        
        # Create price bins
        bins = np.arange(min_price, max_price + bin_size, bin_size)
        
        # Allocate volume to bins
        # For each candle, distribute its volume across bins it touches
        bin_volumes = np.zeros(len(bins) - 1)
        
        for _, candle in self.data.iterrows():
            candle_low = candle['low']
            candle_high = candle['high']
            candle_volume = candle['volume']
            
            # Find bins this candle touches
            low_bin = np.searchsorted(bins, candle_low, side='right') - 1
            high_bin = np.searchsorted(bins, candle_high, side='right') - 1
            
            # Ensure within bounds
            low_bin = max(0, min(low_bin, len(bin_volumes) - 1))
            high_bin = max(0, min(high_bin, len(bin_volumes) - 1))
            
            # Distribute volume across touched bins
            num_bins_touched = high_bin - low_bin + 1
            volume_per_bin = candle_volume / num_bins_touched if num_bins_touched > 0 else candle_volume
            
            for bin_idx in range(low_bin, high_bin + 1):
                if 0 <= bin_idx < len(bin_volumes):
                    bin_volumes[bin_idx] += volume_per_bin
        
        # Create DataFrame with bin centers
        bin_centers = (bins[:-1] + bins[1:]) / 2
        
        self._profile_bins = pd.DataFrame({
            'price_bin': bin_centers,
            'volume': bin_volumes,
            'bin_width': bin_size
        })

