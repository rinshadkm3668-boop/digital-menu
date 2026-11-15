import React from 'react';

export default function SetupNotice() {
  return (
    <div className="setup-notice">
      <img src="/logo.png" alt="Right Choice" />
      <h1>Almost there</h1>
      <p>
        The database is not connected yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
        <code>VITE_SUPABASE_ANON_KEY</code> as environment variables, then rebuild.
        See <strong>README.md</strong> for the step-by-step guide.
      </p>
    </div>
  );
}
