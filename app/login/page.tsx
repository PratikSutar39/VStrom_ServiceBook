import { redirect } from 'next/navigation';
import { isConfigured, isOwner } from '../../lib/config';
import { createClient } from '../../lib/supabase/server';
import SetupNotice from '../setup-notice';
import AuthForm from './auth-form';
export const dynamic = 'force-dynamic';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{error?: string}> }) {
  if (!isConfigured()) return <SetupNotice/>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && isOwner(user.email)) redirect('/');
  const params = await searchParams;
  return <AuthForm initialError={params.error ? 'This link has expired or could not be verified. Request a new link and open it in the browser where you requested it.' : ''}/>;
}
