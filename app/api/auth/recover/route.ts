import { isConfigured, isOwner } from '../../../../lib/config';
import { isSameOrigin, json } from '../../../../lib/request';
import { createClient } from '../../../../lib/supabase/server';
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!isConfigured()) return json({ error: 'Configuration is incomplete.' }, 503);
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: 'Invalid request.' }, 400);
    const { email } = JSON.parse(raw);
    if (typeof email !== 'string' || email.length > 254 || !email.includes('@')) return json({ error: 'Enter a valid email address.' }, 400);
    if (isOwner(email)) {
      const supabase = await createClient();
      const redirectTo = new URL('/auth/callback', request.url);
      redirectTo.searchParams.set('next', '/update-password');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo.toString() });
      if (error) return json({ error: 'The reset email could not be sent. Please try again later.' }, 503);
    }
    return json({ ok: true, message: 'If this email belongs to the owner account, a reset link has been sent. Open it in this browser.' });
  } catch { return json({ error: 'The reset request could not be completed.' }, 400); }
}
