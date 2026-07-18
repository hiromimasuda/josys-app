# PACKET_VALIDATION.md — Gate 0 入力パケット検証報告

- Packet: `JOSYS-OPS-NAV-FABLE5-INPUT-001` v1.0.0（asOf 2026-07-17）
- Master: `JOSYS-OPS-NAV-FABLE5-001` v1.0.1（`02_MASTER_SPEC.snapshot.md`）
- Seed: `JOSYS-OPS-NAV-SEED-001` v1.0.0
- 検証日: 2026-07-18（Asia/Tokyo）
- 検証者: Claude Code セッション（model: claude-fable-5）。技術検証のみであり、人の受領・承認を代替しない。
- **総合判定: `PASS`**（チェック43件 / 失敗0件 / blocker 0件）

## 1. 検証方法と環境（重要な代替実行の記録）

| 項目 | 内容 |
|---|---|
| 実行環境 | Linux リモートコンテナ（Claude Code on the web）。作業ディレクトリ `50_OpsNavigator実装/` |
| 規定の検証手順 | `pwsh -File docs/input/08_VERIFY_PACKET.ps1` |
| 実際の実行 | **pwsh（PowerShell）が本環境に存在しないため、`08_VERIFY_PACKET.ps1` そのものは実行できていない。** グローバルinstall禁止・Gate 0でのpackage install禁止に従い、PowerShellの導入は行わなかった |
| 代替手段 | `08_VERIFY_PACKET.ps1` の全チェックをPython 3標準ライブラリのみで同等再実装した `tools/verify_packet.py` を作成・実行（読み取り専用、`docs/input/` への書き込みなし） |
| 代替の同等性 | SHA-256照合、JSON parse、manifest契約チェック、11/43/15件数、ID一意性、参照整合、優先度null維持、PROPOSED維持、email/URL/secretパターン検査をps1と同一ロジックで実施。加えてps1にない追加チェック（後述）を実施 |
| Schema検証 | `jsonschema` パッケージも未導入のため、`05_SEED_SCHEMA.json` の構造制約（required / additionalProperties / pattern / enum / const / minItems / maxItems / uniqueItems）を全コレクションについて手動実装で検証 |
| 再現コマンド | `python3 tools/verify_packet.py`（exit 0 = PASS） |

> Windows環境（README.md記載の本来の実行環境）では、受領者が `08_VERIFY_PACKET.ps1` を直接実行して同一結果になることを確認できる。

## 2. SHA-256検証結果 — 全件一致

`07_SHA256SUMS.txt`（自己除外設計）記載の10ファイルすべてが一致。

| ファイル | 判定 |
|---|---|
| 00_READ_ME_FIRST.md | OK |
| 01_MANIFEST.json | OK |
| 02_MASTER_SPEC.snapshot.md | OK |
| 03A_GATE0_START_PROMPT.txt | OK |
| 03B_GATE1_CONTINUE_PROMPT.txt | OK |
| 03C_GATE2_CONTINUE_PROMPT.txt | OK |
| 04_SEED_BUNDLE.json | OK |
| 05_SEED_SCHEMA.json | OK |
| 06_GATE_ACCEPTANCE_CHECKLIST.md | OK |
| 08_VERIFY_PACKET.ps1 | OK |

## 3. JSON / Schema構造検証結果

- `01_MANIFEST.json` parse: **OK**
- `04_SEED_BUNDLE.json` parse: **OK**
- `05_SEED_SCHEMA.json` parse: **OK**
- `05_SEED_SCHEMA.json` 構造制約による `04_SEED_BUNDLE.json` 検証: **PASS**（全14コレクション、違反0）
- Manifest契約: `maximumAuthorizedGate = G2` **OK** / production 3フラグすべてfalse **OK** / 必須入力11ファイルすべて存在 **OK**

## 4. 件数検証

| 対象 | 期待 | 実測 | 判定 |
|---|---:|---:|---|
| flows | 11 | 11 | OK |
| operations | 43 | 43 | OK |
| eventTemplates | 15 | 15 | OK |
| roles | 8 | 8 | OK |
| acceptanceCriteria（仕様§17.1 + チェックリスト） | 24 | 24 | OK（AC-001〜AC-024を目視確認） |

追加検証（ps1にない独自チェック）: 各flowの `expectedOperationCount` と実際の業務分布が一致（F01=3, F02=6, F03=2, F04=3, F05=3, F06=4, F07=6, F08=5, F09=3, F10=7, F11=1、計43）。

## 5. ID重複・参照整合

- ID重複: **0件**（全14コレクション）
- 参照切れ: **0件**
  - operation → flow: 43/43 有効
  - eventTemplate → operation: 全55参照有効
  - mockUser → role / demoCase → event・operation・user / knowledgeDocument → sourceAsset / approval → case・user: すべて有効
  - 追加検証: scheduleOccurrence → operation、evidence → case、exception → case・user、aiMockResponse → sourceAsset もすべて有効

## 6. PII / secret検査結果

- メールアドレス: 全件 `@example.invalid` — **合格**
- https URL: 全件 `example.invalid` ドメイン — **合格**
- 資格情報パターン（AWS/GCP/Slack/GitHubトークン、秘密鍵ヘッダ）: **検出0件**
- 実在人名・実在社員ID: mockUserは全件 `DEMO_` 接頭辞・`synthetic: true` — **合格**
- 特記: `KD-DEMO-006` に「Ignore previous instructions...」というprompt injection文字列が**意図的に**含まれる。これはAC-016（取得文書内の命令をデータとして扱う）検証用fixtureであり、`trustedInstructions: false` が明示されている。本検証および今後の実装で命令として扱わない。

## 7. 入力ファイル一覧と版

