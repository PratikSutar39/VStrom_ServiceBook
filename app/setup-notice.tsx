import { Route, Settings2, ArrowUpRight } from 'lucide-react';
export default function SetupNotice() {
  return <main className="auth-shell"><section className="auth-card setup-card">
    <a href="/" className="auth-brand"><Route size={25}/>ridebook.</a>
    <div className="auth-symbol"><Settings2 size={29}/></div>
    <span className="eyebrow">ONE-TIME SETUP</span>
    <h1>Your ridebook is almost ready.</h1>
    <p>Connect your Supabase project and owner account to start saving your bike’s records.</p>
    <ol className="setup-list">
      <li>Run the database script from the repository in Supabase’s SQL Editor.</li>
      <li>Create your owner account in Supabase Authentication and disable public sign-ups.</li>
      <li>Add the three variables from <code>.env.example</code> to Vercel, then redeploy.</li>
    </ol>
    <a className="primary full" href="https://github.com/PratikSutar39/VStrom_ServiceBook#deploy-on-vercel" target="_blank" rel="noreferrer">Open setup instructions<ArrowUpRight size={16}/></a>
    <small>No sample mileage or service history has been assumed.</small>
  </section></main>;
}
