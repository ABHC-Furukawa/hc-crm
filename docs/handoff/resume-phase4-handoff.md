# 履歴書機能 — Phase 4 引き継ぎ（仕上げ・テスト）

**状態:** Phase 1〜4 完了 / Phase 5（将来拡張）は未着手

## Phase 4 で追加した内容

- PDF 2ページ構成（1ページ目: 基本・学歴職歴 / 2ページ目: 自己PR・志望動機 + `wrap`）
- ステータス操作 UI（完成にする / 下書きに戻す）
- PDF 出力履歴テーブル（プレビュー画面、直近 20 件）
- 検証スクリプト
  - `npm run verify:resume-access`
  - `npm run verify:resume-pdf`

## 手動テストチェックリスト

### 作成・編集

- [ ] サイドバー「履歴書作成」→ 新規作成（候補者なし）
- [ ] 候補者詳細「履歴書」タブ → 作成（自動反映）
- [ ] 編集画面で学歴・職歴・資格の行追加・削除
- [ ] 保存後にリロードして値が保持される
- [ ] 候補者紐づけ時「候補者から再反映」が動作する

### PDF

- [ ] プレビュー画面で PDF iframe 表示
- [ ] PDF ダウンロード（ファイル名・日本語表示）
- [ ] 空データでも PDF が生成される
- [ ] 長い自己PR・志望動機で 2 ページ目に折り返される
- [ ] 出力履歴に記録される

### 権限（ロール別）

- [ ] ADMIN: テナント内の履歴書一覧が見える
- [ ] ADVISOR: 担当候補者の履歴書のみ見える
- [ ] ADVISOR: 自分が作ったスタンドアロン履歴書のみ見える
- [ ] 他テナント / 他担当の履歴書 URL 直打ちで 403 または not found

### ステータス

- [ ] 「完成にする」で READY になる
- [ ] 「下書きに戻す」で DRAFT に戻る
- [ ] アクティビティに RESUME_UPDATED が記録される

### 証明写真（任意）

- [ ] `resume-photos` バケット作成済み
- [ ] 写真アップロード → プレビュー・PDF に反映

## 自動検証

```bash
npm run verify:resume-access
npm run verify:resume-pdf
npm run build
```

## Phase 5（将来拡張・未実装）

- 職務経歴書（`SHOKUMUKEIREKISHO`）
- AI 自己PR / 志望動機生成
- OCR 読取
- 証明写真背景加工
- 複数テンプレート切替
- PDF の Storage キャッシュ（`RESUME_EXPORTS_BUCKET`）

## 関連ファイル

| 領域 | パス |
|------|------|
| PDF テンプレート | `lib/resumes/pdf/templates/jis-standard-a4.tsx` |
| PDF API | `app/api/resumes/[id]/pdf/route.ts` |
| Actions | `lib/actions/resumes.ts` |
| アクセス | `lib/resumes/access.ts`, `lib/resumes/queries.ts` |
