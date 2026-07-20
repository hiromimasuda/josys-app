# 情シス Ops Navigator — ローカルMVP(Gate 2)

発生事象から「最初の安全な行動 → 判断者 → 手順 → 証跡 → 完了/引継ぎ」へ案内する社内Webアプリの
実装ワークスペース。**合成デモデータのみ**で動作し、本番システム・実データ・外部AIには接続しない。

- 仕様の正本: `docs/input/02_MASTER_SPEC.snapshot.md`(読み取り専用)
- 現在地: **Gate 2 技術完了 / business acceptance PENDING**(`GATE_2_REPORT.md`)
- Gate 3以降(本番接続・deploy・外部連携)は未承認

## 起動手順(ローカルDEMO)

前提: Node.js 22+, pnpm 10+, Docker(Compose v2), Python 3(パケット検証用)

```bash
# 0. 入力パケットの検証(初回・更新時)
python3 tools/verify_packet.py            # Status: PASS を確認

# 1. 依存取得(repo内のみ。prisma関連のみビルドスクリプト許可済み)
pnpm install

# 2. 環境変数(DEMO_ONLYのローカル値)
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env.local

# 3. DB起動(127.0.0.1限定・DEMO専用) → migration → seed
pnpm db:up
pnpm db:migrate
pnpm db:seed                              # seed OK: 11/43/15 を確認

# 4. ビルドと起動
pnpm build
PORT=3111 pnpm start                      # → http://127.0.0.1:3111
```

停止・初期化・復元は `RUNBOOK.md` を参照。

## DEMOユーザー(mock auth)

ヘッダーの「DEMOユーザー」で切替。**認可はサーバー側で強制**されるため、UI操作でも権限外は403になる。

| ユーザー | ロール | 試せること |
|---|---|---|
| DEMO_OPERATOR(既定) | operator | ケース作成・証跡・完了(R2/R3はガードされる) |
| DEMO_APPROVER | approver | 承認・例外の判断 |
| DEMO_EMPLOYEE | employee | 検索がINTERNAL限定になる/管理403 |
| DEMO_ADMIN | admin | 管理メタデータ表示 |
| DEMO_KNOWLEDGE_APPROVER | knowledge_approver | FAQ候補の承認・公開 |

## テスト

```bash
pnpm lint && pnpm typecheck && pnpm test:unit
pnpm db:seed && pnpm test:integration     # DB必須。実行毎に再seed
pnpm build && pnpm db:seed && pnpm test:e2e   # スクリーンショットも更新される
```

## 構成

```text
apps/web             Next.js 15 (App Router, UI + /api/v1)
packages/domain      型・enum・seed読込+11/43/15検証・禁止入力検知
packages/db          Prisma schema/migrations/seed (@ops/db)
packages/ai          AI回答契約(§8.5)とmock
packages/integrations DisabledActionRunner / MockSourceConnector
tests/{unit,integration,e2e}
docs/input           入力パケット(読み取り専用・変更禁止)
docs/build-packet    派生設計文書
tools/verify_packet.py  入力パケット検証(pwsh非対応環境向け)
```

## ゲート運用(要約)

Gate 0(検証・計画) → 人確認 → Gate 1(プロトタイプ) → 人受領 → **Gate 2(ローカルMVP・現在)** →
人受領 → Gate 3〜5は**別承認**(本仕様だけでは本番接続・deploy・書き戻しを許可しない)。
詳細は `docs/input/00_READ_ME_FIRST.md` と `06_GATE_ACCEPTANCE_CHECKLIST.md`。
