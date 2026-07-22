'use client';

import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/* ── Node + line data ─────────────────────────────────────────────────────── */

const NODES = [
  {
    id: 'hscode',
    label: 'HS Code Intelligence',
    sub: 'Classify any product',
    href: '/hscode',
    // rect bounds
    x: 330, y: 58, w: 140, h: 56,
    // text centres
    tx: 400, ty1: 80, ty2: 95,
    // line: from hub edge → node near edge
    lx1: 400, ly1: 178, lx2: 400, ly2: 114,
    lineLen: 64,
  },
  {
    id: 'incoterms',
    label: 'Incoterms Navigator',
    sub: 'Know who pays, who risks',
    href: '/incoterms',
    x: 140, y: 100, w: 140, h: 56,
    tx: 210, ty1: 122, ty2: 137,
    lx1: 368, ly1: 193, lx2: 280, ly2: 140,
    lineLen: 120,
  },
  {
    id: 'compass',
    label: 'Export Compass',
    sub: 'Find your best export market',
    href: '/export-compass',
    x: 520, y: 100, w: 140, h: 56,
    tx: 590, ty1: 122, ty2: 137,
    lx1: 432, ly1: 193, lx2: 520, ly2: 140,
    lineLen: 120,
  },
  {
    id: 'deal',
    label: 'Deal Wizard',
    sub: 'Structure your trade deal',
    href: '/deal',
    x: 140, y: 270, w: 140, h: 56,
    tx: 210, ty1: 292, ty2: 307,
    lx1: 368, ly1: 227, lx2: 280, ly2: 280,
    lineLen: 120,
  },
  {
    id: 'fta',
    label: 'FTA Diversify',
    sub: 'Cut tariffs with trade deals',
    href: '/fta-diversify',
    x: 520, y: 270, w: 140, h: 56,
    tx: 590, ty1: 292, ty2: 307,
    lx1: 432, ly1: 227, lx2: 520, ly2: 280,
    lineLen: 120,
  },
  {
    id: 'summary',
    label: 'Deal Wizard',
    sub: 'Build your export plan',
    href: '/deal',
    x: 330, y: 310, w: 140, h: 56,
    tx: 400, ty1: 332, ty2: 347,
    lx1: 400, ly1: 242, lx2: 400, ly2: 310,
    lineLen: 68,
  },
];

const LINE_COLOR   = '#4a9eff';
const NODE_BORDER  = '#4f98a3';
const LABEL_COLOR  = '#e2e8f0';
const SUB_COLOR    = '#94a3b8';
const NODE_FILL    = '#0d2240';

/* ── Mobile card list (< md) ─────────────────────────────────────────────── */

function MobileList() {
  return (
    <div className="grid grid-cols-2 gap-3 md:hidden">
      {NODES.map((n) => (
        <a
          key={n.id}
          href={n.href}
          className="rounded-xl border border-[#4f98a3]/40 bg-[#0d2240] px-3 py-3 hover:border-[#4a9eff] transition-colors"
        >
          <p className="text-xs font-bold text-[#e2e8f0] leading-tight mb-1">{n.label}</p>
          <p className="text-[11px] text-[#94a3b8] leading-snug">{n.sub}</p>
        </a>
      ))}
    </div>
  );
}

/* ── Main diagram ─────────────────────────────────────────────────────────── */

