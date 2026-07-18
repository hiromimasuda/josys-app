# IMPLEMENTATION_PLAN.md — Gate 1 / Gate 2 実装計画

- Master: `JOSYS-OPS-NAV-FABLE5-001` v1.0.1 / Packet: `JOSYS-OPS-NAV-FABLE5-INPUT-001` v1.0.0
- 状態: Gate 0完了（計画のみ）。**コード実装・package install・DB起動は未実施**
- 本計画は派生文書であり、仕様の正本は `docs/input/02_MASTER_SPEC.snapshot.md`。矛盾時は仕様が勝つ

## 1. ゲート順序と停止点

```text
Gate 0 [完了・本計画] → 人の確認
  → 03B投入 → Gate 1 Clickable Prototype → 実装完了で停止
  → 吉川さんウォークスルー受領（human acceptance・D-14）
  → 03C投入 → Gate 2 Local Working MVP → 技術完了で停止
  → Gate 3〜5 は本パケットでは未承認（進まない）
```

各ゲートで自分の完了状態は「技術完了」までしか主張しない。人の受領には署名しない。

## 2. 使用技術と依存関係

| 層 | 採用（仕様§10準拠） | 導入ゲート |
|---|---|---|
| Web/PWA | Next.js + React + TypeScript | G1 |
| UI | Tailwind CSS + shadcn/ui相当（Radixベース、外部CDN不使用） | G1 |
| 状態/データ | G1はメモリ内fixtureローダー、G2でAPI+DBへ置換 | G1→G2 |
| DB / ORM | PostgreSQL（Docker、loopback限定）+ Prisma | G2 |
| 検索 | PostgreSQL全文検索（tsvector）。pgvectorはG4まで導入しない | G2 |
| AI | 決定論的mock（`aiMockResponses` + §8.5回答契約）。`AI_ENABLED=false` 既定 | G1(mock UI)→G2(契約検証) |
| Action Runner | `DisabledActionRunner` スタブのみ（常に実行不可を返す） | G2 |
| テスト | Vitest + Testing Library（unit/integration）、Playwright（e2e。preinstalled Chromium使用） | G1(最小)→G2(全量) |
| Lint/型 | ESLint + tsc --noEmit | G1 |
| Package manager | 既存コードなし → **pnpm**（仕様の既定に従う）。lockfile固定 | G1 |
| ローカル起動 | Docker Compose（web + postgres、ポートはloopbackへバインド） | G2 |

### package取得とruntime外部通信の分離方針（必須要件）

- **ビルド時のpackage取得**: repo内 `node_modules` への取得のみ。Claude Codeの通常のツール承認フローに従い、Gate 1開始承認後に初めて実行する。グローバルinstall禁止。lockfileをcommitし再現性を固定
- **アプリruntime**: 外部業務API・外部AI・telemetry・CDN・外部フォント・外部画像への接続を**0件**にする。`next.config` でtelemetry無効化、フォントはローカル同梱、`example.invalid` URLは表示のみでfetchしない
- 検証方法: e2e実行中のネットワークログでlocalhost以外への発信0件を確認し、GATE_2_REPORTに証跡を残す

## 3. リポジトリ構成案（仕様§10.3準拠）

```text
50_OpsNavigator実装/
├─ apps/web/                 # Next.js（画面・API routes）
├─ packages/domain/          # 型・enum・状態機械・不変条件（§6.4, §7）
├─ packages/ui/              # デザイントークン・共通コンポーネント（§12.3）
├─ packages/integrations/    # SourceConnector mock / DisabledActionRunner
├─ packages/ai/              # AIProvider mock（§8.5回答契約）
├─ prisma/schema.prisma      # G2
├─ prisma/seed.ts            # 04_SEED_BUNDLE.json由来（読み取りのみ）
├─ fixtures/                 # docs/inputから読み込む変換済みfixture（生成物）
├─ tests/{unit,integration,e2e}/
├─ tools/verify_packet.py    # Gate 0検証（作成済み）
├─ docs/build-packet/        # 派生設計パケット（Gate 0で計画定義済み）
└─ docker-compose.yml        # G2
```

