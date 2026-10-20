import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiKey, FiShield } from 'react-icons/fi';
import { supportsPasskeys, registerPasskey, passkeyError } from '../utils/passkeys';

const api = `${import.meta.env.VITE_API_URL}/api/auth/seller-passkeys`;

export default function SellerPasskeys() {
  const [keys, setKeys] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [action, setAction] = useState(null);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('My phone or computer');
  const [challenge, setChallenge] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const supported = supportsPasskeys();

  useEffect(() => {
    let active = true;
    axios.get(api).then(({ data }) => { if (active) { setKeys(data.passkeys); setLoaded(true); } })
      .catch(() => { if (active) setError('Sign-in methods could not be loaded. Refresh to try again.'); });
    return () => { active = false; };
  }, []);
  const reset = () => { setAction(null); setPassword(''); setChallenge(null); setRegistration(null); setCode(''); setError(''); };
  const complete = async text => {
    reset(); setMessage(text);
    const { data } = await axios.get(api); setKeys(data.passkeys);
  };
  const begin = async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await axios.post(`${api}/manage`, { action: action.type, credentialId: action.id, name, password });
      setChallenge(data); setPassword('');
    } catch (e) { setError(e.response?.data?.message || 'Security code could not be sent.'); }
    finally { setBusy(false); }
  };
  const confirm = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { data } = await axios.post(`${api}/confirm`, { challengeToken: challenge.challengeToken, code });
      if (data.removed) await complete(data.message);
      else { setRegistration(data); setCode(''); }
    } catch (e) { setError(e.response?.data?.message || 'The code could not be verified.'); }
    finally { setBusy(false); }
  };
  // A separate click preserves the user gesture required by some device/browser prompts.
  const create = async () => {
    setBusy(true); setError('');
    try {
      const credential = await registerPasskey(registration.options);
      const { data } = await axios.post(`${api}/register`, { challengeToken: registration.challengeToken, credential });
      await complete(data.message);
    } catch (e) { setError(passkeyError(e)); setRegistration(null); setChallenge(null); }
    finally { setBusy(false); }
  };

  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="passkeys-title">
    <div className="flex items-start gap-3"><FiShield className="mt-1 shrink-0 text-xl text-brand-primary"/><div>
      <h2 id="passkeys-title" className="text-xl font-bold">Sign-in methods</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Use a passkey to sign in with your fingerprint, face or device PIN, without an emailed code. Your device handles verification; we do not receive your fingerprint, face or PIN.</p>
      <p className="mt-2 text-sm text-slate-500">Your password and email-code sign-in stays available if you lose access to a passkey.</p>
    </div></div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {loaded && <ul className="mt-4 divide-y rounded-xl border border-slate-200">{keys.length ? keys.map(key => <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0"><p className="break-words font-semibold">{key.name}</p><p className="mt-1 text-xs text-slate-500">Added {new Date(key.createdAt).toLocaleDateString('en-IN')}{key.lastUsedAt ? ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString('en-IN')}` : ''}</p></div>
      <button type="button" disabled={busy || Boolean(action)} onClick={() => { reset(); setMessage(''); setAction({ type: 'remove', id: key.id, name: key.name }); }} className="text-sm font-semibold text-red-700 underline disabled:opacity-50">Remove<span className="sr-only"> {key.name}</span></button>
    </li>) : <li className="p-4 text-sm text-slate-500">No passkeys added yet.</li>}</ul>}
    {!supported && <p className="mt-4 text-sm text-amber-800">Open this website in a supported browser on your phone or computer to add a passkey.</p>}
    {loaded && !action && <button type="button" disabled={!supported || keys.length >= 10} onClick={() => { reset(); setMessage(''); setAction({ type: 'add' }); }} className="btn-secondary mt-4"><FiKey/> Add a passkey</button>}
    {action && <div className="mt-5 max-w-lg rounded-xl bg-slate-50 p-4 sm:p-5">
      <h3 className="font-bold">{action.type === 'add' ? 'Add a passkey securely' : `Remove ${action.name}`}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">Confirm your current password and a fresh email code before changing your sign-in methods.</p>
      {registration ? <div className="mt-4"><p className="text-sm text-slate-600">Email verified. Continue to your device’s passkey setup. Save it only to a device or password manager you control.</p><button type="button" onClick={create} disabled={busy} className="btn-primary mt-4">{busy ? 'Waiting for your device…' : 'Create passkey on my device'}</button></div> : challenge ? <form onSubmit={confirm} className="mt-4 space-y-4">
        <label className="block text-sm font-semibold">Email code sent to {challenge.maskedEmail}<input required inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="field-control mt-2"/></label>
        <p className="text-xs text-slate-500">Expires in 5 minutes. To request a new code, cancel and start again after one minute.</p>
        <button disabled={busy || code.length !== 6} className="btn-primary">{busy ? 'Verifying…' : action.type === 'remove' ? 'Verify and remove passkey' : 'Verify email code'}</button>
      </form> : <form onSubmit={begin} className="mt-4 space-y-4">
        {action.type === 'add' && <label className="block text-sm font-semibold">Passkey name<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} className="field-control mt-2" placeholder="For example, My phone"/></label>}
        <label className="block text-sm font-semibold">Current password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="field-control mt-2"/></label>
        <button disabled={busy} className="btn-primary">{busy ? 'Sending…' : 'Send confirmation code'}</button>
      </form>}
      <button type="button" disabled={busy} onClick={reset} className="mt-4 text-sm font-semibold text-slate-500 underline">Cancel</button>
    </div>}
  </section>;
}
