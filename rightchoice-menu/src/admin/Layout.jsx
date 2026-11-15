import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const NAV = [
  { to: '/admin', label: 'Home', end: true, d: 'M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z' },
  { to: '/admin/products', label: 'Products', d: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/admin/categories', label: 'Categories', d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { to: '/admin/settings', label: 'Settings', d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' },
];

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export default function Layout() {
  const { signOut } = useAuth();
  return (
    <div className="shell">
      <aside className="side">
        <img src="/logo.png" alt="Right Choice" className="side-logo" />
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>
              <Ico d={n.d} /><span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <Link to="/" target="_blank" className="link">View public menu ↗</Link>
          <button className="btn ghost block" onClick={signOut}>Log out</button>
        </div>
      </aside>

      <header className="topbar">
        <img src="/logo.png" alt="Right Choice" />
        <button className="btn ghost sm" onClick={signOut}>Log out</button>
      </header>

      <main className="content"><Outlet /></main>

      <nav className="tabbar">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <Ico d={n.d} /><span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