fixtureは `docs/input/04_SEED_BUNDLE.json` を読み取り専用の正規入力とし、コピー改変した二重正本を作らない（ビルド時にimport/変換）。

## 4. Gate 1 作業分解（Clickable Prototype）

| # | 作業 | 主な仕様参照 |
|---|---|---|
| G1-1 | pnpm初期化、Next.js雛形、lint/typecheck/test基盤、telemetry無効化 | §10 |
| G1-2 | `packages/domain`: enum（A0〜D, R0〜R3, work_status, fact_status等）と型定義、seed読み込み+件数/参照バリデータ（11/43/15） | §6.4, §7.2 |
| G1-3 | mock auth（8 mockUsersのロール切替。実credentialなし） | §3.2 |
| G1-4 | 共通UI: PriorityBadge, RiskBadge, FactStatusBadge, SourceAuthorityBadge, EventCard, EmptyState等 | §12.3 |
| G1-5 | `/home` 今日の情シス（A0/A1・承認待ち・次の30日をDEMO_ONLYケースで表示。全43業務表を出さない） | §5.2 |
| G1-6 | `/events` 15入口カード + 押下直後ビュー（まずすること/禁止/質問/優先度/リスク/関連業務。mappingは `PROPOSED` バッジ表示） | §5.3, §6.2 |
| G1-7 | `/operations` 一覧（フィルタ、初任者モード）+ `/operations/:id` 詳細（優先度null行は「要確認」表示で推測しない） | §5.6, §5.7 |
| G1-8 | `/cases/new` 受付トリアージ（必須7項目、禁止入力の注意表示）+ ケース一覧/詳細の静的タブ | §5.4, §5.5 |
| G1-9 | `/calendar` 今日/次の30日ビュー（scheduleOccurrences） | §5.8 |
| G1-10 | `/ask` AI相談mock（§8.5の固定表示順9項目、出典・確度・一般論ラベル） | §5.9, §8.5 |
| G1-11 | PWA Emergency Pack（15入口+初動のオフラインキャッシュ、最終同期時刻表示） | §13 |
| G1-12 | 日本語UI・mobile/desktopレスポンシブ・a11y（44pxタップ、見出し構造、色以外の状態表現） | §12 |
| G1-13 | 検証: 3クリック到達確認、desktop/mobileスクリーンショット、GATE_1_REPORT.md、ウォークスルーチェックリスト | §16 Gate1, 06チェックリスト |

停止: Gate 1実装完了を報告し、**human acceptance PENDING** で停止。

## 5. Gate 2 作業分解（Local Working MVP）

| # | 作業 | 主な仕様参照 |
|---|---|---|
| G2-1 | docker-compose（PostgreSQL loopback限定）、Prisma schema/migration、seed投入（DEMO_ONLY明示） | §7, §10.3 |
| G2-2 | Case / WorkItem / Approval / Evidence / Exception のCRUDと状態遷移。§7.4不変条件をサーバー側で強制（R2/R3は承認+前後証跡なしで完了不可） | §7.4, AC-012/013 |
| G2-3 | RBACをAPI層で強制（UI非表示だけにしない）。403時の安全な案内 | §3.2, §9.3, AC-014/022 |
| G2-4 | SourceRegistry + PostgreSQL全文検索。stale/CONFLICTING/Restricted/AI未承認の検索制御、prompt injection文書のデータ扱い | §8.2〜8.4, §9.5 |
| G2-5 | AuditEvent（追記専用）主要変更の記録 | §9.6 |
| G2-6 | AI mock を§8.5構造化回答契約へ完全一致させ、契約テストを追加 | §8.5〜8.7 |
| G2-7 | ナレッジ候補（KnowledgeCandidate）作成→人レビュー待ちフロー | §8.8, AC-019/020 |
| G2-8 | 引継ぎ/AcceptanceCheck（受領・差戻し記録。自己署名不可） | §5.11, AC-021 |
| G2-9 | PWA Emergency Packのオフラインe2e、UTC保存/JST表示検証 | §13, AC-018/024 |
| G2-10 | テスト全量: lint / typecheck / unit / integration / e2e、11/43/15+secret/PII機械検証の再実行 | §17 |
| G2-11 | 成果物: GATE_2_REPORT.md, README.md, RUNBOOK.md, SECURITY.md, DEPLOYMENT_NOT_EXECUTED.md, SPEC_IMPLEMENTATION_MATRIX.md, TEST_REPORT.md, screenshots/ | manifest requiredOutputs.G2 |

