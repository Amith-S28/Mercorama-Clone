'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { checkIsAdmin } from '@/lib/admin';
import {
  useMarketingPage,
  useSaveMarketingPage,
  type MarketingBlock,
  type BlockType,
} from '@/hooks/useMarketingPages';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft, GripVertical, Plus, Trash2, Save,
  ExternalLink, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';

const TiptapEditor = dynamic(
  () => import('@/components/blog/TiptapEditor').then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

type LocalBlock = Omit<MarketingBlock, 'id' | 'page_id'> & { id: string };

type PlanData = {
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  dealsPerMonth: string;
  features: string[];
  highlight: boolean;
  ctaLabel: string;
  ctaHref: string;
  ribbon: string;
};

type PersonaCard = { title: string; description: string; planHint: string };
type FaqItem = { question: string; answer: string };
type FeatureItem = { title: string; description: string };

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: 'hero',          label: 'Hero Section' },
  { value: 'pricing_plans', label: 'Pricing Plans' },
  { value: 'feature_list',  label: 'Feature List' },
  { value: 'who_it_is_for', label: "Who It's For" },
  { value: 'faq',           label: 'FAQ' },
  { value: 'cta',           label: 'Call to Action' },
  { value: 'text',          label: 'Text Block' },
];

const DEFAULT_PLAN: PlanData = {
  name: '', tagline: '', price: '', priceNote: '', dealsPerMonth: '',
  features: [], highlight: false, ctaLabel: 'Get started', ctaHref: '/deal', ribbon: '',
};

const DEFAULT_DATA: Record<BlockType, Record<string, unknown>> = {
  hero:          { heading: '', subheading: '', primaryButtonLabel: 'Start a Deal', primaryButtonHref: '/deal', secondaryButtonLabel: '', secondaryButtonHref: '', badgeText: '' },
  pricing_plans: { sectionTitle: '', sectionSubtitle: '', plans: [{ ...DEFAULT_PLAN }] },
  feature_list:  { title: '', subtitle: '', items: [] },
  who_it_is_for: { sectionTitle: '', cards: [{ title: '', description: '', planHint: '' }] },
  faq:           { sectionTitle: '', items: [{ question: '', answer: '' }] },
  cta:           { heading: '', body: '', buttonLabel: '', buttonHref: '' },
  text:          { heading: '', body: '' },
};

const PAGE_HREFS: Record<string, string> = {
  home: '/', pricing: '/beta', deal: '/deal',
  incoterms: '/incoterms', hscode: '/hscode',
  contract: '/deal-summary', blog: '/blog', contact: '/contact',
};

// ─── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, value, onChange, textarea, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  textarea?: boolean; placeholder?: string;
}) {
  const cls = 'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={`${cls} resize-none`} placeholder={placeholder} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder} />}
    </div>
  );
}

// ─── HeroFields ───────────────────────────────────────────────────────────────

function HeroFields({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (key: string, val: string) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-3">
      <Field label="Badge Text (optional)" value={data.badgeText as string ?? ''} onChange={(v) => f('badgeText', v)} placeholder="e.g. Built for Canadian exporters" />
      <Field label="Heading" value={data.heading as string ?? ''} onChange={(v) => f('heading', v)} placeholder="Main headline" />
      <Field label="Subheading" value={data.subheading as string ?? ''} onChange={(v) => f('subheading', v)} textarea placeholder="Supporting text" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Primary Button" value={data.primaryButtonLabel as string ?? ''} onChange={(v) => f('primaryButtonLabel', v)} placeholder="Label" />
        <Field label="Primary Href" value={data.primaryButtonHref as string ?? ''} onChange={(v) => f('primaryButtonHref', v)} placeholder="/deal" />
        <Field label="Secondary Button" value={data.secondaryButtonLabel as string ?? ''} onChange={(v) => f('secondaryButtonLabel', v)} placeholder="Label (optional)" />
        <Field label="Secondary Href" value={data.secondaryButtonHref as string ?? ''} onChange={(v) => f('secondaryButtonHref', v)} placeholder="mailto:..." />
      </div>
    </div>
  );
}

// ─── PricingPlansFields ────────────────────────────────────────────────────────

