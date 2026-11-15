import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import useAdminData from './useAdminData.js';
import { saveSettings, uploadImage, deleteImage } from '../lib/data';
import { imageUrl } from '../lib/supabase';
import { useAuth } from './AuthContext.jsx';

export default function Settings() {
  const { data, error, reload } = useAdminData();
  const { setPassword } = useAuth();
  const [f, setF] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [p1, setP1] = useState('');
  const [pwMsg, setPwMsg] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const fileRef = useRef();

  const publicUrl = `${window.location.origin}/`;

  useEffect(() => { if (data?.settings) setF({ ...data.settings }); }, [data]);

  useEffect(() => {
    QRCode.toDataURL(publicUrl, { width: 900, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrUrl);
  }, [publicUrl]);

  if (error) return <div className="alert err">{error}</div>;
  if (!f) return <div className="muted pad">Loading…</div>;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const coverSrc = coverPreview || imageUrl(f.cover_image_path);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    let newPath = null;
    try {
      let cover = f.cover_image_path;
      if (coverFile) { newPath = await uploadImage(coverFile); cover = newPath; }
      await saveSettings({ ...f, cover_image_path: cover });
      if (newPath && data.settings.cover_image_path) await deleteImage(data.settings.cover_image_path);
      setCoverFile(null); setCoverPreview(null);
      setMsg({ t: 'ok', m: 'Settings saved.' });
      await reload();
    } catch (err) {
      if (newPath) await deleteImage(newPath);
      setMsg({ t: 'err', m: err.message || 'Could not save.' });
    } finally { setBusy(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (p1.length < 10) return setPwMsg({ t: 'err', m: 'Use at least 10 characters.' });
    try { await setPassword(p1); setP1(''); setPwMsg({ t: 'ok', m: 'Password changed.' }); }
    catch (err) { setPwMsg({ t: 'err', m: err.message }); }
  };

  return (
    <div className="page">
      <h1>Settings</h1>

      <form className="form card" onSubmit={save}>
        <h2>Restaurant details</h2>
        <label>Business name<input value={f.business_name} onChange={set('business_name')} required /></label>
        <label>Tagline<input value={f.tagline} onChange={set('tagline')} /></label>
        <label>Phone (for the Call button)<input type="tel" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></label>
        <label>Address<input value={f.address} onChange={set('address')} /></label>

        <div className="photo">
          <div className="photo-box wide">{coverSrc ? <img src={coverSrc} alt="Cover" /> : <span>No cover photo</span>}</div>
          <div className="photo-actions">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const x = e.target.files?.[0]; if (x) { setCoverFile(x); setCoverPreview(URL.createObjectURL(x)); } }} />
            <button type="button" className="btn" onClick={() => fileRef.current.click()}>{coverSrc ? 'Replace cover photo' : 'Upload cover photo'}</button>
            {coverSrc && <button type="button" className="btn ghost" onClick={() => { setCoverFile(null); setCoverPreview(null); setF({ ...f, cover_image_path: null }); }}>Remove</button>}
          </div>
        </div>
        {msg && <div className={`alert ${msg.t}`}>{msg.m}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
      </form>

      <div className="card qr">
        <h2>QR code</h2>
        <p className="muted">Links to <b>{publicUrl}</b>. The QR never changes when you edit products or prices. Print it and place it on tables or the counter.</p>
        {qrUrl && <img src={qrUrl} alt="Menu QR code" />}
        <a className="btn primary" href={qrUrl} download="right-choice-menu-qr.png">Download QR (PNG)</a>
        <small className="muted">If you later move to a custom domain, generate and print a new QR from that domain's /admin.</small>
      </div>

      <form className="form card" onSubmit={changePw}>
        <h2>Change password</h2>
        <label>New password (min 10 characters)
          <input type="password" minLength={10} autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />
        </label>
        {pwMsg && <div className={`alert ${pwMsg.t}`}>{pwMsg.m}</div>}
        <button className="btn block">Update password</button>
      </form>
    </div>
  );
}
