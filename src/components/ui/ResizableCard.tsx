'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ResizableCardProps {
  /** CSS class applied to the outer wrapper */
  className?: string;
  /** Initial height in pixels */
  defaultHeight?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Called whenever the height changes during or after a drag */
  onResize?: (height: number) => void;
  children: React.ReactNode | ((dimensions: { width: number; height: number }) => React.ReactNode);
}

/**
 * A bento-card with a draggable bottom-edge handle for vertical resizing.
 *
 * Renders a transparent overlay during drag to prevent embedded iframes
 * and SVGs from capturing pointer events.
 */
export function ResizableCard({
  className,
  defaultHeight = 420,
  minHeight = 200,
  maxHeight = 900,
  onResize,
  children,
}: ResizableCardProps) {
  const [height, setHeight] = useState(defaultHeight);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Measure content size dynamically
  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  // Track drag start position without re-rendering on every move
  const dragState = useRef<{ startY: number; startH: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = { startY: e.clientY, startH: height };
      setDragging(true);
    },
    [height],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;
      const delta = e.clientY - dragState.current.startY;
      const next = Math.max(minHeight, Math.min(maxHeight, dragState.current.startH + delta));
      setHeight(next);
      onResize?.(next);
    },
    [minHeight, maxHeight, onResize],
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
    setDragging(false);
  }, []);

  // Ensure we clean up if the pointer leaves the window mid-drag
  useEffect(() => {
    if (!dragging) return;
    const onUp = () => {
      dragState.current = null;
      setDragging(false);
    };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  return (
    <div
      className={cn(
        'bento-card resizable-card',
        dragging && 'resizable-card--dragging',
        className,
      )}
      style={{ height }}
    >
      {/* Overlay covers children during drag so iframes don't steal events */}
      {dragging && <div className="resizable-card__drag-overlay" aria-hidden />}

      <div className="resizable-card__content" ref={contentRef}>
        {typeof children === 'function' ? children({ width, height }) : children}
      </div>

      {/* Grab handle */}
      <div
        className="resizable-card__handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="separator"
        aria-orientation="horizontal"
        aria-valuenow={height}
        aria-valuemin={minHeight}
        aria-valuemax={maxHeight}
        aria-label="Resize panel"
      >
        <div className="resizable-card__handle-bar" />
      </div>
    </div>
  );
}
