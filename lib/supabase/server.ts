import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '../config';

export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase configuration is missing.');
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(updates) {
        try { updates.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch {
          // Server Components cannot set cookies; proxy.ts persists refreshed
          // sessions before the component runs. Route Handlers can set them.
        }
      },
    },
  });
}
