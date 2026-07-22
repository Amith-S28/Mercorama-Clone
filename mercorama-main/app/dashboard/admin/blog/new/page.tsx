'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkIsAdmin } from '@/lib/admin';
import { BlogEditor } from '@/components/blog/BlogEditor';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) return null;

  return <BlogEditor />;
}
