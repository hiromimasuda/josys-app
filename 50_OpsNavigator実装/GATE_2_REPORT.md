# GATE_2_REPORT.md — Local Working MVP 実装報告

- Master: `JOSYS-OPS-NAV-FABLE5-001` v1.0.1 / Packet: `JOSYS-OPS-NAV-FABLE5-INPUT-001` v1.0.0
- 実施日: 2026-07-20
- **状態: Gate 2 technical completion COMPLETE / Gate 2 business acceptance PENDING**
- Gate 3〜5は未着手・未承認。D-01〜D-14はOPENのまま
- 本レポートは技術完了の報告であり、人の業務受領を代替しない

## 1. 実装内容(Gate 1からの差分)

### データ層
- **PostgreSQL 16 + Prisma 6.19.3**: 17モデル(DemoUser/Flow/Operation/EventTemplate/Case/WorkItem/
  Approval/Evidence/CaseException/SourceAsset/KnowledgeDocument/KnowledgeCandidate/AcceptanceCheck/
  AuditEvent/ScheduleOccurrence)。migration `init` 1本
- **seed**: `docs/input/04_SEED_BUNDLE.json` から投入(値の追加・推測なし。優先度null/PROPOSED維持を保存)。
  件数検証(11/43/15)を内蔵し、不一致なら失敗する

### サーバー(apps/web/src/server + /api/v1 16ルート)
- **RBACのAPI強制**: mock認証(x-demo-user)だが認可は全APIでサーバー判定(401/403)
- **§7.4不変条件**: R2/R3完了は承認+実行前/実行後/本人確認証跡が必須。R3は緊急封じ込め記録
  (理由・共有時刻・最小操作・事後確認)で代替可。PATCH迂回不可。拒否もAuditEventへ記録
- **検索**: PostgreSQL(ILIKE)+正本区分順位。取得段階で機密フィルタ(権限外はタイトル・URLも返さない)。
  stale/競合/AI未承認/injectionのラベル付け。**承認済みFAQ候補のみ検索対象に追加**(AC-020)
- **AI mock(サーバー)**: 決定論。根拠はapprovedForAi+ACTIVEのみ。正本競合は統合せず要突合併記。
  質問本文は監査へ保存しない
- **ナレッジ改善ループ**: 候補作成→knowledge_approverのみ公開/差戻し(+監査)
- **引継ぎ受領**: 実動作+証跡なしの「受領」をサーバーが409で拒否
- **AuditEvent**: 追記専用。主要12種の操作を記録
- **DisabledActionRunner / MockSourceConnector**(packages/integrations): 常に拒否/外部照会なし

### UI接続
- ホーム=DB参照、ケース一覧/詳細/作成=API接続(証跡追加・承認依頼・完了操作つき)、
  承認判断、ナレッジ検索+候補レビュー、AI相談=API、管理=サーバー403、引継ぎ記録
- 同一ページ内のDEMOユーザー切替が全コンポーネントへ即時反映されるよう修正(実バグ1件検出・修正)

## 2. 起動・停止・初期化・復元手順

README.md(起動)とRUNBOOK.md(停止・再seed・リセット・pg_dump/復元・トラブルシュート)に記載。
要点: `pnpm install` → `.env`雛形コピー → `pnpm db:up && pnpm db:migrate && pnpm db:seed` →
`pnpm build && PORT=3111 pnpm start`。

## 3. テスト結果(詳細はTEST_REPORT.md)

lint 0 / typecheck 5プロジェクト / **unit 17/17** / **integration 23/23** / **e2e 60/60** /
パケット検証43チェックPASS。スクリーンショット14画面×desktop/mobileを更新・目視確認済み。

## 4. AC-001〜024対応(詳細はSPEC_IMPLEMENTATION_MATRIX.md)

✅自動検証19 / 🟡一部代替3(AC-002/006/019) / ⏭Gate 3以降2(AC-017/023)。
⏭の2件は本番同期・実ログインが前提のため、G2では相当機能(検索の一貫性・未知ユーザー401)までを実装し
理由を記録した。

## 5. Docker / Prisma / DB構成

- dockerd: リモート検証環境ではデーモン常駐がないため手動起動(通常PCでは不要)
- `docker-compose.yml`: `postgres:16-alpine` を **127.0.0.1:5432限定**でバインド。
  資格情報はDEMO_ONNLYローカル値(`opsnav_demo` / commit対象は.env.exampleのみ)
- イメージ取得: Docker Hub CDNがプロキシポリシーで403のため、**公式ミラー
  `mirror.gcr.io/library/postgres:16-alpine`(digest `sha256:57c72fd2...`)** を取得し
  `postgres:16-alpine` としてタグ付け(同一公式イメージ。利用者のPCでは通常のHub pullで可)
