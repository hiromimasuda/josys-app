# SPEC_IMPLEMENTATION_MATRIX.md — 仕様対応表(Gate 2時点)

- 正本: `docs/input/02_MASTER_SPEC.snapshot.md` v1.0.1。AC番号は§17.1に従う
- 注意: `06_GATE_ACCEPTANCE_CHECKLIST.md` 末尾のAC表は§17.1と内容の割当が一部異なる
  (例: 06のAC-010「データ復元」/ §17.1のAC-010「正本競合」)。優先順位(manifest)に従い
  **§17.1を正**とし、06側の項目も実質的に網羅した。相違自体は要確認として人へ報告する

## AC-001〜AC-024

判定: ✅=自動テストで検証 / 🟡=実装済み・一部手動/代替 / ⏭=Gate 3以降(本ゲート対象外)

| AC | 内容(§17.1) | 判定 | 証跡 |
|---|---|---|---|
| AC-001 | ホーム優先表示 | ✅ | e2e smoke + screenshots/home |
| AC-002 | 入社カード→関連・期限・証跡へ案内 | 🟡 | /events/EV-01実装(関連業務・証跡表示)。e2eは代表としてEV-04で3クリック検証。EV-01は画面確認 |
| AC-003 | 退職→R2・削除前ゲート | ✅ | EV-02=R2表示 + R2完了ガード(integration/e2e。削除系はR2承認必須として一般化) |
| AC-004 | 全社Wi-Fi障害初動 | ✅ | e2e three-click + AI mock(出典付き) |
| AC-005 | PC紛失→R3・通常FAQで完結しない | ✅ | CASE-DEMO-003 R3表示(e2e) + R3完了ガード(integration) |
| AC-006 | 誤送信→R3固定プレイブック | 🟡 | EV-06=R3カード+固定初動ガイド表示。ただし内容は一般論ラベル付き(社内正本の固定プレイブック化はGate 3+) |
| AC-007 | 外部共有→R2承認・前後証跡 | ✅ | e2e gate2-flows(R2フロー完結) + integration |
| AC-008 | パスワードを求めない誘導 | ✅ | unit(ai doNotDo) + e2e(禁止入力ブロック) + サーバー拒否(integration) |
| AC-009 | 未知問題の分離 | ✅ | integration + e2e(社内未確認と一般論の分離表示) |
| AC-010 | 正本競合→要突合・非統合 | ✅ | integration(検索/AI) + e2e(ask conflict, knowledge) |
| AC-011 | stale警告・確度低下 | ✅ | integration(staleWarning+順位) + UI表示 |
| AC-012 | R2証跡なし完了→サーバー拒否 | ✅ | integration + e2e(409と不足表示) |
| AC-013 | R3緊急封じ込めの必須記録 | ✅ | integration(理由・共有時刻・最小操作・事後確認をzod必須化) |
| AC-014 | 非許可検索0件(タイトルも非漏えい) | ✅ | integration + e2e(employee切替) |
| AC-015 | AI未承認sourceの非利用 | ✅ | integration(禁止5ソース非引用) |
| AC-016 | 文書内命令の非実行 | ✅ | integration(検索・AI双方) + 実行経路の不存在(SECURITY.md) |
| AC-017 | index再構築失敗時の継続 | ⏭ | G2はライブindex/再構築構造を持たない(DB直接検索のため単一障害点なし)。stage/swapはGate 3の同期導入時に実装 |
| AC-018 | オフラインEmergency Pack | ✅ | e2e offline(×2形状) |
| AC-019 | 未回答→KnowledgeCandidate作成 | 🟡 | 候補作成→人レビュー待ちを実装(API/UI/監査)。ケース/AI回答画面からの起票導線は未実装(ナレッジ画面から起票) |
| AC-020 | 承認後のみ検索対象+AuditEvent | ✅ | integration(承認前後の検索差) + 監査記録 |
| AC-021 | 実動作・証跡なしで引継ぎ完了不可 | ✅ | integration + e2e(サーバー409) |
| AC-022 | 一般社員の管理403 | ✅ | e2e(サーバー403+安全な案内) |
| AC-023 | 外部ドメインログイン拒否 | ⏭ | 実ログインはGate 3。mock相当として未知ユーザー401は実装済み |
| AC-024 | UTC保存/JST表示 | ✅ | unit(formatJst) + DB timestamptz + 全画面JST表記 |

集計: ✅19 / 🟡3 / ⏭2(いずれもGate 3以降の前提機能に依存。理由を明記)

## 06チェックリスト(Gate 2欄)との対応

| 06項目 | 状態 |
|---|---|
| PostgreSQL/Prisma migrationとseed | ✅ migration `init` + seed(11/43/15検証付き) |
| Case, WorkItem, Approval, Evidence, Exception | ✅(WorkItemは表示+seed。CRUD APIは未提供=既知事項) |
| RBACをserver/API側でも強制 | ✅ integration/e2e |
| SourceRegistryと全文検索 | ✅ PostgreSQL ILIKE検索+正本順位(日本語のためtsvector'simple'不採用の判断を記録) |
| stale/conflicting/Restricted/AI未承認の区別 | ✅ |
| prompt injection資料を命令として扱わない | ✅ |
| R2/R3は承認と証跡なしで完了不可 | ✅ |
| AuditEventが主要変更を記録 | ✅ |
| PWA Emergency Packオフライン | ✅ |
| lint/typecheck/unit/integration/e2e PASS | ✅(TEST_REPORT.md) |
| 11/43/15検証・secret/PII検査PASS | ✅(verify_packet + seed検証 + unit) |
| 起動手順を別PCでも再現可能 | ✅ README/RUNBOOK(要: Node22/pnpm/Docker) |
| DEPLOYMENT_NOT_EXECUTED.md | ✅ |

## 主要仕様章の実装状態(§単位の差分のみ)

- §5 画面: 全navルート実装。カレンダーの周期/年間ビューは未実装(今日/30日のみ)
- §7 データモデル: G2対象エンティティ実装。ScheduleRule/Runbook/KnowledgeChunk/AutomationAsset/
  AutomationRun/SyncJob/AIAnswerLogは未実装(G3+または不要と判断した範囲を記録)
- §8 AI: mock+検索統制を実装。実providerアダプタ/pgvectorはG4
- §11 API: 読取・アプリ内書込の主要APIを実装。管理系(sync/reindex)はG3
- §15 同期: Prototype段階(固定fixture)。importと外部同期はG3
