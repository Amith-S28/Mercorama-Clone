'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAllBlogPosts, useDeleteBlogPost, useSaveBlogPost, type BlogPost } from '@/hooks/useBlog';
import { checkIsAdmin } from '@/lib/admin';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const CATEGORIES = ['all', 'Product Updates', 'Export Playbooks', 'How-To Guides', 'Stories'];
const STATUSES = ['all', 'draft', 'published', 'scheduled'];

export default function AdminBlogPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: posts, isLoading } = useAllBlogPosts();
  const deleteMutation = useDeleteBlogPost();
  const saveMutation = useSaveBlogPost();

  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setIsAdminUser(true);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || !isAdminUser) return null;

  const filtered = (posts ?? []).filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    return true;
  });

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    await deleteMutation.mutateAsync(post.id);
  };

  const toggleFeatured = async (post: BlogPost) => {
    await saveMutation.mutateAsync({ ...post, featured: !post.featured });
    toast.success(post.featured ? 'Unfeatured' : 'Featured');
  };

  return (
    <div className="flex-1 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Manager</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage blog posts</p>
        </div>
        <Link href="/dashboard/admin/blog/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> New Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="text-xs text-muted-foreground mr-1.5">Status:</label>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border mr-1 transition-colors',
                filterStatus === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground border-border hover:border-primary'
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mr-1.5">Category:</label>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border mr-1 transition-colors',
                filterCategory === c
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground border-border hover:border-primary'
              )}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden bg-background">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="font-medium mb-1">No posts found</p>
            <p className="text-sm">
              {filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your filters.'
                : 'Create your first post to get started.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Featured</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Published</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((post) => (
                <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{post.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {post.category ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_COLORS[post.status] ?? STATUS_COLORS.draft)}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(post)}
                      className={cn('transition-colors', post.featured ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-400')}
                      title={post.featured ? 'Remove featured' : 'Set featured'}
                    >
                      <Star className="h-4 w-4" fill={post.featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/admin/blog/edit/${post.id}`}>
                        <button
                          type="button"
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(post)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
