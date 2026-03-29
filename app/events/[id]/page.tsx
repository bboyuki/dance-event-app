'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Event, Entry } from '@/lib/types';
import { getEvents, getEntries, saveEntry } from '@/lib/store';
import { supabase } from '@/lib/supabase';

type Genre = 'Breaking' | 'Hip Hop' | 'Locking' | 'Popping' | 'House' | 'Waacking' | 'その他';
const GENRES: Genre[] = ['Breaking', 'Hip Hop', 'Locking', 'Popping', 'House', 'Waacking', 'その他'];

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', genre: '' as Genre, instagramHandle: '', comment: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
    Promise.all([getEvents(), getEntries(id)]).then(([events, entries]) => {
      setEvent(events.find((e) => e.id === id) ?? null);
      setEntries(entries);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveEntry({
        eventId: id,
        name: form.name,
        genre: form.genre,
        instagramHandle: form.instagramHandle,
        comment: form.comment,
      });
      setEntries(await getEntries(id));
      setSubmitted(true);
      setShowForm(false);
      setForm({ name: '', genre: '' as Genre, instagramHandle: '', comment: '' });
    } finally {
      setSubmitting(false);
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
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-6">{event.description}</p>

            <div className="flex gap-3">
              {!submitted && !isFull ? (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-yellow-400 text-gray-950 font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 transition"
                >
                  {showForm ? 'キャンセル' : 'エントリーする'}
                </button>
              ) : isFull ? (
                <span className="bg-red-900 text-red-300 font-bold px-6 py-2 rounded-lg">定員満了</span>
              ) : (
                <span className="bg-green-900 text-green-300 font-bold px-6 py-2 rounded-lg">エントリー済み</span>
              )}
              {currentUserId && event.userId === currentUserId && (
                <Link
                  href={`/events/${id}/manage`}
                  className="border border-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg hover:border-gray-400 transition"
                >
                  主催者管理
                </Link>
              )}
            </div>
          </div>
        </div>

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
                <label className="block text-sm text-gray-400 mb-1">Instagram ID</label>
                <input
                  maxLength={30}
                  pattern="^@?[a-zA-Z0-9][a-zA-Z0-9_.]*$"
                  title="例: @username（英数字・_・.のみ、1〜30文字）"
                  value={form.instagramHandle}
                  onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                  placeholder="@username"
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
                    <p className="text-gray-400 text-xs">{entry.genre}{entry.instagramHandle && ` · ${entry.instagramHandle}`}</p>
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
