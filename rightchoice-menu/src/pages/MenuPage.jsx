import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { fetchMenu, } from '../lib/data';
import { imageUrl, supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'veg', label: 'Veg' },
  { key: 'non_veg', label: 'Non-Veg' },
  { key: 'beverage', label: 'Beverages' },
];

const Icon = {
  phone: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
  ),
};

export default function MenuPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState(() => localStorageGet('rc_view') || 'grid');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const [toast, setToast] = useState('');
  const sectionRefs = useRef({});
  const chipRefs = useRef({});

  const load = useCallback(async () => {
    try {
      setData(await fetchMenu());
      setError('');
    } catch (e) {
      setError('Could not load the menu. Please check your connection and try again.');
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh when the customer returns to the tab so prices are never stale.
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);

  useEffect(() => {
    document.title = data?.settings?.business_name
      ? `${data.settings.business_name} — Menu`
      : 'Right Choice Coolbar — Menu';
  }, [data]);

  const setViewPersist = (v) => {
    setView(v);
    localStorageSet('rc_view', v);
  };

  // Group visible products by category after filter + search
  const groups = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const match = (p) =>
      (filter === 'all' || p.diet === filter) &&
      (!q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    const list = data.products.filter(match);
    const result = data.categories
      .map((c) => ({ cat: c, items: list.filter((p) => p.category_id === c.id) }))
      .filter((g) => g.items.length);
    const uncategorised = list.filter((p) => !data.categories.some((c) => c.id === p.category_id));
    if (uncategorised.length) result.push({ cat: { id: 'other', name: 'Other' }, items: uncategorised });
    return result;
  }, [data, filter, query]);

  // Scroll-spy for the category chips
  useEffect(() => {
    if (!groups.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveCat(visible[0].target.dataset.cat);
      },
      { rootMargin: '-140px 0px -65% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [groups]);

  useEffect(() => {
    const chip = chipRefs.current[activeCat];
    if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeCat]);

  const jump = (id) => {
    const el = sectionRefs.current[id];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 128;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const share = async () => {
    const url = window.location.origin + '/';
    const title = data?.settings?.business_name || 'Right Choice Coolbar';
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} — Menu`, url });
      } else {
        await navigator.clipboard.writeText(url);
        flash('Link copied');
      }
    } catch {
      /* user cancelled share */
    }
  };

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2000);
  };

  const s = data?.settings;
  const cover = imageUrl(s?.cover_image_path);
  const phone = (s?.phone || '').replace(/[^\d+]/g, '');

  return (
    <div className="menu-root">
      {/* ---------- Cover ---------- */}
      <header className="cover" style={cover ? { '--cover': `url(${cover})` } : undefined}>
        <div className={`cover-bg ${cover ? 'has-img' : ''}`} />
        <div className="cover-glow" />
        <div className="cover-inner">
          <img className="cover-logo" src="/logo.png" alt="Right Choice logo" />
          <h1 className="cover-name">{s?.business_name || 'Right Choice Coolbar'}</h1>
          <p className="cover-tag">{s?.tagline}</p>
          {s?.address && <p className="cover-addr">{s.address}</p>}
          <div className="cover-actions">
            {phone ? (
              <a className="btn-glass" href={`tel:${phone}`}>{Icon.phone}<span>Call</span></a>
            ) : (
              <button className="btn-glass" disabled title="Phone number not set">{Icon.phone}<span>Call</span></button>
            )}
            <button className="btn-glass" onClick={share}>{Icon.share}<span>Share</span></button>
          </div>
        </div>
      </header>

      {/* ---------- Sticky controls ---------- */}
      <div className="controls">
        <div className="controls-row">
          <div className="seg" role="tablist" aria-label="Diet filter">
            {FILTERS.map((f) => (
              <button key={f.key} role="tab" aria-selected={filter === f.key}
                className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <button className={`icon-btn ${searchOpen ? 'on' : ''}`} aria-label="Search"
            onClick={() => { setSearchOpen((o) => !o); if (searchOpen) setQuery(''); }}>
            {Icon.search}
          </button>
          <div className="seg seg-view">
            <button aria-label="Grid view" className={view === 'grid' ? 'on' : ''} onClick={() => setViewPersist('grid')}>{Icon.grid}</button>
            <button aria-label="List view" className={view === 'list' ? 'on' : ''} onClick={() => setViewPersist('list')}>{Icon.list}</button>
          </div>
        </div>

        {searchOpen && (
          <div className="searchbar">
            {Icon.search}
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, drinks, desserts…" aria-label="Search menu" />
            {query && <button aria-label="Clear" onClick={() => setQuery('')}>{Icon.close}</button>}
          </div>
        )}

        {groups.length > 0 && (
          <nav className="chips" aria-label="Categories">
            {groups.map(({ cat }) => (
              <button key={cat.id} ref={(el) => (chipRefs.current[cat.id] = el)}
                className={activeCat === cat.id ? 'on' : ''} onClick={() => jump(cat.id)}>
                {cat.name}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* ---------- Menu ---------- */}
      <main className="menu-main">
        {error && (
          <div className="state">
            <p>{error}</p>
            <button className="btn-red" onClick={load}>Try again</button>
          </div>
        )}
        {!data && !error && <Skeleton view={view} />}
        {data && groups.length === 0 && !error && (
          <div className="state"><p>{query ? `No results for “${query}”.` : 'Nothing to show here yet.'}</p></div>
        )}
        {groups.map(({ cat, items }) => (
          <section key={cat.id} data-cat={cat.id} ref={(el) => (sectionRefs.current[cat.id] = el)} className="cat-section">
            <h2 className="cat-title"><span>{cat.name}</span><em>{items.length}</em></h2>
            <div className={`products ${view}`}>
              {items.map((p) => <ProductCard key={p.id} product={p} view={view} />)}
            </div>
          </section>
        ))}
      </main>

      <footer className="menu-foot">
        <img src="/logo.png" alt="" />
        <p>© {new Date().getFullYear()} {s?.business_name || 'Right Choice Coolbar'}</p>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Skeleton({ view }) {
  return (
    <div className={`products ${view} skeleton`}>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="sk-card" />)}
    </div>
  );
}

function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
