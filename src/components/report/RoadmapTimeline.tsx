'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import type { RoadmapBucket, RoadmapItem } from '@/types';
import { snappy } from '@/lib/animation/presets';

const BUCKETS: RoadmapBucket[] = ['30-day', '60-day', '90-day'];

interface RoadmapTimelineProps {
  assessmentId: string;
}

function SortableCard({ item }: { item: RoadmapItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        border: '1px solid var(--border-low-contrast)',
        borderRadius: 'var(--radius-interactive)',
        padding: '0.75rem 1rem',
        background: 'var(--bg-secondary)',
        cursor: 'grab',
        marginBottom: '0.5rem',
      }}
      {...attributes}
      {...listeners}
    >
      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.task}</p>
    </div>
  );
}

async function persistRoadmapItem(item: RoadmapItem) {
  await fetch('/api/roadmap', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: item.id,
      bucket: item.bucket,
      sortOrder: item.sortOrder,
    }),
  });
}

export function RoadmapTimeline({ assessmentId }: RoadmapTimelineProps) {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/roadmap?assessmentId=${encodeURIComponent(assessmentId)}`);
        if (!res.ok) return;
        const rows = (await res.json()) as RoadmapItem[];
        if (!cancelled) setItems(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const byBucket = useMemo(() => {
    const map: Record<RoadmapBucket, RoadmapItem[]> = {
      '30-day': [],
      '60-day': [],
      '90-day': [],
    };
    for (const item of items) {
      map[item.bucket].push(item);
    }
    for (const bucket of BUCKETS) {
      map[bucket].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [items]);

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);
    const fromItem = items.find((i) => i.id === activeItemId);
    if (!fromItem) return;

    const overBucket = BUCKETS.includes(overId as RoadmapBucket)
      ? (overId as RoadmapBucket)
      : items.find((i) => i.id === overId)?.bucket;

    if (!overBucket) return;

    let nextItems: RoadmapItem[] = [];
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === activeItemId ? { ...item, bucket: overBucket } : item
      );
      const column = next.filter((i) => i.bucket === overBucket);
      const oldIndex = column.findIndex((i) => i.id === activeItemId);
      const newIndex = column.findIndex((i) => i.id === overId);
      const reordered =
        oldIndex >= 0 && newIndex >= 0 ? arrayMove(column, oldIndex, newIndex) : column;
      const others = next.filter((i) => i.bucket !== overBucket);
      nextItems = [
        ...others,
        ...reordered.map((item, index) => ({ ...item, sortOrder: index })),
      ];
      return nextItems;
    });

    void Promise.all(nextItems.map((item) => persistRoadmapItem(item)));
  }

  if (loading) {
    return (
      <section className="bento-card" style={{ padding: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading roadmap…</p>
      </section>
    );
  }

  return (
    <section className="bento-card" style={{ padding: '1.5rem' }}>
      <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
        30 / 60 / 90
      </p>
      <h3 style={{ fontWeight: 300, fontSize: '1.25rem', marginBottom: '1.25rem' }}>
        Export Roadmap
      </h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '1rem',
          }}
        >
          {BUCKETS.map((bucket) => (
            <div
              key={bucket}
              id={bucket}
              style={{
                border: '1px solid var(--border-low-contrast)',
                borderRadius: 'var(--radius-interactive)',
                padding: '1rem',
                minHeight: '220px',
              }}
            >
              <p
                className="mono-label"
                style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}
              >
                {bucket}
              </p>
              <SortableContext
                items={byBucket[bucket].map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {byBucket[bucket].map((item) => (
                  <SortableCard key={item.id} item={item} />
                ))}
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeItem ? (
            <motion.div
              layout
              transition={snappy}
              style={{
                border: '1px solid var(--accent-premium)',
                borderRadius: 'var(--radius-interactive)',
                padding: '0.75rem 1rem',
                background: 'var(--bg-card)',
              }}
            >
              {activeItem.task}
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
