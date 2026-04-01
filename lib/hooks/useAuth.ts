'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthState {
  userId: string | null;
  userEmail: string | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    userEmail: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      setState({
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        isAdmin: !!adminEmail && user?.email === adminEmail,
        loading: false,
      });
    });
  }, []);

  return state;
}
