/**
 * 🔷 TEZERAKT QUANT TERMINAL - Telemetry Strip
 * Bottom status bar with system telemetry
 */

'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const TelemetryStrip: React.FC = () => {
  const [time, setTime] = React.useState<string>('');
  const { apiConnected, setApiConnected, apiLatency, setApiLatency } = useAppStore();
  
  // Update time every second
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().slice(11, 19) + 'Z');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Ping API every 5 seconds to measure latency
  React.useEffect(() => {
    const pingAPI = async () => {
      try {
        const startTime = performance.now();
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          cache: 'no-store',
        });
        const endTime = performance.now();
        
        if (response.ok) {
          const latency = Math.round(endTime - startTime);
          setApiLatency(latency);
          setApiConnected(true);
        } else {
          setApiConnected(false);
          setApiLatency(null);
        }
      } catch (error) {
        setApiConnected(false);
        setApiLatency(null);
      }
    };
    
    // Ping immediately
    pingAPI();
    
    // Then ping every 5 seconds
    const interval = setInterval(pingAPI, 5000);
    
    return () => clearInterval(interval);
  }, [setApiConnected, setApiLatency]);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--panel)] z-50">
      <div className="max-w-[1800px] mx-auto px-6 py-2 flex items-center justify-between text-[10px] font-mono">
        {/* Left: System status */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div 
              className={`w-1.5 h-1.5 rounded-full ${
                apiConnected ? 'bg-[var(--accent)] pulse-slow' : 'bg-red-500'
              }`} 
            />
            <span className={apiConnected ? 'text-[var(--accent)]' : 'text-red-500'}>
              {apiConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          
          {/* API Latency */}
          <div className="text-[var(--fg)]">
            LATENCY: <span className={
              apiLatency === null ? 'text-red-500' :
              apiLatency < 50 ? 'text-[var(--accent)]' :
              apiLatency < 150 ? 'text-yellow-500' :
              'text-red-500'
            }>
              {apiLatency !== null ? `${apiLatency}ms` : '--'}
            </span>
          </div>
          
          {/* Feed Status */}
          <div className="text-[var(--fg)]">
            FEED: <span className={apiConnected ? 'text-[var(--accent)]' : 'text-red-500'}>
              {apiConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
        
        {/* Center: Build info */}
        <div className="text-[var(--fg)] opacity-40">
          TQT v0.1.0 | BUILD 2025.10.25
        </div>
        
        {/* Right: Time */}
        <div className="text-[var(--accent)]">
          {time}
        </div>
      </div>
    </div>
  );
};

