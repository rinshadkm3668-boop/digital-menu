import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage.jsx';
import { isConfigured } from './lib/supabase';
import SetupNotice from './components/SetupNotice.jsx';

// The admin code is loaded only when /admin is visited, so customers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  if (!isConfigured) return <SetupNotice />;
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="adm-boot">Loading…</div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
