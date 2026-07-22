'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  status: 'draft' | 'published' | 'scheduled';
  category: string | null;
  tags: string[] | null;
  featured: boolean;
  design_blocks: DesignBlock[] | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DesignBlock = {
  id: string;
  type: 'hero' | 'section' | 'callout' | 'step_list';
  label: string;
};

export function usePublishedPosts(category?: string) {
  return useQuery({
    queryKey: ['blog', 'published', category],
    queryFn: async () => {
      let q = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false });
      if (category && category !== 'all') q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

export function usePublishedPost(slug: string) {
  return useQuery({
    queryKey: ['blog', 'post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
  });
}

export function useAllBlogPosts() {
  return useQuery({
    queryKey: ['blog', 'admin', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

export function useBlogPostById(id: string | null) {
  return useQuery({
    queryKey: ['blog', 'admin', 'post', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
  });
}

export function useSaveBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: Partial<BlogPost> & { title: string }) => {
      const payload = { ...post, updated_at: new Date().toISOString() };
      if (post.id) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', post.id)
          .select()
          .single();
        if (error) throw error;
        return data as BlogPost;
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data as BlogPost;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      toast.success('Post saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      toast.success('Post deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function uploadBlogImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('blog-images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
  return data.publicUrl;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
