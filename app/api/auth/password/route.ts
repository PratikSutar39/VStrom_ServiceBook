import { requireApiUser } from '../../../../lib/auth';
import { isSameOrigin, json } from '../../../../lib/request';
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: 'Invalid request.' }, 400);
    const { password } = JSON.parse(raw);
    if (typeof password !== 'string' || password.length < 12 || password.length > 256)
      return json({ error: 'Use a password with 12–256 characters.' }, 400);
    const { error } = await auth.supabase.auth.updateUser({ password });
    if (error) return json({ error: 'The password could not be changed. Try a different password or request a new reset link.' }, 400);
    return json({ ok: true });
  } catch { return json({ error: 'The password could not be changed.' }, 400); }
}
