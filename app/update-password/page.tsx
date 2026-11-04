import { redirect } from 'next/navigation';
import { isConfigured, isOwner } from '../../lib/config';
import { createClient } from '../../lib/supabase/server';
import SetupNotice from '../setup-notice';
import AuthForm from '../login/auth-form';
export const dynamic = 'force-dynamic';
export default async function UpdatePasswordPage() {
  if (!isConfigured()) return <SetupNotice/>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isOwner(user.email)) redirect('/login');
  return <AuthForm passwordUpdate/>;
}
