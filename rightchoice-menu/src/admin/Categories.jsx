import React, { useState } from 'react';
import useAdminData from './useAdminData.js';
import { saveCategory, removeCategory } from '../lib/data';

export default function Categories() {
  const { data, error, reload } = useAdminData();
  const [name, setName] = useState('');
  const [edit, setEdit] = useState(null); // {id,name,sort_order}
  const [msg, setMsg] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const run = async (fn, ok) => {
    try { await fn(); setMsg({ t: 'ok', m: ok }); await reload(); }
    catch (e) { setMsg({ t: 'err', m: e.message || 'Failed.' }); }
  };

  if (error) return <div className="alert err">{error}</div>;
  if (!data) return <div className="muted pad">Loading…</div>;

  const countIn = (id) => data.products.filter((p) => p.category_id === id).length;
  const nextOrder = Math.max(0, ...data.categories.map((c) => c.sort_order)) + 1;

  const move = (i, dir) => {
    const a = data.categories[i], b = data.categories[i + dir];
    if (!a || !b) return;
    run(async () => {
      await saveCategory({ ...a, sort_order: b.sort_order === a.sort_order ? b.sort_order + dir : b.sort_order });
      await saveCategory({ ...b, sort_order: a.sort_order });
    }, 'Order updated.');
  };

  return (
    <div className="page">
      <h1>Categories</h1>

      <form className="card row" onSubmit={(e) => { e.preventDefault(); run(async () => { await saveCategory({ name, sort_order: nextOrder }); setName(''); }, 'Category added.'); }}>
        <input required maxLength={60} placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary">＋ Add</button>
      </form>

      {msg && <div className={`alert ${msg.t}`} onClick={() => setMsg(null)}>{msg.m}</div>}

      <div className="clist">
        {data.categories.map((c, i) => (
          <div key={c.id} className="crow">
            {edit?.id === c.id ? (
              <>
                <input value={edit.name} maxLength={60} autoFocus onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                <button className="btn primary sm" onClick={() => run(async () => { await saveCategory(edit); setEdit(null); }, 'Category renamed.')}>Save</button>
                <button className="btn ghost sm" onClick={() => setEdit(null)}>✕</button>
              </>
            ) : (
              <>
                <div className="crow-main"><b>{c.name}</b><small>{countIn(c.id)} products</small></div>
                <button className="btn ghost sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button className="btn ghost sm" aria-label="Move down" disabled={i === data.categories.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button className="btn sm" onClick={() => setEdit({ ...c })}>Rename</button>
                <button className="btn danger sm" onClick={() => setConfirm(c)}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>

      {confirm && (
        <div className="modal" onClick={() => setConfirm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete “{confirm.name}”?</h3>
            <p className="muted">
              {countIn(confirm.id)} product(s) in this category will NOT be deleted, but they will show under “Other” until you give them a new category.
            </p>
            <div className="row">
              <button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn danger" onClick={() => { const c = confirm; setConfirm(null); run(() => removeCategory(c.id), 'Category deleted.'); }}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
