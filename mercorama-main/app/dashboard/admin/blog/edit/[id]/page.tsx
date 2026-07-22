'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { checkIsAdmin } from '@/lib/admin';
import { BlogEditor } from '@/components/blog/BlogEditor';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const [ready, setReady] = useState(false);

  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) return null;

  return <BlogEditor postId={id} />;
}
