import { NextResponse } from 'next/server';
import { isConfigured, isOwner } from '../../../lib/config';
import { safeReturnPath } from '../../../lib/request';
import { createClient } from '../../../lib/supabase/server';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (isConfigured() && code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user && isOwner(data.user.email))
        return NextResponse.redirect(new URL(safeReturnPath(url.searchParams.get('next')), url.origin));
      await supabase.auth.signOut({ scope: 'local' });
    } catch { /* Render a generic error with no token details. */ }
  }
  return NextResponse.redirect(new URL('/login?error=expired-link', url.origin));
}
