'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, GripVertical, Plus, Trash2, Clock, Star, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TiptapEditor } from './TiptapEditor';
import {
  useBlogPostById,
  useSaveBlogPost,
  uploadBlogImage,
  slugify,
  type BlogPost,
  type DesignBlock,
} from '@/hooks/useBlog';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

const CATEGORIES = ['Product Updates', 'Export Playbooks', 'How-To Guides', 'Stories'];
const BLOCK_TYPES: DesignBlock['type'][] = ['hero', 'section', 'callout', 'step_list'];
const FOCUS_OPTIONS = [
  { value: 'hs_concept', label: 'HS Code Concept' },
  { value: 'incoterms', label: 'Incoterms' },
  { value: 'contracts', label: 'Trade Contracts' },
  { value: 'customer_story', label: 'Customer Story' },
];

interface BlogEditorProps {
  postId?: string;
}

export function BlogEditor({ postId }: BlogEditorProps) {
  const router = useRouter();
  const { data: existingPost, isLoading } = useBlogPostById(postId ?? null);
  const saveMutation = useSaveBlogPost();

  const [title, setTitle] = useState('');
  const [slug, setSlugState] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [focusType, setFocusType] = useState('');
  const [blocks, setBlocks] = useState<DesignBlock[]>([]);
  const [slugManual, setSlugManual] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setSlugState(existingPost.slug);
      setSlugManual(true);
      setContent(existingPost.content ?? '');
      setExcerpt(existingPost.excerpt ?? '');
      setCategory(existingPost.category ?? '');
      setTags(existingPost.tags ?? []);
      setFeatured(existingPost.featured);
      setCoverImageUrl(existingPost.cover_image_url ?? '');
      setScheduledAt(existingPost.scheduled_at?.slice(0, 16) ?? '');
      setBlocks(existingPost.design_blocks ?? []);
    }
  }, [existingPost]);

  useEffect(() => {
    if (!slugManual && title) {
      setSlugState(slugify(title));
    }
  }, [title, slugManual]);

  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

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
    setBlocks((prev) => [
      ...prev,
      { id: nanoid(), type: 'section', label: 'New Block' },
    ]);
  };

  const updateBlock = (id: string, updates: Partial<DesignBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const url = await uploadBlogImage(file);
      setCoverImageUrl(url);
    } catch (e) {
      toast.error('Cover upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const buildPayload = (status: BlogPost['status']) => ({
    id: postId,
    title,
    slug,
    content,
    excerpt,
    category: category || null,
    tags: tags.length > 0 ? tags : null,
    featured,
    cover_image_url: coverImageUrl || null,
    design_blocks: blocks.length > 0 ? blocks : null,
    scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    status,
    author_name: 'Mercorama Team',
    published_at:
      status === 'published'
        ? (existingPost?.published_at ?? new Date().toISOString())
        : existingPost?.published_at ?? null,
  });

  const handleSaveDraft = async () => {
    if (!title.trim()) return toast.error('Title is required');
    await saveMutation.mutateAsync(buildPayload('draft'));
  };

  const handlePublish = async () => {
    if (!title.trim()) return toast.error('Title is required');
    const result = await saveMutation.mutateAsync(buildPayload('published'));
    if (result && !postId) router.push(`/dashboard/admin/blog/edit/${result.id}`);
  };

  const handleUnpublish = async () => {
    if (!title.trim()) return toast.error('Title is required');
    await saveMutation.mutateAsync(buildPayload('draft'));
  };

  if (isLoading && postId) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading post…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 backdrop-blur px-4 py-2.5">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/admin/blog')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title…"
          className="flex-1 bg-transparent text-xl font-bold placeholder:text-muted-foreground/50 focus:outline-none"
        />
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{wordCount} words · {readingTime} min</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={saveMutation.isPending}
          >
            Save Draft
          </Button>
          {existingPost?.status === 'published' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={saveMutation.isPending}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={saveMutation.isPending}
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex max-w-[1400px] mx-auto">
        {/* Editor area */}
        <div className="flex-1 min-w-0 px-4 sm:px-8 py-8">
          <TiptapEditor content={content} onChange={setContent} />
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 border-l bg-muted/20 overflow-y-auto h-[calc(100vh-53px)] sticky top-[53px]">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

            {/* Post Settings */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Post Settings</h3>
              <div className="space-y-3">

                {/* Slug */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Slug</label>
                  <div className="flex gap-1">
                    <input
                      value={slug}
                      onChange={(e) => { setSlugState(e.target.value); setSlugManual(true); }}
                      className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="auto-generated-from-title"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Excerpt</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    placeholder="Short description for listings…"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">— Select —</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tags</label>
                  <div className="flex gap-1 mb-1.5">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Add tag + Enter"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-2 rounded-md border bg-muted text-xs hover:bg-accent transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Featured */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" /> Featured
                  </label>
                  <button
                    type="button"
                    onClick={() => setFeatured((v) => !v)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${featured ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${featured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Cover image */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Cover Image</label>
                  {coverImageUrl && (
                    <div className="relative rounded-lg overflow-hidden mb-2 h-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl('')}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 cursor-pointer rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingCover ? 'Uploading…' : 'Upload cover'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleCoverUpload(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {/* Schedule */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Schedule Publish</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </section>

            <div className="border-t" />

            {/* Post Focus */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Post Focus</h3>
              <div className="space-y-1.5">
                {FOCUS_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="focus"
                      value={opt.value}
                      checked={focusType === opt.value}
                      onChange={() => setFocusType(opt.value)}
                      className="text-primary"
                    />
                    <span className="text-xs">{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="border-t" />

            {/* Design Blocks */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Design Blocks</h3>
                <button
                  type="button"
                  onClick={addBlock}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {blocks.map((block) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        onUpdate={updateBlock}
                        onRemove={removeBlock}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {blocks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No blocks yet. Add one to structure your post.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableBlock({
  block,
  onUpdate,
  onRemove,
}: {
  block: DesignBlock;
  onUpdate: (id: string, updates: Partial<DesignBlock>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border bg-background p-2"
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 flex gap-2 min-w-0">
        <select
          value={block.type}
          onChange={(e) => onUpdate(block.id, { type: e.target.value as DesignBlock['type'] })}
          className="rounded border bg-background px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          value={block.label}
          onChange={(e) => onUpdate(block.id, { label: e.target.value })}
          className="flex-1 min-w-0 rounded border bg-background px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Block label"
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(block.id)}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
