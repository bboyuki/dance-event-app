'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function getSafeRedirectTo(raw: string | null): string {
  if (!raw) return '/';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}

function AuthForm() {
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectTo(searchParams.get('redirectTo'));
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });
    setLoading(false);
    if (error) {
      setError('メールの送信に失敗しました。もう一度お試しください。');
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-2">メールを送信しました</h2>
          <p className="text-gray-400 text-sm">
            <span className="text-white font-medium">{email}</span> にログインリンクを送りました。
            メールを確認してリンクをクリックしてください。
          </p>
          <p className="text-gray-600 text-xs mt-4">
            メールが届かない場合は迷惑メールフォルダをご確認ください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-yellow-400">DANCE</span> EVENTS
          </h1>
          <p className="text-gray-400 text-sm">イベントを登録するにはログインが必要です</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">メールでログイン</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">メールアドレス</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-gray-950 font-bold py-3 rounded-xl hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : 'ログインリンクを送信'}
            </button>
          </form>
          <p className="text-gray-500 text-xs mt-4 text-center">
            パスワード不要。メールに届くリンクをクリックするだけです。
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-gray-500 text-sm hover:text-gray-300">
            ← イベント一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
