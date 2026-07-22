// components/ui/DataFlag.tsx
// DT-5 — Flag icon + inline modal for user-reported data issues.
'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FLAG_REASONS = [
  'Rate seems incorrect',
  'Data appears outdated',
  'Source seems wrong',
  'Other',
] as const;

interface DataFlagProps {
  tableName: string;
  recordId: string;
  fieldLabel: string;
}

export function DataFlag({ tableName, recordId, fieldLabel }: DataFlagProps) {
  const [open, setOpen]       = useState(false);
  const [reason, setReason]   = useState<string>('');
  const [note, setNote]       = useState('');
  const [status, setStatus]   = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  async function submit() {
    if (!reason) return;
    setStatus('submitting');
    try {
      await fetch('/api/data-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: tableName,
          record_id:  recordId,
          flag_type:  'user_reported',
          details: { reason, note: note.slice(0, 140), field_label: fieldLabel },
        }),
      });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Flag an issue with ${fieldLabel}`}
        className="inline-flex items-center text-muted-foreground/40 hover:text-muted-foreground transition-colors ml-1"
      >
        <Flag className="h-3 w-3" />
      </button>
    );
  }

  return (
    <span className="inline-block">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
        <div
          className="bg-background border rounded-xl shadow-xl p-5 w-full max-w-sm mx-4 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {status === 'done' ? (
            <p className="text-sm text-center py-4 font-medium">
              Thanks — our team will review this.
            </p>
          ) : (
            <>
              <div>
                <p className="font-semibold text-sm mb-1">What looks wrong?</p>
                <p className="text-xs text-muted-foreground">{fieldLabel}</p>
              </div>
              <div className="space-y-2">
                {FLAG_REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="flag_reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-primary"
                    />
                    {r}
                  </label>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 140))}
                placeholder="Optional note (140 chars max)"
                rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {status === 'error' && (
                <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={!reason || status === 'submitting'}
                  onClick={submit}
                >
                  {status === 'submitting' ? 'Submitting…' : 'Submit Flag'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </span>
  );
}
