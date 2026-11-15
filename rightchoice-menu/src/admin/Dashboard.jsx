import React from 'react';
import { Link } from 'react-router-dom';
import useAdminData from './useAdminData.js';

export default function Dashboard() {
  const { data, error } = useAdminData();
  if (error) return <div className="alert err">{error}</div>;
  if (!data) return <div className="muted pad">Loading…</div>;

  const p = data.products;
  const stats = [
    { label: 'Total products', value: p.length },
    { label: 'Categories', value: data.categories.length },
    { label: 'Available', value: p.filter((x) => x.status === 'available').length, tone: 'ok' },
    { label: 'Sold out', value: p.filter((x) => x.status === 'sold_out').length, tone: 'bad' },
    { label: 'Hidden', value: p.filter((x) => x.status === 'hidden').length, tone: 'dim' },
  ];
  const demoCount = p.filter((x) => x.is_demo).length;

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className={`stat ${s.tone || ''}`}>
            <b>{s.value}</b><span>{s.label}</span>
          </div>
        ))}
      </div>

      {demoCount > 0 && (
        <div className="alert warn">
          {demoCount} sample product{demoCount > 1 ? 's' : ''} with <b>placeholder prices</b> are live on your menu.
          Edit each one (saving clears the “sample” tag) or delete them.
        </div>
      )}

      <div className="actions">
        <Link to="/admin/products/new" className="btn primary">＋ Add new product</Link>
        <Link to="/admin/products" className="btn">Manage products</Link>
        <Link to="/admin/categories" className="btn">Manage categories</Link>
        <Link to="/admin/settings" className="btn">Settings & QR code</Link>
      </div>
    </div>
  );
}
