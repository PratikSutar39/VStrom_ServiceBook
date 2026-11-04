import { isSameOrigin, json } from '../../../../lib/request';
import { isConfigured } from '../../../../lib/config';
import { createClient } from '../../../../lib/supabase/server';
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!isConfigured()) return json({ error: 'Configuration is incomplete.' }, 503);
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) return json({ error: 'Could not sign out. Please retry.' }, 503);
    return json({ ok: true });
  } catch { return json({ error: 'Could not sign out. Please retry.' }, 503); }
}