- Prisma: client/engine 6.19.3。pnpm `onlyBuiltDependencies` で prisma関連のみビルドスクリプト許可

## 6. migration / seed結果

- `prisma migrate dev --name init`: 成功(1 migration)
- seed: `seed OK: {"flows":11,"operations":43,"eventTemplates":15,"users":8,"cases":5,"sources":6,"documents":6}`
  +WorkItem 3件(CASE-DEMO-001)。再seedは冪等

## 7. 追加packageと理由(すべて事前承認済み・lockfile固定)

| package | 版 | 理由 |
|---|---|---|
| prisma(dev) / @prisma/client | 6.19.3 | 03C指定のORM/migration |
| zod | 3.x | APIサーバー側の入力検証(不変条件の強制) |
| tsx(dev) | 4.x | seedスクリプトのTS実行 |

## 8. 外部通信の区分

**install/build時の依存取得(承認済み・一回性)**
- npmレジストリ(pnpm。プロキシ除外の直接許可ドメイン)
- `binaries.prisma.sh`(Prismaエンジン。事前承認どおり)
- `mirror.gcr.io`(postgres:16-alpine公式ミラー。Docker Hub CDN 403の代替。§5参照)
- 備考: Docker Hub本体(`production.cloudfront.docker.com`)はプロキシポリシーで拒否された(記録)

**app runtime通信: 0件**
- e2e `network.spec.ts`(desktop/mobile)が16画面遷移+API操作+AI mockで
  localhost以外への発信0件を機械検証
- DB接続は127.0.0.1のみ。telemetry無効。外部フォント/CDN/画像なし。`AI_ENABLED=false` /
  `EXTERNAL_WRITES_ENABLED=false`

## 9. 仕様差分・未実装・要確認・未解決リスク

| # | 区分 | 内容 |
|---|---|---|
| 1 | 要確認 | `06_GATE_ACCEPTANCE_CHECKLIST.md` 末尾のAC表と§17.1のAC番号割当が一部相違。§17.1を正として対応(両内容とも網羅)。入力文書の整合は人の判断へ |
| 2 | 未実装(G3+) | AC-017(index stage/swap)、AC-023(実ドメイン制限)、外部同期・import、管理系API(sync/reindex)、カレンダー周期/年間ビュー |
| 3 | 一部代替 | AC-006固定プレイブック=一般ガイドラベル付き表示(正本化はG3+)。AC-019候補起票はナレッジ画面から(ケース画面導線は未実装) |
| 4 | 設計判断 | 全文検索は日本語(分かち書きなし)のためtsvector('simple')でなくILIKE+正本順位を採用(説明可能性優先、§8.4準拠の順位付け)。文書量増加時はpg_trgm/形態素の再検討をG3で |
| 5 | 既知事項 | WorkItemはseed表示のみ(CRUD APIなし)。packages/ui未分離(G1から継続)。mobileは幅ベース検証(実機未検証) |
| 6 | 運用注意 | integration/e2eはDBを変更するため実行前に再seed必須(RUNBOOK) |
| 7 | 環境依存 | 検証環境固有: dockerd手動起動、postgres imageのミラー取得。通常PCでは標準手順で再現可能 |
| 8 | リスク登録 | RISK_REGISTER.mdのRK-02(push前消失)はpush済みで解消予定。他は状態変更なし |

## 10. 統制の遵守宣言

- `docs/input/` 変更0(SHA-256全件一致を最終確認)
- deploy / PR作成 / merge / 新規ブランチ 0件(DEPLOYMENT_NOT_EXECUTED.md)
- 本番API・外部AI・SaaS接続 0件、実データ・実credential投入 0件
- Gate 3以降へ進んでいない。D-01〜D-14はOPENのまま

## 11. 変更ファイル(Gate 2コミット)

docker-compose.yml / packages/db(schema・migration・seed) / packages/integrations /
apps/web/src/server(認可・監査・サービス・16 APIルート) / UI接続8画面 /
tests(integration 4ファイル新規、e2e 1ファイル新規+更新) / screenshots 28枚更新 /
README・RUNBOOK・SECURITY・DEPLOYMENT_NOT_EXECUTED・TEST_REPORT・SPEC_IMPLEMENTATION_MATRIX・
GATE_2_REPORT / docs/build-packet(05〜09,11+status更新) / .env.example×2

## 12. 次のステップ(人)

1. `06_GATE_ACCEPTANCE_CHECKLIST.md` Gate 2欄で確認し、business acceptanceを判定
2. 別PCでREADME手順の再現確認(推奨)
3. Gate 3以降はD-01〜D-14の決定と別承認が前提