停止: Gate 2技術完了を報告し、**business acceptance PENDING** で停止。Gate 3以降へ進まない。

## 6. AC-001〜AC-024 対応予定

| AC | 概要 | 対応ゲート | 検証方法（予定） |
|---|---|---|---|
| AC-001 | ホーム優先表示 | G1画面 / G2でe2e | e2e + スクリーンショット |
| AC-002 | 入社入口→関連業務 | G1 / G2 | e2e（3クリック計測含む） |
| AC-003 | 退職R2・削除前ゲート | G2 | e2e + サーバー側検証unit |
| AC-004 | Wi-Fi障害初動 | G1 / G2 | e2e |
| AC-005 | PC紛失R3固定導線 | G1 / G2 | e2e |
| AC-006 | 誤送信R3固定プレイブック | G1 / G2 | e2e |
| AC-007 | 外部共有承認ゲート | G2 | integration + e2e |
| AC-008 | パスワードを求めない誘導 | G1 mock / G2契約テスト | unit + e2e |
| AC-009 | 未知問題の分離表示 | G1 / G2 | unit（AI-DEMO-002）+ e2e |
| AC-010 | 正本競合の要突合表示 | G1 / G2 | unit + e2e（SRC-DEMO-CONFLICT-A/B） |
| AC-011 | stale警告 | G2 | unit + e2e（SRC-DEMO-STALE） |
| AC-012 | R2証跡なし完了拒否 | G2 | integration（サーバー側必須） |
| AC-013 | R3緊急封じ込めの事後要件 | G2 | integration |
| AC-014 | 非許可ユーザーの検索0件 | G2 | integration（取得段階で遮断） |
| AC-015 | AI未承認sourceの除外 | G2 | unit + integration |
| AC-016 | 文書内命令の不実行 | G2 | unit（KD-DEMO-006） |
| AC-017 | index再構築失敗時の継続 | G2 | integration（stage/swap設計の範囲で） |
| AC-018 | オフラインEmergency Pack | G1 / G2 | e2e（offline mode） |
| AC-019 | KnowledgeCandidate生成 | G2 | integration |
| AC-020 | 承認後のみ検索対象+監査 | G2 | integration |
| AC-021 | 引継ぎ完了条件 | G2 | integration + e2e |
| AC-022 | 一般社員の管理画面403 | G2 | integration + e2e |
| AC-023 | 外部ドメイン拒否 | G2 | mock auth範囲でunit + 手動証跡（本番authはG3） |
| AC-024 | UTC保存/JST表示 | G2 | unit + e2e |

AC-017とAC-023は本番基盤（実index運用・実Google認証）がG3以降のため、G2ではローカル相当実装+手動証跡で対応し、残余をSPEC_IMPLEMENTATION_MATRIX.mdに明記する。

## 7. 品質ゲート（各ゲート終了時に実行）

1. `python3 tools/verify_packet.py`（入力パケット不変の確認）
2. lint / typecheck / unit / integration / e2e
3. 11/43/15件数・参照整合・secret/PII不在の機械検証（アプリ側バリデータ）
4. desktop/mobile実ブラウザ確認とスクリーンショット保存
5. 失敗・未実装・要確認の隠蔽なし報告

## 8. 環境特記事項

- 本セッションはLinuxリモートコンテナ。pwsh不在のため検証は `tools/verify_packet.py` を正とする（PACKET_VALIDATION.md §1）
- Playwright用Chromiumはpreinstalled（`/opt/pw-browsers/chromium`）。ブラウザの追加ダウンロードは不要
- 成果物の永続化はgit commit（pushはユーザー指示があるまで保留）
- D-01〜D-14は未決のまま維持。G1/G2は匿名化fixtureのみで進められる（D-14のウォークスルー日程のみG1受領の前提）
