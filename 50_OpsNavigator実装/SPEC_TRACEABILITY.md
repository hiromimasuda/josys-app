# SPEC_TRACEABILITY.md — 仕様トレーサビリティ（Gate 0時点）

- 正本: `docs/input/02_MASTER_SPEC.snapshot.md`（`JOSYS-OPS-NAV-FABLE5-001` v1.0.1）
- 本表は派生文書。内容を複製せず、仕様章 → 実装予定物 → 検証方法の対応だけを持つ
- 状態凡例: `PLANNED_G1` / `PLANNED_G2` / `DONE_G0` / `OUT_OF_SCOPE(G3+)` / `HUMAN_ONLY`

## 1. 仕様章 → 実装対応表

| 仕様章 | 内容 | 実装予定物 | 検証 | 状態 |
|---|---|---|---|---|
| §0〜§1 | 製品コンセプト・採用/不採用判断 | 実装対象外（前提知識） | — | DONE_G0（読了） |
| §2.1 | 10原則 | 全画面・API設計の横断制約 | 各ACに分散 | PLANNED_G1/G2 |
| §2.2 | 完了の定義 | Case完了条件のサーバー側検証 / AcceptanceCheck | AC-012/013/021 | PLANNED_G2 |
| §3.1 | ペルソナ別初期表示 | mock authのロール別ホーム | AC-001 | PLANNED_G1 |
| §3.2 | RBAC 8ロール | packages/domain権限表 + API層強制 | AC-014/022 + integration | PLANNED_G2（UIはG1） |
| §3.3 | 機密レベル4段階 | SourceAsset.confidentiality + 検索フィルタ | AC-014/015 | PLANNED_G2 |
| §4.2 | フィールド別正本 | SourceRegistry（authority/migration_status） | AC-010/011 | PLANNED_G2 |
| §4.3 | 11フロー定義 | fixtures（04_SEED_BUNDLE由来） | 件数11の機械検証（済） | DONE_G0（データ検証）→G1表示 |
| §5.1 | ナビゲーション構造 | apps/webレイアウト（mobile 5タブ/desktop 10項目） | スクリーンショット | PLANNED_G1 |
| §5.2 | /home 今日の情シス | ホーム画面（表示順7項目・非表示4項目） | AC-001 | PLANNED_G1 |
| §5.3 | /events 15入口 | EventCard 15枚+押下直後ビュー10項目 | AC-002〜008 | PLANNED_G1 |
| §5.4 | /cases/new 受付 | トリアージフォーム（必須7・禁止入力群） | AC-008 + unit | PLANNED_G1（保存はG2） |
| §5.5 | /cases/:id 詳細 | 上部固定+7タブ | AC-003/010/012 | G1静的→G2動的 |
| §5.6〜5.7 | /operations 一覧・詳細 | 43業務一覧（9フィルタ・初任者モード）+詳細15セクション | AC-002 + 件数検証 | PLANNED_G1 |
| §5.8 | /calendar 3ビュー | 今日/次30日（G1）、周期/年間（G2） | AC-024 | PLANNED_G1/G2 |
| §5.9 | /ask AI相談 | 固定表示順9項目のmock回答UI | AC-008/009/010 | PLANNED_G1 |
| §5.10 | /knowledge | SourceRegistry画面 | AC-011/015/019/020 | PLANNED_G2 |
| §5.11 | /handover | 習熟段階+No-Masudaテスト記録 | AC-021 | PLANNED_G2 |
| §6.1 | 43業務seed | fixtures（検証済43件・重複0・未分類0） | tools/verify_packet.py | DONE_G0 |
| §6.2 | 15入口mapping（PROPOSED） | PROPOSEDバッジ付き表示 | mappingFactStatus検証（済） | DONE_G0→G1表示 |
| §6.3 | A0〜D / R0〜R3別軸 | domain enum。混在表示禁止 | AC-001 + unit | PLANNED_G1 |
| §6.4 | 状態語彙 | packages/domain enum群 | typecheck + unit | PLANNED_G1 |
| §7.1〜7.3 | エンティティ/ER | Prisma schema（G2）。G1は型のみ | migration + integration | PLANNED_G2 |
| §7.4 | 不変条件8項目 | サーバー側検証ロジック | AC-012/013/016/017 + integration | PLANNED_G2 |
| §8.1〜8.4 | 3層ナレッジ・取込・検索順位 | SourceRegistry+FTS（同期はmock connector） | AC-011/014/015 | PLANNED_G2 |
| §8.5 | AI回答契約 | packages/ai mock + 契約テスト | AC-008〜010 + unit | PLANNED_G1(UI)/G2(契約) |
| §8.6〜8.7 | AIプロンプト要件・未知問題フロー | mock応答の分岐設計 | AC-009 | PLANNED_G2 |
| §8.8 | 改善ループ | KnowledgeCandidate→人レビュー | AC-019/020 | PLANNED_G2 |
| §8.9 | RAG基盤判断 | FTSのみ実装。pgvector/マネージドRAGは不採用 | — | OUT_OF_SCOPE(G4+) |
| §9.1 | MVP安全境界 | 禁止操作の非実装+DisabledActionRunner | integration | PLANNED_G2 |
| §9.2 | 将来の実行連携 | DisabledActionRunnerスタブのみ | unit（常に実行不可） | PLANNED_G2 |
| §9.3 | 認証・認可 | mock auth（本番Identity PlatformはG3） | AC-022/023（mock範囲） | PLANNED_G2 / 残余G3 |
| §9.4 | 秘密・個人情報の非保存 | スキーマに該当カラムを作らない+禁止入力UI | secret/PII機械検証 | PLANNED_G2 |
| §9.5 | Prompt injection対策 | 文書=データ扱い、opaque source ID | AC-016 + unit | PLANNED_G2 |
| §9.6 | AuditEvent | 追記専用テーブル+全主要変更の記録 | AC-019 + integration | PLANNED_G2 |
| §10 | 技術スタック | IMPLEMENTATION_PLAN.md §2〜3 | lockfile・構成レビュー | DONE_G0（計画） |
| §11 | API契約 | apps/web API routes（読取/書込/管理） | integration | PLANNED_G2 |
| §12 | UX・デザインシステム | packages/ui（トークン・16コンポーネント・空状態文言・WCAG 2.2 AA目標） | AC-001/023 + スクリーンショット | PLANNED_G1 |
| §13 | Emergency Pack | PWA offlineキャッシュ（キャッシュ可/不可リスト遵守） | AC-018 | PLANNED_G1/G2 |
| §14 | 非機能要件 | UTC/JST・監査・CI相当のローカルテスト。可用性/バックアップ目標はG3+ | AC-024 + TEST_REPORT | PLANNED_G2 / 残余G3 |
| §15 | 移行・連携計画 | Prototype段階（固定fixture）のみ。同期はmock | — | PLANNED_G2 / 残余G3+ |
| §16 | ゲート定義 | 本計画のゲート構造そのもの | 06チェックリスト | DONE_G0 |
| §17.1 | AC-001〜024 | IMPLEMENTATION_PLAN.md §6の対応表 | 各テスト | PLANNED_G1/G2 |
| §17.2 | データ品質テスト | tools/verify_packet.py + アプリ側バリデータ | 実行済（PASS） | DONE_G0（継続実行） |
| §17.3 | AI評価セット30問 | 本番AI接続が前提のため実施せず。mock契約テストで代替 | — | OUT_OF_SCOPE(G4) |
| §18 | 運用・KPI | 実測はG3以降。画面上のKPI枠のみ | — | OUT_OF_SCOPE(G3+) |
| §19 | D-01〜D-14 | 未決のまま維持（seedへ確定値を入れない） | PACKET_VALIDATION §8 | HUMAN_ONLY |
| §20 | build packet構成 | docs/build-packet/（Gate 0でMANIFESTと生成計画を定義） | — | DONE_G0（計画）→G1/G2生成 |
| §21 | 実装要件プロンプト原文 | 単独使用禁止。03A/03B/03Cが正 | — | DONE_G0（優先順位確認） |
| §22 | 参照トレーサビリティ | 親フォルダの原本には**アクセスしない**（境界遵守） | — | 境界外（読取禁止対象） |
| §23 | 最終完成条件 | Gate 2技術完了の判定基準として使用 | GATE_2_REPORT | PLANNED_G2 |

