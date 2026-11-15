import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useAdminData from './useAdminData.js';
import { saveProduct, uploadImage, deleteImage } from '../lib/data';
import { imageUrl } from '../lib/supabase';

const EMPTY = { name: '', description: '', price: '', category_id: '', diet: 'veg', status: 'available', image_path: null };

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, error } = useAdminData();
  const [f, setF] = useState(EMPTY);
  const [original, setOriginal] = useState(null);
  const [file, setFile] = useState(null);          // newly picked file (not yet uploaded)
  const [preview, setPreview] = useState(null);     // local preview URL
  const [removeImg, setRemoveImg] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!data) return;
    if (id) {
      const p = data.products.find((x) => x.id === id);
      if (p) { setOriginal(p); setF({ ...p, price: String(p.price), category_id: p.category_id || '' }); }
    } else if (!f.category_id && data.categories[0]) {
      setF((x) => ({ ...x, category_id: data.categories[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, id]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pick = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith('image/')) return setMsg('Please choose an image file.');
    if (picked.size > 15 * 1024 * 1024) return setMsg('Image is too large (max 15 MB before optimisation).');
    setMsg(null);
    setFile(picked);
    setRemoveImg(false);
    setPreview(URL.createObjectURL(picked));
  };

  const currentSrc = preview || (removeImg ? null : imageUrl(f.image_path));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    let newPath = null;
    try {
      let image_path = removeImg ? null : f.image_path;
      if (file) { newPath = await uploadImage(file); image_path = newPath; }
      await saveProduct({ ...f, image_path }, original?.image_path);
      nav('/admin/products');
    } catch (err) {
      // roll back an orphaned upload if the database save failed
      if (newPath) await deleteImage(newPath);
      setMsg(err.message || 'Could not save.');
      setBusy(false);
    }
  };

  if (error) return <div className="alert err">{error}</div>;
  if (!data) return <div className="muted pad">Loading…</div>;
  if (id && !original) return <div className="page"><p>Product not found.</p><Link to="/admin/products">Back</Link></div>;

  return (
    <div className="page">
      <div className="page-head">
        <h1>{id ? 'Edit product' : 'Add product'}</h1>
        <Link to="/admin/products" className="btn ghost">Cancel</Link>
      </div>

      <form className="form card" onSubmit={submit}>
        <div className="photo">
          <div className="photo-box">
            {currentSrc ? <img src={currentSrc} alt="Preview" /> : <span>No photo</span>}
          </div>
          <div className="photo-actions">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
            <button type="button" className="btn" onClick={() => fileRef.current.click()}>
              {currentSrc ? 'Replace photo' : 'Upload photo'}
            </button>
            {currentSrc && (
              <button type="button" className="btn ghost" onClick={() => { setFile(null); setPreview(null); setRemoveImg(true); if (fileRef.current) fileRef.current.value = ''; }}>
                Remove photo
              </button>
            )}
            <small className="muted">Resized &amp; optimised automatically. {file && 'New photo uploads when you save.'}</small>
          </div>
        </div>

        <label>Name
          <input required maxLength={120} value={f.name} onChange={set('name')} placeholder="e.g. Fried Chicken (2 pc)" />
        </label>

        <div className="grid2">
          <label>Price (₹)
            <input required type="number" inputMode="decimal" min="0" step="0.5" value={f.price} onChange={set('price')} placeholder="120" />
          </label>
          <label>Category
            <select value={f.category_id} onChange={set('category_id')}>
              <option value="">— None —</option>
              {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>

        <div className="grid2">
          <label>Type
            <select value={f.diet} onChange={set('diet')}>
              <option value="veg">Veg</option>
              <option value="non_veg">Non-Veg</option>
              <option value="beverage">Beverage</option>
            </select>
          </label>
          <label>Availability
            <select value={f.status} onChange={set('status')}>
              <option value="available">Available</option>
              <option value="sold_out">Sold out</option>
              <option value="hidden">Hidden (not shown to customers)</option>
            </select>
          </label>
        </div>

        <label>Description
          <textarea rows={3} maxLength={500} value={f.description} onChange={set('description')} placeholder="Short, tasty description" />
        </label>

        {msg && <div className="alert err">{msg}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Add product'}</button>
      </form>
    </div>
  );
}
