import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Login({ denied }) {
  const { signIn, sendReset } = useAuth();
  const [mode, setMode] = useState('login'); // login | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(denied ? { t: 'err', m: 'This account is not authorised for the admin dashboard.' } : null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await sendReset(email.trim());
        setMsg({ t: 'ok', m: 'If this email belongs to the owner account, a reset link has been sent. Check your inbox.' });
      }
    } catch (err) {
      setMsg({ t: 'err', m: err.message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo.png" alt="Right Choice" className="login-logo" />
        <h1>{mode === 'login' ? 'Owner sign in' : 'Reset password'}</h1>
        <p className="muted">Private area — authorised owner only.</p>

        <label>Email
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode === 'login' && (
          <label>Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}

        {msg && <div className={`alert ${msg.t}`}>{msg.m}</div>}

        <button className="btn primary block" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Send reset link'}
        </button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'forgot' : 'login'); setMsg(null); }}>
          {mode === 'login' ? 'Forgot password?' : 'Back to sign in'}
        </button>
        <Link to="/" className="link muted">← View public menu</Link>
      </form>
    </div>
  );
}
