import { isConfigured, isOwner } from './config';
import { json } from './request';
import { createClient } from './supabase/server';

export async function requireApiUser() {
  if (!isConfigured()) return { ok: false as const, response: json({ error: 'Finish the Supabase setup before using your ridebook.' }, 503) };
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { ok: false as const, response: json({ error: 'Please sign in to access your ridebook.' }, 401) };
    if (!isOwner(user.email)) return { ok: false as const, response: json({ error: 'This account does not have access to this ridebook.' }, 403) };
    return { ok: true as const, supabase, user };
  } catch { return { ok: false as const, response: json({ error: 'Your session could not be verified. Please try signing in again.' }, 503) }; }
}
