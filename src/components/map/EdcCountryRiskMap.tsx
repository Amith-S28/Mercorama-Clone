'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Mercator } from '@visx/geo';
import { Zoom } from '@visx/zoom';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { Topology } from 'topojson-specification';
import {
  COUNTRY_RISK_DATA,
  getCountryForNumericId,
  getRiskTierForNumericId,
  ISO3_TO_NUM,
  TIER_COLORS,
} from '@/lib/country-risk-data';
import { mapScrollScale } from '@/lib/animation/presets';

const WORLD_ATLAS_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const CANADA = { lon: -96, lat: 56 };

export interface EdcCountryRiskMapProps {
  selectedIso3?: string | null;
  onSelectCountry?: (iso3: string) => void;
  width?: number;
  height?: number;
}

type CountryFeature = Feature<Geometry, GeoJsonProperties>;

function tierFill(tier: ReturnType<typeof getRiskTierForNumericId>): string {
  if (tier === 'blocked') return '#991B1B';
  return TIER_COLORS[tier === 'restricted' ? 'restricted' : tier] ?? TIER_COLORS['no-data'];
}

function getRoughCentroid(feature: Feature): { lon: number; lat: number } | null {
  if (!feature.geometry) return null;
  const geom = feature.geometry;
  let coords = null;
  if (geom.type === 'Polygon') {
    coords = geom.coordinates[0]?.[Math.floor((geom.coordinates[0]?.length || 0) / 2)];
  } else if (geom.type === 'MultiPolygon') {
    coords = geom.coordinates[0]?.[0]?.[Math.floor((geom.coordinates[0]?.[0]?.length || 0) / 2)];
  }
  if (coords) {
    return { lon: coords[0], lat: coords[1] };
  }
  return null;
}

