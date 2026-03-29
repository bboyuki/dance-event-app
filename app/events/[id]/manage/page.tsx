'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { Event, Entry } from '@/lib/types';
import { getEvents, getEntries, deleteEntry, deleteEvent } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function ManagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/auth?redirectTo=/events/${id}/manage`);
        return;
      }
      const [events, fetchedEntries] = await Promise.all([getEvents(), getEntries(id)]);
      const foundEvent = events.find((e) => e.id === id) ?? null;

      // オーナーチェック: userId が null のレガシーイベントも含め、不一致は全て拒否
      if (!foundEvent?.userId || foundEvent.userId !== user.id) {
        setAuthError('このイベントの管理権限がありません。');
        setLoading(false);
        return;
      }

      setEvent(foundEvent);
      setEntries(fetchedEntries);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('このエントリーを削除しますか？')) return;
    await deleteEntry(entryId);
    setEntries(await getEntries(id));
  }

  async function handleDeleteEvent() {
    if (!confirm(`「${event?.title}」を削除しますか？\nこの操作は取り消せません。エントリーも全て削除されます。`)) return;
    await deleteEvent(id);
    router.replace('/');
  }

  function sanitizeCsvCell(value: string | number): string {
    const str = String(value ?? '');
    // Excel数式インジェクション対策: =, +, -, @ で始まる値はシングルクォートでエスケープ
    if (/^[=+\-@\t\r]/.test(str)) {
      return `'${str.replace(/"/g, '""')}`;
    }
    return str.replace(/"/g, '""');
  }

  function handleExportCSV() {
    const header = ['No', '名前', 'ジャンル', 'Instagram', 'コメント', 'エントリー日時'];
    const rows = entries.map((e, i) => [
      i + 1,
      e.name,
      e.genre,
      e.instagramHandle,
      e.comment,
      new Date(e.createdAt).toLocaleString('ja-JP'),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${sanitizeCsvCell(v)}"`).join(','))
      .join('\n');
    const safeTitle = (event?.title ?? 'entries').replace(/[\\/:*?"<>|]/g, '_');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}_エントリー一覧.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-medium">{authError}</p>
        <Link href={`/events/${id}`} className="text-gray-400 text-sm hover:text-white underline">
          ← イベント詳細に戻る
        </Link>
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

  const genreCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.genre] = (acc[e.genre] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href={`/events/${id}`} className="text-gray-400 hover:text-white text-sm">
            ← イベント詳細
          </Link>
          <h1 className="text-xl font-bold">
            <span className="text-yellow-400">DANCE</span> EVENTS — 主催者管理
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{event.title}</h2>
            <p className="text-gray-400 text-sm mt-1">{event.date} {event.time}〜 / {event.location}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link
              href={`/events/${id}/edit`}
              className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg transition"
            >
              イベントを編集
            </Link>
            <button
              onClick={handleExportCSV}
              className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg transition"
            >
              CSVダウンロード
            </button>
            <button
              onClick={handleDeleteEvent}
              className="bg-red-900 hover:bg-red-800 text-red-300 text-sm px-4 py-2 rounded-lg transition"
            >
              イベントを削除
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs mb-1">エントリー数</p>
            <p className="text-3xl font-bold text-yellow-400">{entries.length}</p>
            <p className="text-gray-500 text-xs">/ {event.capacity}名</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs mb-1">残り枠</p>
            <p className={`text-3xl font-bold ${event.capacity - entries.length <= 5 ? 'text-red-400' : 'text-green-400'}`}>
              {event.capacity - entries.length}
            </p>
            <p className="text-gray-500 text-xs">名</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center col-span-2">
            <p className="text-gray-400 text-xs mb-2">ジャンル内訳</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {Object.entries(genreCounts).map(([g, count]) => (
                <span key={g} className="bg-gray-700 text-xs px-2 py-0.5 rounded">
                  {g}: {count}名
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-gray-400 text-left">
                <th className="px-4 py-3 w-10">No</th>
                <th className="px-4 py-3">名前</th>
                <th className="px-4 py-3">ジャンル</th>
                <th className="px-4 py-3">Instagram</th>
                <th className="px-4 py-3">エントリー日時</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-12">
                    まだエントリーがありません
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{entry.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-700 text-xs px-2 py-0.5 rounded">{entry.genre}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{entry.instagramHandle || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(entry.createdAt).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-500 hover:text-red-400 text-xs"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
