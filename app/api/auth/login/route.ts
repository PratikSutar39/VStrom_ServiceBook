import { z } from 'zod';
import { isConfigured, isOwner } from '../../../../lib/config';
import { isSameOrigin, json } from '../../../../lib/request';
import { createClient } from '../../../../lib/supabase/server';
const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256) });
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!isConfigured()) return json({ error: 'Finish the Supabase setup before signing in.' }, 503);
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: 'Invalid request.' }, 400);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ error: 'Enter a valid email and password.' }, 400);
    const { email, password } = parsed.data;
    if (!isOwner(email)) return json({ error: 'Email or password is incorrect, or this account is not permitted.' }, 401);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user || !isOwner(data.user.email))
      return json({ error: 'Email or password is incorrect, or this account is not permitted.' }, 401);
    return json({ ok: true });
  } catch { return json({ error: 'Sign-in could not be completed. Please try again.' }, 400); }
}
