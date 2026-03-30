'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Event } from '@/lib/types';
import { getMyEvents, getEntries } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface EventWithCount extends Event {
  entryCount: number;
}

export default function MyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth?redirectTo=/events/my');
        return;
      }
      const myEvents = await getMyEvents();
      const withCounts = await Promise.all(
        myEvents.map(async (event) => {
          const entries = await getEntries(event.id);
          return { ...event, entryCount: entries.length };
        })
      );
      setEvents(withCounts);
      setLoading(false);
    }
    load();
  }, [router]);

  const today = new Date().toLocaleDateString('sv-SE');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← イベント一覧</Link>
          <h1 className="text-xl font-bold">
            <span className="text-yellow-400">DANCE</span> EVENTS — マイイベント
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">自分のイベント一覧</h2>
          <Link
            href="/events/new"
            className="bg-yellow-400 text-gray-950 text-sm font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition"
          >
            + 新しいイベントを登録
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="mb-4">まだイベントを登録していません</p>
            <Link
              href="/events/new"
              className="bg-yellow-400 text-gray-950 text-sm font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition"
            >
              最初のイベントを登録する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const isPast = event.date < today;
              const isFull = event.entryCount >= event.capacity;
              return (
                <div
                  key={event.id}
                  className={`bg-gray-900 border rounded-xl p-5 ${isPast ? 'border-gray-700 opacity-75' : 'border-gray-800'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {isPast && (
                          <span className="bg-gray-700 text-gray-400 text-xs font-bold px-2 py-0.5 rounded">
                            開催済み
                          </span>
                        )}
                        <span className="bg-yellow-400 text-gray-950 text-xs font-bold px-2 py-0.5 rounded">
                          {event.category}
                        </span>
                        {event.genre.map((g) => (
                          <span key={g} className="bg-gray-700 text-gray-200 text-xs px-2 py-0.5 rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-lg font-bold mb-1 truncate">{event.title}</h3>
                      <p className="text-gray-400 text-sm">{event.date} {event.time}〜 / {event.location}（{event.prefecture}）</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                        {event.entryCount}
                        <span className="text-sm text-gray-500 font-normal"> / {event.capacity}名</span>
                      </p>
                      {isFull && <p className="text-red-400 text-xs mt-0.5">定員満了</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/events/${event.id}/manage`}
                      className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg transition"
                    >
                      管理・エントリー確認
                    </Link>
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg transition"
                    >
                      編集
                    </Link>
                    <Link
                      href={`/events/${event.id}`}
                      className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 transition"
                    >
                      詳細ページを見る
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