## 2. Gate 0成果物 → 要求元の対応

| 成果物 | 要求元 | 状態 |
|---|---|---|
| PACKET_VALIDATION.md | 03A / manifest requiredOutputs.G0 | 作成済 |
| IMPLEMENTATION_PLAN.md | 03A / manifest | 作成済 |
| RISK_REGISTER.md | 03A / manifest | 作成済 |
| SPEC_TRACEABILITY.md | 03A / manifest | 作成済（本書） |
| docs/build-packet/（生成計画と文書責任の定義） | 03A「大量複製せず計画を定義」 | 作成済（00_MANIFEST.yaml + 01_GENERATION_PLAN.md） |
| tools/verify_packet.py | 08_VERIFY_PACKET.ps1のpwsh不在代替（逸脱記録付き） | 作成済 |

## 3. 事実区分の実装上の扱い（要約）

| 区分 | 実装ルール |
|---|---|
| CONFIRMED | そのまま表示可。出典（docs/input）を保持 |
| PROPOSED | `PROPOSED` バッジ必須。確定表示・自動採用禁止（15入口mapping等） |
| NEEDS_CONFIRMATION | null値を推測補完しない。「要確認」表示（行別優先度、D-01〜14） |
| CONFLICTING | 併記+「要突合」表示。AI/検索が一方を確定扱いしない |