export function EdcCountryRiskMap({
  selectedIso3,
  onSelectCountry,
  width = 720,
  height = 380,
}: EdcCountryRiskMapProps) {
  const [worldData, setWorldData] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWorld() {
      try {
        const res = await fetch(WORLD_ATLAS_URL);
        if (!res.ok) throw new Error('Failed to load world atlas');
        const topology = (await res.json()) as Topology;
        const countries = topology.objects.countries;
        if (!countries) throw new Error('Missing countries topology');
        const geo = feature(topology, countries) as FeatureCollection;
        if (!cancelled) setWorldData(geo);
      } catch {
        if (!cancelled) {
          setLoadError('Map data unavailable');
          setWorldData(buildMinimalWorld());
        }
      }
    }

    void loadWorld();
    return () => {
      cancelled = true;
    };
  }, []);

  const knownNumericIds = useMemo(() => new Set(Object.values(ISO3_TO_NUM)), []);

  const handleCountryClick = useCallback(
    (numId: string) => {
      const entry = getCountryForNumericId(numId);
      if (entry && onSelectCountry) onSelectCountry(entry.iso3);
    },
    [onSelectCountry]
  );

  const targetCountryFeature = useMemo(() => {
    if (!worldData || !selectedIso3) return null;
    const numId = ISO3_TO_NUM[selectedIso3];
    return worldData.features.find((f: Feature) => String(f.id) === numId) as CountryFeature | undefined;
  }, [worldData, selectedIso3]);

  const targetCentroid = useMemo(() => {
    if (!targetCountryFeature) return null;
    return getRoughCentroid(targetCountryFeature);
  }, [targetCountryFeature]);

  return (
    <motion.div {...mapScrollScale}>
      <div>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
          EDC Country Risk Map
        </p>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Click a market to open country playbook. Scroll/pinch to zoom.
        </p>
      </div>

      {loadError ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{loadError} — using fallback</p>
      ) : null}

      {!worldData ? (
        <div
          style={{
            width,
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '0.8125rem',
          }}
        >
          Loading map…
        </div>
      ) : (
        <Zoom<SVGSVGElement>
          width={width}
          height={height}
          scaleXMin={1}
          scaleXMax={8}
          scaleYMin={1}
          scaleYMax={8}
          initialTransformMatrix={{ scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, skewX: 0, skewY: 0 }}
        >
          {(zoom) => (
            <div style={{ position: 'relative', width, height, overflow: 'hidden', cursor: zoom.isDragging ? 'grabbing' : 'grab' }}>
              <svg
                width={width}
                height={height}
                ref={zoom.containerRef}
                style={{ touchAction: 'none', background: 'var(--map-bg)', borderRadius: 'var(--radius-interactive)' }}
                role="img"
                aria-label="Country risk map"
              >
                <g transform={zoom.toString()}>
                  <Mercator data={worldData.features as CountryFeature[]} scale={110} translate={[width / 2, height / 1.55]}>
                    {(mercator) => (
                      <g>
                        {mercator.features.map(({ feature: country, path }, i) => {
                          const numId = String((country as CountryFeature).id ?? '');
                          const tier = getRiskTierForNumericId(numId);
                          const entry = getCountryForNumericId(numId);
                          const isSelected = entry?.iso3 === selectedIso3;
                          const isKnown = knownNumericIds.has(numId);

                          return (
                            <path
                              key={`country-${numId || i}`}
                              d={path ?? undefined}
                              fill={isKnown ? tierFill(tier) : 'var(--map-inactive)'}
                              fillOpacity={isKnown ? (isSelected ? 0.95 : 0.72) : 1.0}
                              stroke={isSelected ? 'var(--accent-premium)' : 'var(--map-border)'}
                              strokeWidth={isSelected ? 1.5 / zoom.transformMatrix.scaleX : 0.5 / zoom.transformMatrix.scaleX}
                              style={{ cursor: isKnown ? 'pointer' : 'default' }}
                              onClick={(e) => {
                                if (isKnown) {
                                  e.stopPropagation();
                                  handleCountryClick(numId);
                                }
                              }}
                            />
                          );
                        })}

                        {/* Dynamic route from Canada to Selected Country */}
                        {targetCentroid && (
                          <g>
                            {(() => {
                              const from = mercator.projection([CANADA.lon, CANADA.lat]);
                              const to = mercator.projection([targetCentroid.lon, targetCentroid.lat]);
                              if (!from || !to) return null;
                              
                              const midX = (from[0] + to[0]) / 2;
                              // Ensure the curve goes "up" (north) visually on a mercator projection
                              const midY = Math.min(from[1], to[1]) - Math.abs(from[0] - to[0]) * 0.2;
                              const d = `M${from[0]},${from[1]} Q${midX},${midY} ${to[0]},${to[1]}`;
                              
                              return (
                                <>
                                  <path
                                    d={d}
                                    fill="none"
                                    stroke="var(--accent-premium)"
                                    strokeWidth={2 / zoom.transformMatrix.scaleX}
                                    strokeDasharray={`${6 / zoom.transformMatrix.scaleX} ${4 / zoom.transformMatrix.scaleX}`}
                                    opacity={0.8}
                                    className="shipping-lane"
                                  />
                                  <circle cx={from[0]} cy={from[1]} r={3 / zoom.transformMatrix.scaleX} fill="var(--accent-premium)" />
                                  <circle cx={to[0]} cy={to[1]} r={3 / zoom.transformMatrix.scaleX} fill="#10b981" />
                                </>
                              );
                            })()}
                          </g>
                        )}
                      </g>
                    )}
                  </Mercator>
                </g>
                
                {/* Legend - stays fixed, outside the zoom group */}
                <g transform={`translate(12, ${height - 12})`}>
                  {(['open', 'watch', 'restricted'] as const).map((tier, i) => (
                    <g key={tier} transform={`translate(0, ${-i * 18})`}>
                      <rect width={10} height={10} fill={TIER_COLORS[tier]} rx={2} />
                      <text
                        x={16}
                        y={9}
                        fill="var(--text-secondary)"
                        fontSize={10}
                        fontFamily="var(--font-jetbrains-mono)"
                      >
                        {tier}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
              {/* Zoom controls */}
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => zoom.scale({ scaleX: 1.2, scaleY: 1.2 })}
                  style={{ width: 24, height: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => zoom.scale({ scaleX: 0.8, scaleY: 0.8 })}
                  style={{ width: 24, height: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={zoom.reset}
                  style={{ padding: '2px 4px', fontSize: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </Zoom>
      )}

      <p
        className="mono-label"
        style={{ marginTop: '0.75rem', fontSize: '0.625rem', color: 'var(--text-tertiary)' }}
      >
        {COUNTRY_RISK_DATA.length} EDC-tracked markets
      </p>
    </motion.div>
  );
}

function buildMinimalWorld(): FeatureCollection {
  const features: CountryFeature[] = COUNTRY_RISK_DATA.map((entry) => {
    const numId = ISO3_TO_NUM[entry.iso3];
    const seed = numId ? Number(numId) : 0;
    const lon = ((seed % 360) - 180) * 0.4;
    const lat = 20 + (seed % 40);
    return {
      type: 'Feature',
      id: numId,
      properties: { name: entry.name },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [lon, lat],
            [lon + 8, lat],
            [lon + 8, lat + 6],
            [lon, lat + 6],
            [lon, lat],
          ],
        ],
      },
    };
  });

  return { type: 'FeatureCollection', features };
}
