'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, CircleAlert, LockKeyhole, Route, ShieldCheck } from 'lucide-react';
export default function AuthForm({ initialError = '', passwordUpdate = false }: { initialError?: string; passwordUpdate?: boolean }) {
  const [recover, setRecover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');
    if (passwordUpdate && password !== form.get('confirm')) { setError('The passwords do not match.'); setBusy(false); return; }
    try {
      const response = await fetch(passwordUpdate ? '/api/auth/password' : recover ? '/api/auth/recover' : '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(passwordUpdate ? { password } : recover ? { email } : { email, password }),
      });
      const result = await response.json() as {error?: string; message?: string};
      if (!response.ok) throw Error(result.error || 'Please try again.');
      if (recover) setMessage(result.message || 'Check your email for the reset link.');
      else window.location.assign('/');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell"><section className="auth-card">
    <a href="/" className="auth-brand"><Route size={25}/>ridebook.</a>
    <div className="auth-symbol"><LockKeyhole size={28}/></div>
    <span className="eyebrow">YOUR PERSONAL GARAGE</span>
    <h1>{passwordUpdate ? 'Choose a new password.' : recover ? 'Get back to your ridebook.' : 'Welcome back to the ride.'}</h1>
    <p>{passwordUpdate ? 'Use a strong password with at least 12 characters.' : recover ? 'Request a reset link for your owner account.' : 'Sign in to keep your V-Strom’s care, records and next journey in one place.'}</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        {!passwordUpdate && <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="username" maxLength={254} required autoFocus/></label>}
        {!recover && <label className="field"><span>{passwordUpdate ? 'New password' : 'Password'}</span><input name="password" type="password" autoComplete={passwordUpdate ? 'new-password' : 'current-password'} minLength={passwordUpdate ? 12 : 1} maxLength={256} required/></label>}
        {passwordUpdate && <label className="field"><span>Confirm new password</span><input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={256} required/></label>}
        {error && <div className="form-error" role="alert"><CircleAlert size={17}/>{error}</div>}
        {message && <div className="auth-success" role="status">{message}</div>}
        <button className="primary full" type="submit">{busy ? 'Please wait…' : passwordUpdate ? 'Save password' : recover ? 'Send reset link' : 'Sign in'}<ArrowRight size={17}/></button>
        {!passwordUpdate && <button type="button" className="text-btn auth-toggle" onClick={() => {setRecover(!recover);setError('');setMessage('');}}>{recover ? 'Back to sign in' : 'Forgot your password?'}</button>}
      </fieldset>
    </form>
    <div className="auth-privacy"><ShieldCheck size={17}/><span>Access is limited to the owner’s account. Your records stay private.</span></div>
  </section></main>;
}
