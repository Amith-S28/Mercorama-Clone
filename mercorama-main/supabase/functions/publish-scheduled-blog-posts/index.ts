import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      status: 'published',
      published_at: now,
      updated_at: now,
    })
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .select('id, title');

  if (error) {
    console.error('[publish-scheduled] error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const count = data?.length ?? 0;
  console.log(`[publish-scheduled] Published ${count} post(s)`);

  return new Response(
    JSON.stringify({ published: count, posts: data }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
