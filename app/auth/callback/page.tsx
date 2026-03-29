'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function getSafeRedirectTo(raw: string | null): string {
  if (!raw) return '/';
  try {
    const parsed = new URL(raw, window.location.origin);
    // 同一オリジンのみ許可
    if (parsed.origin !== window.location.origin) return '/';
    return parsed.pathname + parsed.search;
  } catch {
    return '/';
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let redirected = false;

    function doRedirect() {
      if (redirected) return;
      redirected = true;
      const redirectTo = getSafeRedirectTo(searchParams.get('redirectTo'));
      router.replace(redirectTo);
    }

    // supabase-js (implicit flow) が URL ハッシュからセッションを自動取得する
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') doRedirect();
    });

    // すでにセッションがある場合もリダイレクト
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) doRedirect();
    });

    return () => subscription.unsubscribe();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 text-sm">ログイン処理中...</div>
      </div>
    </div>
  );
}
