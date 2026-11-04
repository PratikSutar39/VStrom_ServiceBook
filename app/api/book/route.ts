import { requireApiUser } from '../../../lib/auth';
import { isSameOrigin, json } from '../../../lib/request';
import { bookSchema, defaultBook } from '../../../lib/model';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  try {
    const { data, error } = await auth.supabase.from('ridebooks')
      .select('data, revision').eq('user_id', auth.user.id).maybeSingle();
    if (error) return json({ error: error.code === '42P01' || error.code === 'PGRST205'
      ? 'Database setup is incomplete. Run the SQL migration included in the repository.'
      : 'Your records could not be loaded. Please retry.' }, 503);
    return json(data ? { data: data.data, revision: data.revision } : { data: defaultBook(), revision: 0 });
  } catch { return json({ error: 'Your records could not be loaded. Please retry.' }, 503); }
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  try {
    const raw = await request.text();
    if (raw.length > 1_500_000) return json({ error: 'This ridebook is too large.' }, 413);
    let input;
    try { input = JSON.parse(raw); } catch { return json({ error: 'Invalid request.' }, 400); }
    if (!input || typeof input !== 'object') return json({ error: 'Invalid request.' }, 400);
    const parsed = bookSchema.safeParse(input.data);
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    if (!Number.isSafeInteger(input.revision) || input.revision < 0 || input.revision >= 2147483646)
      return json({ error: 'Invalid revision.' }, 400);
    const revision = input.revision + 1;
    const payload = { data: parsed.data, revision, updated_at: new Date().toISOString() };
    const result = input.revision === 0
      ? await auth.supabase.from('ridebooks').insert({ ...payload, user_id: auth.user.id }).select('revision, updated_at').maybeSingle()
      : await auth.supabase.from('ridebooks').update(payload).eq('user_id', auth.user.id).eq('revision', input.revision).select('revision, updated_at').maybeSingle();
    if (result.error?.code === '23505' || (!result.error && !result.data))
      return json({ error: 'Your ridebook changed in another tab. Reload before saving so those changes are preserved.' }, 409);
    if (result.error) return json({ error: 'Save failed. Your changes have not been saved. Please retry.' }, 503);
    return json({ revision: result.data!.revision, updatedAt: result.data!.updated_at });
  } catch { return json({ error: 'Save failed. Your changes have not been saved. Please retry.' }, 503); }
}
