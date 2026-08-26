# 問題報告書 F-3：参照先が存在しないルールファイル

**発見日**: 2026-08-26
**重要度**: 中（コード動作への影響なし／開発プロセス品質の問題）
**発生源**: コードレビュー（`CODE_REVIEW_REPORT.md`）
**ステータス**: ✅ 対応済み（2026-08-26）

---

## 対応結果

**採用案**: A（同梱・vendoring）を全プロジェクト横断対応として実施

**実施内容**:
- `C:\Users\tk030\Desktop\各種情報\sync_rules.ps1` に `knowledge/` フォルダ同期処理を追加。
- 今後は `sync_rules.ps1` 実行により、Desktop 配下の全プロジェクトに `knowledge/*.md` が自動配置される。
- 本プロジェクトへの即時適用済み（`knowledge/protocol.md` 他 全 `.md` ファイルを配置確認）。

**配置状況（本プロジェクト）**:
| ファイル | 状態 |
| :--- | :--- |
| `knowledge/protocol.md` | ✅ 配置済み |
| `knowledge/ai-development.md` | ✅ 配置済み |
| `knowledge/lottery.md` | ✅ 配置済み |
| `knowledge/business.md` | ✅ 配置済み |
| `knowledge/quality-audit.md` | ✅ 配置済み |
| `knowledge/SKILLS.md` | ✅ 配置済み |

**`.gitignore` の扱い**: `knowledge/` はプロトコル正本の個人情報的内容を含むため `.gitignore` へ除外指定済み（ローカルのみ保持・`sync_rules.ps1` が都度同期）。

---


## 1. 現象

以下のルールポインタファイルが、プロジェクトルート相対で `knowledge/protocol.md` を参照しているが、リポジトリ内に `knowledge/` フォルダ自体が存在しない。

| ファイル | 参照内容 |
| :--- | :--- |
| `.clinerules` | `SKILLS.md` および `knowledge/protocol.md` を読み込むよう指示 |
| `.cursorrules` | 同上（`.clinerules` と同一内容・383 bytes） |
| `.github/copilot-instructions.md` | 同上（`.clinerules` と同一内容・383 bytes） |

さらに `SKILLS.md`（ドメイン知識ルータ）が参照する以下もすべてリポジトリ内に存在しない。

- `knowledge/lottery.md`
- `knowledge/ai-development.md`
- `knowledge/business.md`

## 2. 正本の所在

`.agents/AGENTS.md`（L4 / L44-46）によれば、プロトコルのソース正本はプロジェクト外の下記に存在する。

- `C:\Users\tk030\Desktop\各種情報\knowledge\protocol.md`
- `C:\Users\tk030\Desktop\各種情報\SKILLS.md`

つまり本プロジェクトでは「正本は外部・ポインタのみ同梱」という構成になっており、ポインタが指す相対パスと実体の所在が乖離している。

## 3. 影響

1. 本リポジトリ単体で clone した AI エージェント（Cline / Claude / Cursor / Copilot 等）は規約本文を読めず、「必ず読み込み厳守せよ」という指示のみが残る。結果として規約遵守が不能になり、エージェント間で動作品質が不一致になる。
2. GitHub Pages 公開後も規約ファイルは配信されず、clone 前提の運用との整合が取れない。
3. プロトコル第11条（アライメント監査）の観点でも、ルールと実際の乖離の温床となり得る。

## 4. 証跡

- `git ls-files`: `knowledge/` 配下のエントリなし
- プロジェクト内ファイル一覧: `knowledge/` フォルダ不存在
- `.clinerules` / `.cursorrules` / `.github/copilot-instructions.md` 本文（3ファイルとも同一文言）

## 5. 対応案

| 案 | 内容 | 評価 |
| :-- | :--- | :--- |
| **A. 同梱（vendoring）** | `knowledge/protocol.md` をリポジトリ内に配置し、`sync_rules.ps1` の同期対象に追加して正本からの自動反映を担保 | **推奨**。エージェントが確実に読める状態になり、二重管理も同期自動化で解消できる |
| B. 参照パス修正 | 各ポインタファイルに正本の絶対パス（`C:\Users\...\各種情報\...`）を明記 | 最小工数だが、他環境・他メンバー・clone 先での移植性がゼロ |
| C. 注記のみ | README 等に「規約は別管理」旨を明記 | 応急措置。「読め」という指示と実態の乖離が残る |

## 6. 関連事項

- 本件はコードの実行動作に影響しないため、GitHub Pages 公開判断を保留する性質のものではない。
- 対応（A案など）を実施する場合は、マイクロコミット（第3条）として独立コミットにすることが望ましい。
