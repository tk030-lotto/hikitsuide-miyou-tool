# コードレビュー報告書：「引き継いでみよう。ツール」

**レビュー実施日**: 2026-08-26
**対象**: 引き継いでみよう。ツール（`hikitsuide-miyou-tool`）全ソース一式
**検証方法**: 全ファイル静的解析 ＋ `node --check` 構文検証 ＋ Git 実機確認
**総指摘件数**: 14件（中程度 5件 ／ 低 9件）
**備考**: F-3 は詳細を `ISSUE_F3_PROTOCOL_REFERENCE.md` に分離

---

## 1. 総合評価

| 観点 | 判定 | 概要 |
| :--- | :---: | :--- |
| 仕様書（20条）適合性 | **PASS** | 完成条件14項目は機能的に充足。§12 のボタン文言に軽微な差異（F-14） |
| 基本品質 | **PASS** | 全 JS 構文チェック合格。モジュール分割適切。全ファイル 300 行未満（第17条遵守） |
| セキュリティ | **PASS（条件付き）** | 現状 exploitable な問題なし。潜在リスク 1件（F-1） |
| 設定・ドキュメント整合性 | **要対応** | `.gitignore` 矛盾（F-2）、ルール参照不備（F-3 → 別ファイル） |
| アクセシビリティ | **要改善** | WAI-ARIA 基礎対応の欠落（F-4） |

先行監査（`AUDIT_REPORT.md`）の記載は本検証結果と一致した（行数は物理行数で正確、Zero-Dependency も JS ライブラリ限界で正確）。監査で見落とされていた項目を以下に指摘する。

---

## 2. 良かった点（維持すべき実装）

1. **XSS に強い出力設計** — プロンプト表示・コピーとも `textContent` 経由（`js/app.js` L196 / L105）。ユーザー入力が HTML 解釈される経路がない。
2. **クリップボードの堅牢化** — Clipboard API ＋ `execCommand` フォールバック（`js/ui.js` L45-67）。
3. **localStorage の防御的アクセス** — try/catch によりプライベートモード等でも動作継続（`js/app.js` L221 / L224-234）。
4. **モジュール分割** — data / util / generator / controller の責務分離。JSDoc コメント一貫。
5. **マイクロコミット履歴** — 第3条どおりの極小コミット単位。

---

## 3. 指摘事項【中】対応推奨

### F-1. showToast の innerHTML へのメッセージ直埋め込み（潜在 XSS 経路）
- **箇所**: `js/ui.js` L25

```js
toast.innerHTML = `${iconSvg}<span>${message}</span>`;
```

現時点の呼び出し元は固定文字列のため発火しないが、将来ユーザー入力を渡すとスクリプト挿入が可能な構造。修正案：

```js
toast.innerHTML = iconSvg;
const span = document.createElement('span');
span.textContent = message;
toast.appendChild(span);
```

### F-2. `.gitignore` の `*.gif` と追跡済み `demo.gif` の矛盾
- **箇所**: `.gitignore` L19 vs `git ls-files`（demo.gif 追跡済み）
- GIF 再生成（削除→再追加）時に `git add` が黙って除外され、**README 画像が壊れたまま push される事故**が起き得る。対策：

```gitignore
*.gif
!demo.gif
```

### F-3. 参照先が存在しないルールファイル
- **本件は詳細を [`ISSUE_F3_PROTOCOL_REFERENCE.md`](ISSUE_F3_PROTOCOL_REFERENCE.md) に分離。**
- 要約: `.clinerules` / `.cursorrules` / `.github/copilot-instructions.md` が参照する `knowledge/protocol.md` がリポジトリ内に存在しない（正本はプロジェクト外の `各種情報` フォルダ）。コード動作への影響はないが、開発プロセス品質の問題として対応推奨。

### F-4. アクセシビリティの基礎欠落
- textarea 4箇所にプログラム紐付けラベルなし（`index.html` L72 / L102 / L135 / L168）→ `aria-labelledby` または `aria-label` 追加
- トーストがスクリーンリーダーに通知されない → L284 のコンテナへ `role="status" aria-live="polite"` 追加
- モードタブに `role="tablist"` / `role="tab"` ＋ `aria-selected` なし、ステップボタンに `aria-current="step"` なし

### F-5. 「完全クライアント完結」表明と Google Fonts 外部依存の不整合
- **箇所**: `index.html` L13-15（fonts.googleapis.com へリクエスト）
- ① 利用者の IP が Google へ送信される（プライバシー）② 外部アクセスしないとする仕様・監査文言との整合、の2点で注意喚起。セルフホスト化またはフォント削除が完全解（システムフォントフォールバックは実装済みのため削除しても表示は維持される）。

---

## 4. 指摘事項【低】改善提案

| ID | 内容 | 箇所 |
| :-- | :--- | :--- |
| F-6 | `mcp_config.json` が UTF-8 **BOM 付き**（EF BB BF 実機確認済み）。厳格パーサでは失敗。BOM 除去推奨 | `.agents/mcp_config.json` |
| F-7 | HTML 内インラインスタイル 4箇所（保守性・将来 CSP 導入の阻害要因） | `index.html` L197 / L236 / L246 / L250 |
| F-8 | 空 catch ブロック（少なくとも `console.warn` 追加推奨） | `js/app.js` L221 / L233 |
| F-9 | チップ追記時の「・」付与不整合（先頭項目のみ無し）＋部分一致による重複判定の誤爆余地 | `js/app.js` L55-63 |
| F-10 | キー入力毎の localStorage 書込（debounce 未実装。現規模では実害なし） | `js/app.js` L97-100 |
| F-11 | `--text-dim` (#71717a) の暗背景上コントラスト約 3.9:1（WCAG AA 4.5:1 未満。ヒント文・プレースホルダーに使用） | `css/base.css` L15 |
| F-12 | Ctrl+Enter ハンドラに IME 変換中ガードなし（`!e.isComposing` 追加推奨）。日本語入力の確定 Enter で意図せずステップ進行／コピーが発火し得る | `js/app.js` L139-147 |
| F-13 | CSP メタタグなし（静的サイトのため低リスク。F-7 解消後に導入可能） | `index.html` |
| F-14 | 仕様書 §12 の操作「もう一度作る」が字面上不在（モード切替＋微調整で機能は代替済み。仕様側更新か実装側追認のいずれかを推奨） | 仕様書 vs `index.html` Step5 |

---

## 5. 実施済み検証結果

| 検証項目 | 結果 |
| :--- | :--- |
| `node --check`（`js/` 配下 4ファイル） | ✅ 全件合格 |
| `git status` | ✅ クリーン（未コミット変更なし） |
| `git remote -v` | ✅ README 記載 URL（tk030-lotto/hikitsuide-miyou-tool）と一致 |
| `git check-ignore demo.gif` | 現在は除外対象外（追跡済みのため）＝ F-2 参照 |
| BOM 検査 | F-6 の通り EF BB BF を確認 |

---

## 6. 次のアクション（承認待ち）

- [ ] 【中】F-1 / F-2 / F-4 / F-5 の修正（F-3 は `ISSUE_F3_PROTOCOL_REFERENCE.md` の対応案に従う）
- [ ] 【低】F-6〜F-14 の修正
- [ ] 修正後のマイクロコミット（第3条）