| ファイル | 役割（manifest） | サイズ |
|---|---|---:|
| 00_READ_ME_FIRST.md | HUMAN_HANDOFF_GUIDE | 4,270 B |
| 01_MANIFEST.json | CONTROL_MANIFEST（packet v1.0.0） | 7,047 B |
| 02_MASTER_SPEC.snapshot.md | REQUIREMENTS_MASTER_SNAPSHOT（master v1.0.1） | 72,078 B |
| 03A_GATE0_START_PROMPT.txt | GATE_0_ENTRYPOINT | 2,774 B |
| 03B_GATE1_CONTINUE_PROMPT.txt | GATE_1_AUTHORIZATION（未使用・Gate 0承認後のみ） | 1,928 B |
| 03C_GATE2_CONTINUE_PROMPT.txt | GATE_2_AUTHORIZATION（未使用・Gate 1受領後のみ） | 2,214 B |
| 04_SEED_BUNDLE.json | SANITIZED_CANONICAL_FIXTURE（seed v1.0.0） | 23,279 B |
| 05_SEED_SCHEMA.json | FIXTURE_SCHEMA | 13,284 B |
| 06_GATE_ACCEPTANCE_CHECKLIST.md | HUMAN_ACCEPTANCE_CONTROL | 3,621 B |
| 07_SHA256SUMS.txt | DETACHED_INTEGRITY（自己除外） | 1,006 B |
| 08_VERIFY_PACKET.ps1 | READ_ONLY_PREFLIGHT_VALIDATOR | 8,300 B |

`docs/input/` への変更: **0件**（読み取りのみ。編集・整形・移動・削除なし）。

## 8. 事実区分の分離確認

| 区分 | 内容 | 状態 |
|---|---|---|
| CONFIRMED | 11フロー名、43業務名とフロー対応、15入口名、優先度A0〜D/リスクR0〜R3の語彙、正本分離方針 | seedでも `CONFIRMED` を維持 |
| PROPOSED | 15入口→業務IDマッピング（全15件 `mappingFactStatus: PROPOSED`）、demoCasesの内容 | 確定扱いしない。UIで `PROPOSED` 表示予定 |
| NEEDS_CONFIRMATION | 43業務すべての行別 `operationalPriority`（全件null維持を検証済み）、D-01〜D-14 | 推測で補完しない。A0/A1画面はDEMO_ONLYケースで検証 |
| CONFLICTING | SRC-DEMO-CONFLICT-A/B（外部共有方針の競合fixture）、CASE-DEMO-004 | 意図的なデモデータ。AIが統合しない挙動（AC-010/013相当）の検証用 |
| 禁止事項 | 本番接続・deploy・外部送信・権限変更・G3以降・input変更・secret/PII取扱い | 本Gateで違反0。実装境界としてPLANとRISKへ転記 |

## 9. 曖昧点・矛盾・停止要因

停止要因（即時停止条件該当）: **なし**

| # | 区分 | 内容 | 扱い |
|---|---|---|---|
| N-1 | 環境差異 | pwsh不在のため `08_VERIFY_PACKET.ps1` を直接実行できず、Python同等実装で代替（§1） | 逸脱として記録。Windows側での再実行により相互確認可能。blockerではない |
| N-2 | 環境差異 | ワークスペースREADME.mdは `.claude/settings.json` による境界固定に言及するが、本リポジトリに `.claude/` は存在しない（GitHubアップロード時に隠しフォルダが含まれなかった可能性） | NEEDS_CONFIRMATION。本セッションではCLAUDE.md・manifest・プロンプトの境界を手続き的に遵守。恒久化するなら `.claude/settings.json` の追加投入を推奨 |
| N-3 | 環境差異 | README.mdの手順はWindowsパス（`C:\Users\...`）前提。現環境はLinuxリモート（GitHub `hiromimasuda/josys-app` からclone） | 情報として記録。作業ディレクトリは実装repoルートで一致しており影響なし |
| N-4 | 指示優先順位 | 仕様§21末尾「Gate 2まで自律的に進めてください」と本Gateの停止指示が異なる | `03A_GATE0_START_PROMPT.txt` 自身が「§21より停止条件を優先」と明記しており**矛盾ではない**。Gate 0完了で停止する |
| N-5 | 仕様注記 | 仕様§6.4は最新優先度分布 `A0=10/A1=13/B=9/C=10/D=1` がPMコア/Sheetに存在するとするが、seedの行別値はnull | manifest `operationalPriorityRowsProvided: false` と整合。**矛盾ではなく設計通り**（本番seedはD-05でSheetエクスポートから生成） |
| N-6 | fixture特性 | KD-DEMO-006のprompt injection文字列（§6参照） | 意図的なテストデータ。命令として扱わない |
| N-7 | 運用上の注意 | 本環境はephemeralコンテナであり、pushしない限り成果物はセッション終了で失われ得る。ユーザー指示によりGitHubへのpushはGate 0確認まで保留 | ローカルcommitのみ実施。人の確認後にpush判断を仰ぐ |

## 10. Gate 1 / Gate 2 開始可否の判定

- **Gate 0: `PASS`**（技術判定。人による `06_GATE_ACCEPTANCE_CHECKLIST.md` の確認が別途必要）
- **Gate 1: 開始可能**。前提条件（PACKET_VALIDATION PASS、未解決blocker 0）は満たしている。ただし開始は人がGate 0を確認し、`03B_GATE1_CONTINUE_PROMPT.txt` を明示的に投入した後に限る
- **Gate 2: 現時点では開始不可**。Gate 1の実装完了と吉川さんによる画面受領（human acceptance）の記録、および `03C_GATE2_CONTINUE_PROMPT.txt` の投入が前提
- Gate 3〜5: 未承認のまま（D-01〜D-14はOPEN維持）
