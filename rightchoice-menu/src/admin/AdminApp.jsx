import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Login from './Login.jsx';
import SetNewPassword from './SetNewPassword.jsx';
import Layout from './Layout.jsx';
import Dashboard from './Dashboard.jsx';
import Products from './Products.jsx';
import ProductForm from './ProductForm.jsx';
import Categories from './Categories.jsx';
import Settings from './Settings.jsx';

function Gate() {
  const { status } = useAuth();
  if (status === 'loading') return <div className="adm-boot">Loading…</div>;
  if (status === 'recovery') return <SetNewPassword />;
  if (status !== 'owner') return <Login denied={status === 'denied'} />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <div className="adm" data-admin>
        <Gate />
      </div>
    </AuthProvider>
  );
}
