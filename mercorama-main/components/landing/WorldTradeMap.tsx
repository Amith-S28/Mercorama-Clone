'use client';

import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const CANADA_ID = '124';
const CANADA: [number, number] = [-96, 60];

const DESTINATIONS: { coords: [number, number]; label: string }[] = [
  { coords: [10, 51],   label: 'Germany' },
  { coords: [55, 23],   label: 'UAE' },
  { coords: [138, 36],  label: 'Japan' },
  { coords: [134, -25], label: 'Australia' },
  { coords: [-47, -15], label: 'Brazil' },
  { coords: [78, 21],   label: 'India' },
];

export function WorldTradeMap() {
  return (
    <div className="w-full h-full bg-[#dce8f5] rounded-2xl overflow-hidden relative shadow-md">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 160, center: [10, 10] }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isCanada = geo.id === CANADA_ID;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isCanada ? '#0b2a4a' : '#a8c8e0'}
                  stroke="#c8dcea"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Trade lines from Canada to destinations */}
        {DESTINATIONS.map((dest) => (
          <Line
            key={dest.label}
            from={CANADA}
            to={dest.coords}
            stroke="#0d6e74"
            strokeWidth={1.8}
            strokeDasharray="6 4"
            strokeLinecap="round"
            style={{ opacity: 0.85 }}
          />
        ))}

        {/* Canada origin marker */}
        <Marker coordinates={CANADA}>
          <circle r={7} fill="#0b1f3a" stroke="#0d6e74" strokeWidth={2.5} />
          <circle r={3} fill="#fff" />
        </Marker>

        {/* Destination markers */}
        {DESTINATIONS.map((dest) => (
          <Marker key={dest.label} coordinates={dest.coords}>
            <circle r={5} fill="#0d6e74" stroke="#fff" strokeWidth={1.5} opacity={0.95} />
          </Marker>
        ))}
      </ComposableMap>

      {/* 72% stat card */}
      <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg px-5 py-4 max-w-[160px]">
        <p className="text-4xl font-extrabold text-[#0b1f3a]">72%</p>
        <p className="text-xs text-gray-600 mt-1 leading-snug">of Canadian exports go to a single market.</p>
        <p className="text-[10px] text-gray-400 mt-2">Source: Statistics Canada</p>
      </div>
    </div>
  );
}
