'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Event } from '@/lib/types';
import { getEvents } from '@/lib/store';
import { useAuth } from '@/lib/hooks/useAuth';
import { GENRES, CATEGORIES, getToday } from '@/lib/constants';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ prefecture: '', genre: '', category: '', period: '' });
  const { userId: currentUserId } = useAuth();

  useEffect(() => {
    getEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  const today = getToday();
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE');
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toLocaleDateString('sv-SE');

  const filtered = events.filter((e) => {
    if (filter.prefecture && e.prefecture !== filter.prefecture) return false;
    if (filter.genre && !e.genre.includes(filter.genre as never)) return false;
    if (filter.category && e.category !== filter.category) return false;
    if (filter.period === 'week' && !(e.date >= today && e.date <= weekLater)) return false;
    if (filter.period === 'month' && !(e.date >= today && e.date <= monthEnd)) return false;
    if (filter.period === 'future' && e.date < today) return false;
    return true;
  });

  const prefectures = [...new Set(events.map((e) => e.prefecture))];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-yellow-400">DANCE</span> EVENTS
          </h1>
          <div className="flex items-center gap-3">
            {currentUserId && (
              <Link
                href="/events/my"
                className="text-sm text-gray-300 hover:text-white transition"
              >
                マイイベント
              </Link>
            )}
            <Link
              href="/events/new"
              className="bg-yellow-400 text-gray-950 text-sm font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition"
            >
              + イベントを登録
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-3 mb-8">
          {/* 期間クイックフィルター */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'すべての期間' },
              { value: 'week', label: '今週' },
              { value: 'month', label: '今月' },
              { value: 'future', label: '今日以降' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter({ ...filter, period: value })}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  filter.period === value
                    ? 'bg-yellow-400 text-gray-950 font-bold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* 属性フィルター */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filter.prefecture}
              onChange={(e) => setFilter({ ...filter, prefecture: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">都道府県：すべて</option>
              {prefectures.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={filter.genre}
              onChange={(e) => setFilter({ ...filter, genre: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">ジャンル：すべて</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">カテゴリー：すべて</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {(filter.prefecture || filter.genre || filter.category || filter.period) && (
              <button
                onClick={() => setFilter({ prefecture: '', genre: '', category: '', period: '' })}
                className="text-sm text-gray-400 hover:text-white underline"
              >
                すべてクリア
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-20">読み込み中...</div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4">{filtered.length}件のイベント</p>
            <div className="grid gap-4">
              {filtered.length === 0 ? (
                <div className="text-center text-gray-500 py-20">
                  イベントが見つかりませんでした
                </div>
              ) : (
                filtered.map((event) => {
                  const isPast = event.date < today;
                  return (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className={`bg-gray-900 border rounded-xl overflow-hidden hover:border-yellow-400 transition cursor-pointer ${isPast ? 'border-gray-700 opacity-70' : 'border-gray-800'}`}>
                        {event.imageBase64 && (
                          <img src={event.imageBase64} alt={event.title} className="w-full h-40 object-cover" />
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
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
                              <h2 className="text-lg font-bold mb-1">{event.title}</h2>
                              <p className="text-gray-400 text-sm">{event.description}</p>
                            </div>
                            <div className="text-right text-sm shrink-0">
                              <p className={isPast ? 'text-gray-500 font-bold' : 'text-yellow-400 font-bold'}>{event.date}</p>
                              <p className="text-gray-400">{event.time}〜</p>
                              <p className="text-gray-300 mt-1">{event.prefecture}</p>
                              <p className="text-gray-400 text-xs">{event.location}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
