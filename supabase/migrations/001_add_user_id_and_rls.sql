-- ============================================================
-- Migration 001: user_id カラム追加 & Row Level Security 設定
-- ============================================================
-- 適用手順:
--   Supabase ダッシュボード > SQL Editor に貼り付けて実行
-- ============================================================

-- ------------------------------------------------------------
-- 1. events テーブルに user_id カラムを追加
-- ------------------------------------------------------------
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 検索パフォーマンス向上のためインデックスを作成
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- ------------------------------------------------------------
-- 2. RLS を有効化
-- ------------------------------------------------------------
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. events テーブルの RLS ポリシー（冪等: 既存ポリシーは削除してから再作成）
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "events: anyone can read" ON events;
DROP POLICY IF EXISTS "events: authenticated users can insert" ON events;
DROP POLICY IF EXISTS "events: owner can update" ON events;
DROP POLICY IF EXISTS "events: owner can delete" ON events;

-- 全ユーザーがイベントを閲覧できる（パブリック）
CREATE POLICY "events: anyone can read"
  ON events FOR SELECT
  USING (true);

-- 認証済みユーザーのみイベントを作成できる
CREATE POLICY "events: authenticated users can insert"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- オーナーのみ自分のイベントを更新できる
CREATE POLICY "events: owner can update"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- オーナーのみ自分のイベントを削除できる
CREATE POLICY "events: owner can delete"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. entries テーブルの RLS ポリシー（冪等: 既存ポリシーは削除してから再作成）
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "entries: anyone can read" ON entries;
DROP POLICY IF EXISTS "entries: anyone can insert" ON entries;
DROP POLICY IF EXISTS "entries: event owner can delete" ON entries;

-- 全ユーザーがエントリー一覧を閲覧できる（パブリック）
CREATE POLICY "entries: anyone can read"
  ON entries FOR SELECT
  USING (true);

-- 誰でも（未認証でも）エントリーを作成できる
-- （イベント参加者はログイン不要）
CREATE POLICY "entries: anyone can insert"
  ON entries FOR INSERT
  WITH CHECK (true);

-- エントリーの削除はイベントオーナーのみ
-- （自分が作成したイベントのエントリーを削除できる）
CREATE POLICY "entries: event owner can delete"
  ON entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = entries.event_id
        AND events.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5. 既存イベント（user_id = NULL）の取り扱い
-- ------------------------------------------------------------
-- NOTE: user_id が NULL の既存イベントは、現在の RLS ポリシーでは
--       誰もオーナーとして更新・削除できない状態になります。
--       移行が必要な場合は以下のコメントを参考に対応してください:
--
-- 例: 管理者として特定ユーザーに既存イベントを割り当てる
-- UPDATE events
--   SET user_id = '<your-user-uuid>'
--   WHERE user_id IS NULL;
--
-- または: レガシーイベント専用の管理者ポリシーを追加する
-- CREATE POLICY "events: service role can manage all"
--   ON events FOR ALL
--   TO service_role
--   USING (true);

-- ------------------------------------------------------------
-- 6. entries テーブルに event_id の外部キー制約を確認
-- ------------------------------------------------------------
-- 既に外部キーがある場合はスキップされます
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'entries_event_id_fkey'
      AND table_name = 'entries'
  ) THEN
    ALTER TABLE entries
      ADD CONSTRAINT entries_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;
