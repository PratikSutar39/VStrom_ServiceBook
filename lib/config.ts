export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) return null;
  } catch { return null; }
  return { url, key };
}
export function isConfigured() {
  return !!getSupabaseConfig() && !!process.env.RIDEBOOK_OWNER_EMAIL?.trim();
}
export function isOwner(email: string | undefined | null) {
  const expected = process.env.RIDEBOOK_OWNER_EMAIL?.trim().toLowerCase();
  return !!expected && !!email && expected === email.trim().toLowerCase();
}
