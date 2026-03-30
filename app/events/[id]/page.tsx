'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Event, Entry } from '@/lib/types';
import { getEvents, getEntries, saveEntry, deleteEntry } from '@/lib/store';
import { supabase } from '@/lib/supabase';

type Genre = 'Breaking' | 'Hip Hop' | 'Locking' | 'Popping' | 'House' | 'Waacking' | 'その他';
const GENRES: Genre[] = ['Breaking', 'Hip Hop', 'Locking', 'Popping', 'House', 'Waacking', 'その他'];

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', genre: '' as Genre, email: '', instagramHandle: '', comment: '' });
  const [submitted, setSubmitted] = useState(false);
  const [confirmedEntry, setConfirmedEntry] = useState<{ name: string; genre: string } | null>(null);
  const [myEntryId, setMyEntryId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const storageKey = `entry_${id}`;

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      setIsAdmin(!!adminEmail && user?.email === adminEmail);
    });
    // localStorage から自分のエントリー ID を復元
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setMyEntryId(saved);
      setSubmitted(true);
    }
    Promise.all([getEvents(), getEntries(id)]).then(([events, fetchedEntries]) => {
      setEvent(events.find((e) => e.id === id) ?? null);
      setEntries(fetchedEntries);
      // localStorage にあっても実際には削除済みの場合はリセット
      if (saved && !fetchedEntries.find((e) => e.id === saved)) {
        localStorage.removeItem(storageKey);
        setMyEntryId(null);
        setSubmitted(false);
      }
    }).finally(() => setLoading(false));
  }, [id, storageKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const entry = await saveEntry({
        eventId: id,
        name: form.name,
        genre: form.genre,
        email: form.email,
        instagramHandle: form.instagramHandle,
        comment: form.comment,
      });
      // localStorage にエントリー ID を保存してキャンセルを可能にする
      localStorage.setItem(storageKey, entry.id);
      setMyEntryId(entry.id);
      setConfirmedEntry({ name: form.name, genre: form.genre });
      setEntries(await getEntries(id));
      setSubmitted(true);
      setShowForm(false);
      setForm({ name: '', genre: '' as Genre, email: '', instagramHandle: '', comment: '' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelEntry() {
    if (!myEntryId) return;
    if (!confirm('エントリーをキャンセルしますか？')) return;
    setCancelling(true);
    try {
      await deleteEntry(myEntryId);
      localStorage.removeItem(storageKey);
      setMyEntryId(null);
      setSubmitted(false);
      setConfirmedEntry(null);
      setEntries(await getEntries(id));
    } catch {
      // 既に削除済みの場合も localStorage をクリアして UI をリセット
      localStorage.removeItem(storageKey);
      setMyEntryId(null);
      setSubmitted(false);
      setConfirmedEntry(null);
      setEntries(await getEntries(id));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">イベントが見つかりません</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('sv-SE');
  const isPast = event.date < today;
  const isFull = entries.length >= event.capacity;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← イベント一覧</Link>
          <h1 className="text-xl font-bold">
            <span className="text-yellow-400">DANCE</span> EVENTS
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
          {event.imageBase64 && (
            <img src={event.imageBase64} alt={event.title} className="w-full max-h-72 object-cover" />
          )}
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {isPast && (
                <span className="bg-gray-700 text-gray-400 text-xs font-bold px-2 py-0.5 rounded">開催済み</span>
              )}
              <span className="bg-yellow-400 text-gray-950 text-xs font-bold px-2 py-0.5 rounded">
                {event.category}
              </span>
              {event.genre.map((g) => (
                <span key={g} className="bg-gray-700 text-gray-200 text-xs px-2 py-0.5 rounded">{g}</span>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-4">{event.title}</h2>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-400 mb-1">日時</p>
                <p className="font-medium">{event.date} {event.time}〜</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">会場</p>
                <p className="font-medium">{event.location}</p>
                <p className="text-gray-400 text-xs">{event.prefecture}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">定員</p>
                <p className="font-medium">{event.capacity}名</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">エントリー数</p>
                <p className={`font-bold text-lg ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                  {entries.length} / {event.capacity}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">主催者</p>
                <p className="font-medium">{event.organizerName}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">連絡先</p>
                <p className="font-medium break-all text-yellow-300">{event.organizerContact}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-6">{event.description}</p>

            <div className="flex gap-3">
              {isPast ? (
                <span className="bg-gray-700 text-gray-400 font-bold px-6 py-2 rounded-lg">開催終了</span>
              ) : !submitted && !isFull ? (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-yellow-400 text-gray-950 font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 transition"
                >
                  {showForm ? 'キャンセル' : 'エントリーする'}
                </button>
              ) : isFull ? (
                <span className="bg-red-900 text-red-300 font-bold px-6 py-2 rounded-lg">定員満了</span>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="bg-green-900 text-green-300 font-bold px-6 py-2 rounded-lg">エントリー済み</span>
                  {myEntryId && (
                    <button
                      onClick={handleCancelEntry}
                      disabled={cancelling}
                      className="text-sm text-red-400 hover:text-red-300 underline disabled:opacity-50"
                    >
                      {cancelling ? 'キャンセル中...' : 'キャンセルする'}
                    </button>
                  )}
                </div>
              )}
              {(currentUserId && event.userId === currentUserId || isAdmin) && (
                <Link
                  href={`/events/${id}/manage`}
                  className={`border text-sm px-4 py-2 rounded-lg transition ${isAdmin && event.userId !== currentUserId ? 'border-yellow-600 text-yellow-400 hover:border-yellow-400' : 'border-gray-600 text-gray-300 hover:border-gray-400'}`}
                >
                  {isAdmin && event.userId !== currentUserId ? '管理者として管理' : '主催者管理'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* エントリー完了確認パネル */}
        {confirmedEntry && (
          <div className="bg-green-900/40 border border-green-600 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-green-400 text-xl mt-0.5">✓</span>
              <div className="flex-1">
                <p className="font-bold text-green-300 mb-1">エントリーが完了しました！</p>
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">{confirmedEntry.name}</span>
                  {' '}さん（{confirmedEntry.genre}）のエントリーを受け付けました。
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  同じデバイス・ブラウザでこのページに戻るとキャンセルができます。
                </p>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-gray-900 border border-yellow-400 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">エントリーフォーム</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">名前 / ダンサー名 *</label>
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                  placeholder="例: B-Boy Taro"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ジャンル *</label>
                <select
                  required
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value as Genre })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                >
                  <option value="">選択してください</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">メールアドレス *</label>
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                  placeholder="you@example.com"
                />
                <p className="text-gray-600 text-xs mt-1">主催者からの連絡に使用します。公開はされません。</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Instagram ID</label>
                <input
                  maxLength={30}
                  pattern="^@?[a-zA-Z0-9][a-zA-Z0-9_.]*$"
                  title="例: @username（英数字・_・.のみ、1〜30文字）"
                  value={form.instagramHandle}
                  onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                  placeholder="@username（任意）"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">コメント</label>
                <textarea
                  maxLength={500}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                  rows={3}
                  placeholder="意気込みなど"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-400 text-gray-950 font-bold py-2 rounded-lg hover:bg-yellow-300 transition disabled:opacity-50"
              >
                {submitting ? '送信中...' : 'エントリーを確定する'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">エントリー一覧（{entries.length}名）</h3>
          {entries.length === 0 ? (
            <p className="text-gray-500 text-sm">まだエントリーがありません</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-4 border-b border-gray-800 pb-3">
                  <span className="text-gray-500 text-sm w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-gray-400 text-xs">{entry.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
