'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Genre, EventCategory } from '@/lib/types';
import { saveEvent } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const GENRES: Genre[] = ['Breaking', 'Hip Hop', 'Locking', 'Popping', 'House', 'Waacking', 'その他'];
const CATEGORIES: EventCategory[] = ['バトル', 'コンテスト', 'ワークショップ', 'その他'];
const PREFECTURES = [
  '北海道','青森','岩手','宮城','秋田','山形','福島',
  '茨城','栃木','群馬','埼玉','千葉','東京','神奈川',
  '新潟','富山','石川','福井','山梨','長野','岐阜',
  '静岡','愛知','三重','滋賀','京都','大阪','兵庫',
  '奈良','和歌山','鳥取','島根','岡山','広島','山口',
  '徳島','香川','愛媛','高知','福岡','佐賀','長崎',
  '熊本','大分','宮崎','鹿児島','沖縄',
];

export default function NewEvent() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth?redirectTo=/events/new');
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    prefecture: '',
    genre: [] as Genre[],
    category: '' as EventCategory,
    description: '',
    capacity: '',
    organizerName: '',
    organizerContact: '',
  });
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">確認中...</p>
      </div>
    );
  }

  const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > IMAGE_MAX_BYTES) {
      alert('画像は5MB以下にしてください');
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください（JPG / PNG / WEBP）');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleGenre(g: Genre) {
    setForm((prev) => ({
      ...prev,
      genre: prev.genre.includes(g) ? prev.genre.filter((x) => x !== g) : [...prev.genre, g],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const event = await saveEvent({
        title: form.title,
        date: form.date,
        time: form.time,
        location: form.location,
        prefecture: form.prefecture,
        genre: form.genre,
        category: form.category,
        description: form.description,
        capacity: parseInt(form.capacity, 10),
        organizerName: form.organizerName,
        organizerContact: form.organizerContact,
        imageBase64: imageBase64 ?? undefined,
      });
      router.push(`/events/${event.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← イベント一覧</Link>
          <h1 className="text-xl font-bold">
            <span className="text-yellow-400">DANCE</span> EVENTS
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">イベントを登録する</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">イベント名 *</label>
            <input
              required
              maxLength={100}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
              placeholder="例: TOKYO CYPHER 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">開催日 *</label>
              <input
                required
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">開始時間 *</label>
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">都道府県 *</label>
              <select
                required
                value={form.prefecture}
                onChange={(e) => setForm({ ...form, prefecture: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
              >
                <option value="">選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">会場名 *</label>
              <input
                required
                maxLength={100}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
                placeholder="例: 渋谷 WWW"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">カテゴリー *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, category: c })}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    form.category === c
                      ? 'bg-yellow-400 text-gray-950'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">ジャンル（複数選択可）*</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    form.genre.includes(g)
                      ? 'bg-yellow-400 text-gray-950'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">定員（人数）*</label>
            <input
              required
              type="number"
              min="1"
              max="10000"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
              placeholder="例: 32"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">イベント画像</label>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-yellow-400 transition overflow-hidden">
              {imageBase64 ? (
                <img src={imageBase64} alt="プレビュー" className="w-full max-h-64 object-cover" />
              ) : (
                <div className="py-10 text-center">
                  <p className="text-gray-400 text-sm">クリックして画像を選択</p>
                  <p className="text-gray-600 text-xs mt-1">JPG / PNG / WEBP</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {imageBase64 && (
              <button
                type="button"
                onClick={() => setImageBase64(null)}
                className="mt-2 text-xs text-red-400 hover:text-red-300"
              >
                画像を削除
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">イベント説明</label>
            <textarea
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
              rows={4}
              placeholder="イベントの詳細や注意事項など"
            />
            <p className="text-xs text-gray-600 mt-1 text-right">{form.description.length} / 2000</p>
          </div>

          <div className="border-t border-gray-800 pt-5">
            <p className="text-sm font-bold text-gray-300 mb-3">主催者情報</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">主催者名 *</label>
                <input
                  required
                  maxLength={100}
                  value={form.organizerName}
                  onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
                  placeholder="例: TOKYO CREW"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">連絡先（メール or Instagram）*</label>
                <input
                  required
                  maxLength={200}
                  value={form.organizerContact}
                  onChange={(e) => setForm({ ...form, organizerContact: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
                  placeholder="例: event@example.com"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={form.genre.length === 0 || !form.category || submitting}
            className="w-full bg-yellow-400 text-gray-950 font-bold py-3 rounded-xl hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '登録中...' : 'イベントを登録する'}
          </button>
        </form>
      </main>
    </div>
  );
}