function PlanEditor({ plan, onChange, onRemove, index }: {
  plan: PlanData; onChange: (p: PlanData) => void; onRemove: () => void; index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const f = (key: keyof PlanData, val: unknown) => onChange({ ...plan, [key]: val });

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-2 rounded-t-lg border-b bg-muted/30 px-3 py-2">
        <button type="button" onClick={() => setExpanded(v => !v)} className="flex-1 truncate text-left text-xs font-medium">
          {plan.name || `Plan ${index + 1}`}
          {plan.ribbon && <span className="ml-2 text-muted-foreground">({plan.ribbon})</span>}
        </button>
        <button type="button" onClick={() => setExpanded(v => !v)} className="text-muted-foreground">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="space-y-2.5 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Plan Name" value={plan.name} onChange={(v) => f('name', v)} placeholder="Growth" />
            <Field label="Ribbon (optional)" value={plan.ribbon} onChange={(v) => f('ribbon', v)} placeholder="Most popular" />
          </div>
          <Field label="Tagline" value={plan.tagline} onChange={(v) => f('tagline', v)} placeholder="One-line descriptor" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Price" value={plan.price} onChange={(v) => f('price', v)} placeholder="$199/month" />
            <Field label="Price Note" value={plan.priceNote} onChange={(v) => f('priceNote', v)} placeholder="No setup fees" />
          </div>
          <Field label="Deals / Month" value={plan.dealsPerMonth} onChange={(v) => f('dealsPerMonth', v)} placeholder="Up to 50 deals / month" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="CTA Label" value={plan.ctaLabel} onChange={(v) => f('ctaLabel', v)} placeholder="Choose Growth" />
            <Field label="CTA Href" value={plan.ctaHref} onChange={(v) => f('ctaHref', v)} placeholder="/deal" />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={plan.highlight} onChange={(e) => f('highlight', e.target.checked)} className="rounded" />
            <span className="text-muted-foreground">Highlight this plan (accent border + background)</span>
          </label>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Features</span>
              <button type="button" onClick={() => f('features', [...plan.features, ''])} className="text-xs font-medium text-primary hover:underline">
                + Add
              </button>
            </div>
            <div className="space-y-1.5">
              {plan.features.map((feat, j) => (
                <div key={j} className="flex gap-1.5">
                  <input
                    value={feat}
                    onChange={(e) => { const n = [...plan.features]; n[j] = e.target.value; f('features', n); }}
                    className="flex-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder={`Feature ${j + 1}`}
                  />
                  <button type="button" onClick={() => f('features', plan.features.filter((_, k) => k !== j))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {plan.features.length === 0 && <p className="text-xs text-muted-foreground">No features yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PricingPlansFields({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const plans = (data.plans as PlanData[]) ?? [];
  const f = (key: string, val: unknown) => onChange({ ...data, [key]: val });

  return (
    <div className="space-y-3">
      <Field label="Section Title" value={data.sectionTitle as string ?? ''} onChange={(v) => f('sectionTitle', v)} placeholder="Choose your plan" />
      <Field label="Section Subtitle" value={data.sectionSubtitle as string ?? ''} onChange={(v) => f('sectionSubtitle', v)} textarea placeholder="All plans include..." />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Plans ({plans.length})</span>
          <button type="button" onClick={() => f('plans', [...plans, { ...DEFAULT_PLAN }])} className="text-xs font-medium text-primary hover:underline">
            + Add plan
          </button>
        </div>
        <div className="space-y-2">
          {plans.map((plan, i) => (
            <PlanEditor
              key={i}
              index={i}
              plan={plan}
              onChange={(updated) => { const n = [...plans]; n[i] = updated; f('plans', n); }}
              onRemove={() => f('plans', plans.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FeatureListFields ────────────────────────────────────────────────────────

function FeatureListFields({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  const rawItems = (data.items as (string | FeatureItem)[]) ?? [];
  const isObjectItems = rawItems.length > 0 && typeof rawItems[0] === 'object';

  return (
    <div className="space-y-3">
      <Field label="Section Title" value={(data.title ?? data.sectionTitle) as string ?? ''} onChange={(v) => onChange({ ...data, title: v, sectionTitle: v })} />
      <Field label="Section Subtitle (optional)" value={(data.subtitle ?? data.sectionSubtitle) as string ?? ''} onChange={(v) => onChange({ ...data, subtitle: v, sectionSubtitle: v })} textarea />
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="radio" checked={!isObjectItems} onChange={() => f('items', [])} />
          Simple bullets
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="radio" checked={isObjectItems} onChange={() => f('items', [{ title: '', description: '' }])} />
          Title + description cards
        </label>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Items</span>
          <button type="button" onClick={() => f('items', [...rawItems, isObjectItems ? { title: '', description: '' } : ''])} className="text-xs font-medium text-primary hover:underline">
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {isObjectItems
            ? (rawItems as FeatureItem[]).map((item, i) => (
                <div key={i} className="space-y-1.5 rounded-lg border bg-background p-2.5">
                  <div className="flex gap-1.5">
                    <div className="flex-1 space-y-1.5">
                      <input
                        value={item.title}
                        onChange={(e) => { const n = [...rawItems] as FeatureItem[]; n[i] = { ...item, title: e.target.value }; f('items', n); }}
                        className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Title"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => { const n = [...rawItems] as FeatureItem[]; n[i] = { ...item, description: e.target.value }; f('items', n); }}
                        rows={2}
                        className="w-full resize-none rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Description"
                      />
                    </div>
                    <button type="button" onClick={() => f('items', rawItems.filter((_, j) => j !== i))} className="mt-0.5 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            : (rawItems as string[]).map((item, i) => (
                <div key={i} className="flex gap-1.5">
                  <input
                    value={item}
                    onChange={(e) => { const n = [...rawItems] as string[]; n[i] = e.target.value; f('items', n); }}
                    className="flex-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder={`Item ${i + 1}`}
                  />
                  <button type="button" onClick={() => f('items', rawItems.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
          {rawItems.length === 0 && <p className="text-xs text-muted-foreground">No items yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ─── WhoItIsForFields ─────────────────────────────────────────────────────────

function WhoItIsForFields({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const cards = (data.cards as PersonaCard[]) ?? [];
  const f = (key: string, val: unknown) => onChange({ ...data, [key]: val });

  return (
    <div className="space-y-3">
      <Field label="Section Title" value={data.sectionTitle as string ?? ''} onChange={(v) => f('sectionTitle', v)} />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Persona Cards ({cards.length})</span>
          <button type="button" onClick={() => f('cards', [...cards, { title: '', description: '', planHint: '' }])} className="text-xs font-medium text-primary hover:underline">
            + Add card
          </button>
        </div>
        <div className="space-y-2">
          {cards.map((card, i) => (
            <div key={i} className="rounded-lg border bg-background p-2.5">
              <div className="flex gap-1.5">
                <div className="flex-1 space-y-1.5">
                  <input
                    value={card.title}
                    onChange={(e) => { const n = [...cards]; n[i] = { ...card, title: e.target.value }; f('cards', n); }}
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Customer type"
                  />
                  <textarea
                    value={card.description}
                    onChange={(e) => { const n = [...cards]; n[i] = { ...card, description: e.target.value }; f('cards', n); }}
                    rows={2}
                    className="w-full resize-none rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Scenario description"
                  />
                  <input
                    value={card.planHint}
                    onChange={(e) => { const n = [...cards]; n[i] = { ...card, planHint: e.target.value }; f('cards', n); }}
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Recommended plan (e.g. Starter)"
                  />
                </div>
                <button type="button" onClick={() => f('cards', cards.filter((_, j) => j !== i))} className="mt-0.5 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {cards.length === 0 && <p className="text-xs text-muted-foreground">No cards yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ─── FaqFields ────────────────────────────────────────────────────────────────

function FaqFields({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const items = (data.items as FaqItem[]) ?? [];
  const f = (key: string, val: unknown) => onChange({ ...data, [key]: val });

  return (
    <div className="space-y-3">
      <Field label="Section Title" value={data.sectionTitle as string ?? ''} onChange={(v) => f('sectionTitle', v)} />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Q&A Items ({items.length})</span>
          <button type="button" onClick={() => f('items', [...items, { question: '', answer: '' }])} className="text-xs font-medium text-primary hover:underline">
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border bg-background p-2.5">
              <div className="flex gap-1.5">
                <div className="flex-1 space-y-1.5">
                  <input
                    value={item.question}
                    onChange={(e) => { const n = [...items]; n[i] = { ...item, question: e.target.value }; f('items', n); }}
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Question"
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => { const n = [...items]; n[i] = { ...item, answer: e.target.value }; f('items', n); }}
                    rows={3}
                    className="w-full resize-none rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Answer"
                  />
                </div>
                <button type="button" onClick={() => f('items', items.filter((_, j) => j !== i))} className="mt-0.5 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-muted-foreground">No items yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ─── CtaFields ────────────────────────────────────────────────────────────────

function CtaFields({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (key: string, val: string) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading as string ?? ''} onChange={(v) => f('heading', v)} />
      <Field label="Body" value={data.body as string ?? ''} onChange={(v) => f('body', v)} textarea />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Button Label" value={data.buttonLabel as string ?? ''} onChange={(v) => f('buttonLabel', v)} />
        <Field label="Button Href" value={data.buttonHref as string ?? ''} onChange={(v) => f('buttonHref', v)} />
      </div>
    </div>
  );
}

// ─── TextBlockFields ──────────────────────────────────────────────────────────

function TextBlockFields({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (key: string, val: string) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-3">
      <Field label="Heading (optional)" value={data.heading as string ?? ''} onChange={(v) => f('heading', v)} />
      <Field label="Body" value={data.body as string ?? ''} onChange={(v) => f('body', v)} textarea placeholder="Section body text..." />
    </div>
  );
}

// ─── BlockFields dispatcher ───────────────────────────────────────────────────

function BlockFields({ block, onChange }: { block: LocalBlock; onChange: (b: LocalBlock) => void }) {
  const updateData = (d: Record<string, unknown>) => onChange({ ...block, data: d });
  switch (block.type) {
    case 'hero':          return <HeroFields         data={block.data} onChange={updateData} />;
    case 'pricing_plans': return <PricingPlansFields data={block.data} onChange={updateData} />;
    case 'feature_list':  return <FeatureListFields  data={block.data} onChange={updateData} />;
    case 'who_it_is_for': return <WhoItIsForFields   data={block.data} onChange={updateData} />;
    case 'faq':           return <FaqFields          data={block.data} onChange={updateData} />;
    case 'cta':           return <CtaFields          data={block.data} onChange={updateData} />;
    case 'text':          return <TextBlockFields    data={block.data} onChange={updateData} />;
    default:              return null;
  }
}

// ─── SortableBlockCard ────────────────────────────────────────────────────────

function SortableBlockCard({ block, onChange, onRemove }: {
  block: LocalBlock;
  onChange: (b: LocalBlock) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const [expanded, setExpanded] = useState(true);
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border bg-background shadow-sm">
      <div className="flex items-center gap-2 rounded-t-xl border-b bg-muted/30 px-3 py-2.5">
        <button type="button" className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <select
          value={block.type}
          onChange={(e) => {
            const t = e.target.value as BlockType;
            onChange({ ...block, type: t, data: DEFAULT_DATA[t] ?? {} });
          }}
          className="flex-1 rounded-md border bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {BLOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="px-1 text-xs text-muted-foreground hover:text-foreground">
          {expanded ? '▲' : '▼'}
        </button>
        <button type="button" onClick={() => onRemove(block.id)} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="px-4 py-4">
          <BlockFields block={block} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export default function AdminPageEditor() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : '';

  const [mounted, setMounted]           = useState(false);
  const [isAdminUser, setIsAdminUser]   = useState(false);
  const [blocks, setBlocks]             = useState<LocalBlock[]>([]);
  const [content, setContent]           = useState('');
  const [initialized, setInitialized]   = useState(false);

  const { data: page, isLoading } = useMarketingPage(slug);
  const saveMutation = useSaveMarketingPage(page?.id ?? '');

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setIsAdminUser(true);
      setMounted(true);
    });
  }, [router]);

  useEffect(() => {
    if (page && !initialized) {
      setContent(page.content ?? '');
      setBlocks((page.blocks ?? []).map((b) => ({ ...b, id: b.id ?? nanoid() })));
      setInitialized(true);
    }
  }, [page, initialized]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIdx = items.findIndex((i) => i.id === active.id);
        const newIdx = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIdx, newIdx);
      });
    }
  };

  const addBlock = () => {
    setBlocks((prev) => [...prev, { id: nanoid(), type: 'text', data: DEFAULT_DATA.text, position: prev.length }]);
  };

  const handleSave = async () => {
    if (!page?.id) return;
    await saveMutation.mutateAsync({
      blocks: blocks.map((b, i) => ({ type: b.type, data: b.data, position: i })),
      content,
    });
  };

  if (!mounted || !isAdminUser) return null;
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!page) return <div className="p-8 text-center text-muted-foreground">Page not found. Visit the pages list first to initialise it.</div>;

  const liveHref = PAGE_HREFS[slug] ?? `/${slug}`;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 backdrop-blur px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/admin/pages')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Pages
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{page.title}</h1>
          <p className="text-xs text-muted-foreground">{liveHref}</p>
        </div>
        <a
          href={liveHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View live
          <ExternalLink className="h-3 w-3" />
        </a>
        <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      {/* Body — two-panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: Tiptap rich-text editor */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Page Content</h2>
              <p className="text-xs text-muted-foreground">
                Rich text content for this page. Rendered above the footer, below any design blocks.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <TiptapEditor content={content} onChange={setContent} />
            </div>
          </div>
        </div>

        {/* Right: Design blocks sidebar */}
        <div className="w-80 shrink-0 overflow-y-auto border-l bg-muted/20">
          <div className="space-y-6 p-4">

            {/* Page info */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Page Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Live URL</span>
                  <a href={liveHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    {liveHref} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Design blocks */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Design Blocks</h3>
                <span className="text-xs text-muted-foreground">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Structured sections rendered on the page in order. Drag to reorder.
              </p>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {blocks.map((block) => (
                      <SortableBlockCard
                        key={block.id}
                        block={block}
                        onChange={(updated) => setBlocks((prev) => prev.map((b) => b.id === updated.id ? updated : b))}
                        onRemove={(id) => setBlocks((prev) => prev.filter((b) => b.id !== id))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {blocks.length === 0 && (
                <div className="rounded-xl border-2 border-dashed py-8 text-center">
                  <p className="text-xs font-medium text-muted-foreground">No blocks yet</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Add a hero or feature section below.</p>
                </div>
              )}

              <button
                type="button"
                onClick={addBlock}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add block
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
