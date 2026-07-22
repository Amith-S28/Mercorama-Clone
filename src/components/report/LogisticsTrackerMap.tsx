'use client';

import { useState } from 'react';
import { Plane, Ship } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { ResizableCard } from '@/components/ui/ResizableCard';

export interface LogisticsTrackerMapProps {
  countryIso3: string;
}

const COUNTRY_COORDS: Record<string, { lat: number; lon: number; zoom: number }> = {
  USA: { lat: 39.8283, lon: -98.5795, zoom: 4 },
  CHN: { lat: 35.8617, lon: 104.1954, zoom: 4 },
  JPN: { lat: 36.2048, lon: 138.2529, zoom: 5 },
  DEU: { lat: 51.1657, lon: 10.4515, zoom: 6 },
  GBR: { lat: 55.3781, lon: -3.4360, zoom: 5 },
  FRA: { lat: 46.2276, lon: 2.2137, zoom: 5 },
  IND: { lat: 20.5937, lon: 78.9629, zoom: 4 },
  BRA: { lat: -14.2350, lon: -51.9253, zoom: 4 },
  AUS: { lat: -25.2744, lon: 133.7751, zoom: 4 },
  CAN: { lat: 56.1304, lon: -106.3468, zoom: 3 },
};

export function LogisticsTrackerMap({ countryIso3 }: LogisticsTrackerMapProps) {
  const [mode, setMode] = useState<'sea' | 'air'>('sea');
  
  const coords = COUNTRY_COORDS[countryIso3.toUpperCase()] || COUNTRY_COORDS['USA'];

  return (
    <ResizableCard defaultHeight={440} minHeight={280} maxHeight={800}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
            Live Logistics Tracker
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Monitoring inbound traffic to {countryIso3}
            </span>
            <LiveIndicator origin="live" sourceName={mode === 'sea' ? 'MarineTraffic' : 'FlightRadar24'} />
          </div>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--surface-muted)', padding: '0.25rem', borderRadius: '9999px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setMode('sea')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              mode === 'sea' ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Ship size={14} />
            Maritime
          </button>
          <button
            onClick={() => setMode('air')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              mode === 'air' ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Plane size={14} />
            Airspace
          </button>
        </div>
      </div>

      <div data-lenis-prevent style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {mode === 'sea' ? (
          <iframe
            src={`https://www.marinetraffic.com/en/ais/embed/zoom:${coords.zoom}/centery:${coords.lat}/centerx:${coords.lon}/maptype:1/shownames:false/mmsi:0/shipid:0/fleet:/fleet_id:/vtypes:`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            title="MarineTraffic Live Ships Map"
          />
        ) : (
          <iframe
            src={`https://www.flightradar24.com/simple_index.php?lat=${coords.lat}&lon=${coords.lon}&z=${coords.zoom}`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            title="FlightRadar24 Live Air Traffic Map"
          />
        )}
      </div>
    </ResizableCard>
  );
}