export function PlatformDiagram() {
  const ref             = useRef<HTMLDivElement>(null);
  const inView          = useInView(ref, { once: true, margin: '-80px' });
  const reducedMotion   = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  const show = reducedMotion ? true : inView;

  return (
    <div ref={ref}>
      {/* ── Desktop SVG ── */}
      <div className="hidden md:block rounded-2xl border border-[#1a3a5c] bg-[#0B1F3A] p-6 sm:p-8 overflow-hidden">
        <svg
          viewBox="0 0 800 420"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          aria-label="Mercorama platform diagram — six tools connect to a central hub"
        >
          {/* ── Connector lines ─────────────────────────────────────────── */}
          {NODES.map((n, i) => {
            const dimmed = hovered && hovered !== n.id;
            return (
              <motion.line
                key={`line-${n.id}`}
                x1={n.lx1} y1={n.ly1} x2={n.lx2} y2={n.ly2}
                stroke={LINE_COLOR}
                strokeWidth="1.8"
                strokeDasharray={`${n.lineLen}`}
                strokeLinecap="round"
                initial={{ strokeDashoffset: n.lineLen, opacity: 0 }}
                animate={
                  show
                    ? { strokeDashoffset: 0, opacity: dimmed ? 0.2 : 0.7 }
                    : { strokeDashoffset: n.lineLen, opacity: 0 }
                }
                transition={{
                  strokeDashoffset: { duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.5 + i * 0.08, ease: 'easeOut' },
                  opacity:           { duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 0.5 + i * 0.08 },
                }}
              />
            );
          })}

          {/* ── Tool nodes ──────────────────────────────────────────────── */}
          {NODES.map((n, i) => {
            const dimmed = hovered && hovered !== n.id;
            return (
              <motion.g
                key={`node-${n.id}`}
                style={{ cursor: 'pointer' }}
                initial={{ opacity: 0, y: 10 }}
                animate={
                  show
                    ? { opacity: dimmed ? 0.35 : 1, y: 0 }
                    : { opacity: 0, y: 10 }
                }
                transition={{
                  opacity: { duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.7 + i * 0.09 },
                  y:       { duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.7 + i * 0.09, ease: 'easeOut' },
                }}
                onHoverStart={() => setHovered(n.id)}
                onHoverEnd={() => setHovered(null)}
                onClick={() => { window.location.href = n.href; }}
              >
                <motion.rect
                  x={n.x} y={n.y} width={n.w} height={n.h}
                  rx="10"
                  fill={NODE_FILL}
                  stroke={NODE_BORDER}
                  strokeWidth="1.5"
                  whileHover={{ stroke: '#4a9eff', strokeWidth: 2 }}
                />
                <text
                  x={n.tx} y={n.ty1}
                  textAnchor="middle"
                  fill={LABEL_COLOR}
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  {n.label}
                </text>
                <text
                  x={n.tx} y={n.ty2}
                  textAnchor="middle"
                  fill={SUB_COLOR}
                  fontSize="8.5"
                  fontFamily="sans-serif"
                >
                  {n.sub}
                </text>
              </motion.g>
            );
          })}

          {/* ── Centre hub ──────────────────────────────────────────────── */}
          {/* Outer glow rings */}
          <motion.circle
            cx="400" cy="210" r="68"
            fill="#1F6FEB"
            initial={{ opacity: 0, scale: 0 }}
            animate={show ? { opacity: 0.08 } : { opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.2 }}
            style={{ originX: '400px', originY: '210px' }}
          />
          <motion.circle
            cx="400" cy="210" r="50"
            fill="#1F6FEB"
            initial={{ opacity: 0 }}
            animate={show ? { opacity: 0.15 } : { opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.25 }}
          />
          {/* Breathing ring (continuous) */}
          {!reducedMotion && (
            <motion.circle
              cx="400" cy="210" r="50"
              fill="none"
              stroke="#4a9eff"
              strokeWidth="1"
              initial={{ opacity: 0, scale: 1 }}
              animate={show ? { opacity: [0, 0.4, 0], scale: [1, 1.18, 1] } : { opacity: 0 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              style={{ originX: '400px', originY: '210px' }}
            />
          )}
          {/* Core circle */}
          <motion.circle
            cx="400" cy="210" r="36"
            fill="#1F6FEB"
            initial={{ scale: 0, opacity: 0 }}
            animate={show ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut', delay: reducedMotion ? 0 : 0.2 }}
            style={{ originX: '400px', originY: '210px' }}
          />
          <motion.text
            x="400" y="206"
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontWeight="800"
            fontFamily="sans-serif"
            initial={{ opacity: 0 }}
            animate={show ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 0.45 }}
          >
            MERCO
          </motion.text>
          <motion.text
            x="400" y="221"
            textAnchor="middle"
            fill="#2DD4BF"
            fontSize="11"
            fontWeight="800"
            fontFamily="sans-serif"
            initial={{ opacity: 0 }}
            animate={show ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 0.5 }}
          >
            RAMA
          </motion.text>

          {/* ── Footer attribution ──────────────────────────────────────── */}
          <motion.text
            x="400" y="400"
            textAnchor="middle"
            fill="#6b7fa3"
            fontSize="8.5"
            fontFamily="sans-serif"
            initial={{ opacity: 0 }}
            animate={show ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 1.5 }}
          >
            Powered by: UN Comtrade · WCO HS 2022 · USITC HTS · Anthropic AI
          </motion.text>
        </svg>
      </div>

      {/* ── Mobile cards ── */}
      <MobileList />
    </div>
  );
}
