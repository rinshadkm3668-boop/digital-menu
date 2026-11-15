import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// status: 'loading' | 'out' | 'owner' | 'denied' | 'recovery'
export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  const evaluate = useCallback(async (session) => {
    if (!session) { setUser(null); setStatus('out'); return; }
    setUser(session.user);
    const { data, error } = await supabase.rpc('is_owner');
    if (error || data !== true) {
      // A valid login that is NOT the registered owner gets no access at all.
      await supabase.auth.signOut();
      setUser(null);
      setStatus('denied');
      return;
    }
    setStatus('owner');
  }, []);

  useEffect(() => {
    // The recovery link signs the user in AND fires PASSWORD_RECOVERY; we must not
    // treat that session as a normal login until a new password has been set.
    const recovering = { current: window.location.hash.includes('type=recovery') };
    supabase.auth.getSession().then(({ data }) => {
      if (!recovering.current) evaluate(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovering.current = true;
        setUser(session?.user ?? null);
        setStatus('recovery');
        return;
      }
      if (event === 'SIGNED_OUT') {
        recovering.current = false;
        setUser(null);
        setStatus((s) => (s === 'denied' ? s : 'out'));
        return;
      }
      if (recovering.current) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // defer to avoid deadlocks inside the auth callback
        setTimeout(() => evaluate(session), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Incorrect email or password.');
  };
  const signOut = async () => { await supabase.auth.signOut(); setStatus('out'); };
  const sendReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`,
    });
    if (error) throw error;
  };
  const setPassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };
  const finishRecovery = async () => {
    // Leave the recovery state (also clears the #type=recovery hash) and re-check ownership.
    window.history.replaceState(null, '', window.location.pathname);
    const { data } = await supabase.auth.getSession();
    await evaluate(data.session);
  };

  return (
    <Ctx.Provider value={{ status, user, signIn, signOut, sendReset, setPassword, finishRecovery, setStatus }}>
      {children}
    </Ctx.Provider>
  );
}
