import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminData from './useAdminData.js';
import { quickUpdateProduct, removeProduct } from '../lib/data';
import { imageUrl, formatPrice } from '../lib/supabase';

const STATUS = [
  { v: 'available', l: 'Available' },
  { v: 'sold_out', l: 'Sold out' },
  { v: 'hidden', l: 'Hidden' },
];

export default function Products() {
  const { data, error, reload } = useAdminData();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [msg, setMsg] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [priceEdit, setPriceEdit] = useState({}); // id -> string

  const list = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    return data.products.filter(
      (p) => (cat === 'all' || p.category_id === cat) && (!s || p.name.toLowerCase().includes(s))
    );
  }, [data, q, cat]);

  const catName = (id) => data.categories.find((c) => c.id === id)?.name || 'No category';

  const run = async (fn, ok) => {
    try { await fn(); setMsg({ t: 'ok', m: ok }); await reload(); }
    catch (e) { setMsg({ t: 'err', m: e.message || 'Failed to save.' }); }
  };

  const savePrice = (p) => {
    const v = Number(priceEdit[p.id]);
    if (!Number.isFinite(v) || v < 0) return setMsg({ t: 'err', m: 'Enter a valid price.' });
    run(async () => {
      await quickUpdateProduct(p.id, { price: v, is_demo: false });
      setPriceEdit(({ [p.id]: _, ...rest }) => rest);
    }, `${p.name} price updated to ${formatPrice(v)}.`);
  };

  if (error) return <div className="alert err">{error}</div>;
  if (!data) return <div className="muted pad">Loading…</div>;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn primary">＋ Add</Link>
      </div>

      <div className="filters">
        <input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {msg && <div className={`alert ${msg.t}`} onClick={() => setMsg(null)}>{msg.m}</div>}

      <div className="plist">
        {list.map((p) => {
          const img = imageUrl(p.image_path);
          const editing = priceEdit[p.id] !== undefined;
          return (
            <div key={p.id} className={`prow ${p.status !== 'available' ? 'dim' : ''}`}>
              <div className="prow-img">{img ? <img src={img} alt="" loading="lazy" /> : <span>No photo</span>}</div>
              <div className="prow-main">
                <b>{p.name}</b>
                <small>{catName(p.category_id)} · {p.diet === 'non_veg' ? 'Non-Veg' : p.diet === 'veg' ? 'Veg' : 'Beverage'}{p.is_demo ? ' · SAMPLE' : ''}</small>

                {editing ? (
                  <div className="price-edit">
                    <span>₹</span>
                    <input type="number" inputMode="decimal" min="0" step="0.5" autoFocus value={priceEdit[p.id]}
                      onChange={(e) => setPriceEdit({ ...priceEdit, [p.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && savePrice(p)} />
                    <button className="btn primary sm" onClick={() => savePrice(p)}>Save</button>
                    <button className="btn ghost sm" onClick={() => setPriceEdit(({ [p.id]: _, ...r }) => r)}>✕</button>
                  </div>
                ) : (
                  <button className="price-btn" onClick={() => setPriceEdit({ ...priceEdit, [p.id]: String(p.price) })}>
                    {formatPrice(p.price)} <i>✎ change price</i>
                  </button>
                )}

                <div className="prow-actions">
                  <select value={p.status} aria-label="Availability"
                    onChange={(e) => run(() => quickUpdateProduct(p.id, { status: e.target.value }), `${p.name} is now ${STATUS.find((s) => s.v === e.target.value).l.toLowerCase()}.`)}>
                    {STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                  <Link className="btn sm" to={`/admin/products/${p.id}`}>Edit</Link>
                  <button className="btn danger sm" onClick={() => setConfirm(p)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="muted pad">No products found.</p>}
      </div>

      {confirm && (
        <div className="modal" onClick={() => setConfirm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete “{confirm.name}”?</h3>
            <p className="muted">This permanently removes the product and its photo. This cannot be undone. To remove it only temporarily, set it to <b>Hidden</b> instead.</p>
            <div className="row">
              <button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn danger" onClick={() => { const p = confirm; setConfirm(null); run(() => removeProduct(p), `${p.name} deleted.`); }}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
