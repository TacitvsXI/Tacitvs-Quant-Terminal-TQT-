/**
 * 🔷 TEZERAKT QUANT TERMINAL - Data Panel Component
 * Industrial-style panel for metrics display
 */

'use client';

import React from 'react';

interface DataPanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const DataPanel: React.FC<DataPanelProps> = ({ 
  title, 
  children, 
  className = '',
  glow = false 
}) => {
  return (
    <div className={`panel p-4 ${glow ? 'border-glow' : ''} ${className}`}>
      {title && (
        <div className="mb-3 pb-2 border-b border-[var(--border)]">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--accent2)]">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

interface MetricCellProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'ok' | 'warning' | 'error' | 'neutral';
  glow?: boolean;
}

export const MetricCell: React.FC<MetricCellProps> = ({ 
  label, 
  value, 
  unit,
  status = 'neutral',
  glow = false 
}) => {
  const statusClass = `status-${status}`;
  
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-60">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`metric-cell text-xl ${statusClass} ${glow ? 'glow' : ''}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-[var(--fg)] opacity-40">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

interface GridMetricsProps {
  metrics: Array<{
    label: string;
    value: string | number;
    unit?: string;
    status?: 'ok' | 'warning' | 'error' | 'neutral';
  }>;
  columns?: number;
}

export const GridMetrics: React.FC<GridMetricsProps> = ({ 
  metrics, 
  columns = 3 
}) => {
  return (
    <div 
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {metrics.map((metric, i) => (
        <MetricCell key={i} {...metric} />
      ))}
    </div>
  );
};

