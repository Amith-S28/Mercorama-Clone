'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export default function StudioAvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot form
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('10:00');
  const [adding, setAdding] = useState(false);

  const fetchSlots = () =>
    fetch('/api/studio/availability').then((r) => r.json()).then(setSlots).finally(() => setLoading(false));

  useEffect(() => { fetchSlots(); }, []);

  async function handleAdd() {
    if (!newDate || !newStart || !newEnd) { toast.error('Fill in date, start, and end time'); return; }
    setAdding(true);
    try {
      const res = await fetch('/api/studio/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [{ slot_date: newDate, start_time: newStart, end_time: newEnd }] }),
      });
      if (res.ok) { toast.success('Slot added'); fetchSlots(); setNewDate(''); }
      else toast.error('Failed to add slot');
    } catch { toast.error('Failed to add slot'); }
    finally { setAdding(false); }
  }

  async function handleBulkAdd() {
    if (!newDate || !newStart || !newEnd) { toast.error('Fill in date, start, and end time'); return; }
    // Generate hourly slots between start and end
    const slots: { slot_date: string; start_time: string; end_time: string }[] = [];
    let [h] = newStart.split(':').map(Number);
    const [endH] = newEnd.split(':').map(Number);
    while (h < endH) {
      const s = `${String(h).padStart(2, '0')}:00`;
      const e = `${String(h + 1).padStart(2, '0')}:00`;
      slots.push({ slot_date: newDate, start_time: s, end_time: e });
      h++;
    }
    if (slots.length === 0) { toast.error('End time must be after start time'); return; }

    setAdding(true);
    try {
      const res = await fetch('/api/studio/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      });
      if (res.ok) { toast.success(`${slots.length} slots added`); fetchSlots(); setNewDate(''); }
      else toast.error('Failed to add slots');
    } catch { toast.error('Failed'); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    try {
      await fetch('/api/studio/availability', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      toast.success('Slot removed');
      fetchSlots();
    } catch { toast.error('Delete failed'); }
  }

  // Group by date
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    (acc[s.slot_date] ??= []).push(s);
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Availability</h1>
        <p className="text-sm text-muted-foreground">Set your available time slots. Clients will pick from these when booking.</p>
      </div>

      {/* Add slot form */}
      <div className="rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold text-sm">Add Availability</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Start</label>
            <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">End</label>
            <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd} disabled={adding} size="sm">
            <Plus className="h-4 w-4 mr-1" />Add Single Slot
          </Button>
          <Button onClick={handleBulkAdd} disabled={adding} size="sm" variant="outline">
            <Calendar className="h-4 w-4 mr-1" />Add Hourly Slots
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">&ldquo;Add Hourly Slots&rdquo; creates 1-hour blocks between start and end time.</p>
      </div>

      {/* Existing slots */}
      {Object.keys(slotsByDate).length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold">No availability set</p>
          <p className="text-sm text-muted-foreground mt-1">Add slots above so clients can book sessions with you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(slotsByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateSlots]) => (
              <div key={date}>
                <div className="text-sm font-semibold mb-2">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dateSlots
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm',
                          slot.is_booked ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : '',
                        )}
                      >
                        <span>{slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}</span>
                        {slot.is_booked ? (
                          <span className="text-xs text-green-700 dark:text-green-300 font-medium">Booked</span>
                        ) : (
                          <button onClick={() => handleDelete(slot.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
