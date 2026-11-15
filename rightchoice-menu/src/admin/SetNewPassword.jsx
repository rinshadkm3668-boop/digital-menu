import React, { useState } from 'react';
import { useAuth } from './AuthContext.jsx';

export default function SetNewPassword() {
  const { setPassword, finishRecovery } = useAuth();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (p1.length < 10) return setMsg('Use at least 10 characters.');
    if (p1 !== p2) return setMsg('Passwords do not match.');
    setBusy(true); setMsg(null);
    try {
      await setPassword(p1);
      await finishRecovery();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo.png" alt="Right Choice" className="login-logo" />
        <h1>Set a new password</h1>
        <label>New password
          <input type="password" required minLength={10} autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />
        </label>
        <label>Confirm password
          <input type="password" required minLength={10} autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} />
        </label>
        {msg && <div className="alert err">{msg}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </div>
  );
}
