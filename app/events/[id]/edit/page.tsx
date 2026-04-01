'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { EventCategory } from '@/lib/types';
import { getEvents, getEntries, updateEvent } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { GENRES, CATEGORIES, PREFECTURES } from '@/lib/constants';

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentEntryCount, setCurrentEntryCount] = useState(0);
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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/auth?redirectTo=/events/${id}/edit`);
        return;
      }
      const [events, entries] = await Promise.all([getEvents(), getEntries(id)]);
      setCurrentEntryCount(entries.length);
      const event = events.find((e) => e.id === id);
      if (!event) {
        setAuthError('イベントが見つかりません。');
        setLoading(false);
        return;
      }
      if (!event.userId || event.userId !== user.id) {
        setAuthError('このイベントを編集する権限がありません。');
        setLoading(false);
        return;
      }
      setForm({
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        prefecture: event.prefecture,
        genre: event.genre,
        category: event.category,
        description: event.description,
        capacity: String(event.capacity),
        organizerName: event.organizerName,
        organizerContact: event.organizerContact,
      });
      setImageBase64(event.imageBase64 ?? null);
      setLoading(false);
    }
    load();
  }, [id, router]);

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
      await updateEvent(id, {
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
      router.push(`/events/${id}`);
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={`/events/${id}/manage`} className="text-gray-400 hover:text-white text-sm">← 管理画面</Link>
          <h1 className="text-xl font-bold">
            <span className="text-yellow-400">DANCE</span> EVENTS
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">イベントを編集する</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">イベント名 *</label>
            <input
              required
              maxLength={100}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">開催日 *</label>
              <input
                required
                type="date"
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
              min={currentEntryCount > 0 ? currentEntryCount : 1}
              max="10000"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400"
            />
            {currentEntryCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                現在のエントリー数: {currentEntryCount}名（定員はこれ以上に設定してください）
              </p>
            )}
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
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={form.genre.length === 0 || !form.category || submitting}
            className="w-full bg-yellow-400 text-gray-950 font-bold py-3 rounded-xl hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '保存中...' : '変更を保存する'}
          </button>
        </form>
      </main>
    </div>
  );
}
