'use client';

import { useState } from 'react';
import { ExpertSessionType } from '@/lib/experts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock } from 'lucide-react';

interface SessionSelectorProps {
  sessions: ExpertSessionType[];
  expertSlug: string;
  onSelect?: (sessionId: string) => void;
  selectedId?: string;
}

export function SessionSelector({ sessions, expertSlug, onSelect, selectedId }: SessionSelectorProps) {
  const [selected, setSelected] = useState(selectedId ?? sessions[0]?.id ?? '');

  const handleSelect = (sessionId: string) => {
    setSelected(sessionId);
    onSelect?.(sessionId);
  };

  if (!sessions.length) return null;

  const selectedSession = sessions.find((s) => s.id === selected);

  return (
    <div>
      <h3 className="font-semibold text-sm mb-3">Select Session Type</h3>
      <div className="space-y-2 mb-4">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => handleSelect(session.id)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
              selected === session.id
                ? 'border-[#01696f] bg-[#01696f]/5'
                : 'border-border bg-card hover:border-[#01696f]/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm">{session.title}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {session.duration_minutes} min
                </div>
              </div>
              <div className="text-right ml-2">
                <div className="font-semibold text-sm text-[#01696f]">
                  ${(session.price_cents / 100).toFixed(0)}
                </div>
              </div>
            </div>
            {session.description && (
              <p className="text-xs text-muted-foreground mt-2">{session.description}</p>
            )}
          </button>
        ))}
      </div>
      <Link href={`/experts/request/${expertSlug}?session=${selected}`} className="block">
        <Button className="w-full" size="lg">
          Continue to Book
        </Button>
      </Link>
    </div>
  );
}
