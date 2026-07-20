# TEST_REPORT.md — Gate 2 テスト結果(2026-07-20)

実行環境: Linuxリモートコンテナ / Node 22.22 / pnpm 10.33 / PostgreSQL 16(Docker, 127.0.0.1) /
Chromium(プリインストール、Playwright 1.61)

## 結果サマリー — 全ゲートPASS

| ゲート | コマンド | 結果 |
|---|---|---:|
| lint | `pnpm lint`(ESLint + next/core-web-vitals + next/typescript) | PASS(error/warning 0) |
| typecheck | `pnpm typecheck`(tsc strict ×5プロジェクト) | PASS |
| unit | `pnpm test:unit`(Vitest) | **17/17 PASS** |
| integration | `pnpm test:integration`(Vitest + 実DB) | **23/23 PASS** |
| e2e | `pnpm test:e2e`(Playwright desktop 1440x900 + mobile 390x844) | **60/60 PASS** |
| 入力パケット | `python3 tools/verify_packet.py` | PASS(43チェック/失敗0) |

前提: integration/e2eは実行前に `pnpm db:seed` で初期化(データを変更するため)。

## unit(17)

- `domain.test.ts`(7): 11/43/15件数、ID一意・参照整合、優先度null維持、PROPOSED維持、
  検証器の破壊検知、example.invalid限定、UTC→JST表示
- `ai.test.ts`(7): mock決定論、既知/未知の分離、出典、優先度非推測、禁止事項
- `sanitize.test.ts`(3): 禁止入力検知(パスワード/トークン/鍵、正常文は通す)

## integration(23) — サービス層を実DBで直接検証

- `rbac.test.ts`(6): employeeのケース更新403 / 承認判断はapproverのみ /
  ナレッジ公開はknowledge_approverのみ / employee検索でRESTRICTED不可視(タイトルも返さない) /
  INTERNALは可視 / エラー形式
- `completionGuard.test.ts`(6): R2完了ガード(証跡→承認→完了の段階拒否) /
  拒否・完了のAuditEvent追記 / R3緊急封じ込め(記録必須・reasonCode) /
  PATCH迂回不可 / 再完了不可 / R0は過剰統制なし
- `searchAi.test.ts`(11): stale警告と正本順位 / 競合の要突合併記 / injection文書のデータ扱い /
  AI引用はapprovedForAi+ACTIVEのみ(禁止5ソースの非引用) / AI競合の非統合 /
  命令文入力の非実行 / 未知問題分離 / 決定論 / **承認済みFAQのみ検索対象(承認前後で検証)** /
  秘密入力のサーバー拒否 / 実動作・証跡なし受領の拒否

## e2e(60) — 実ブラウザ(製品ビルド、desktop+mobile両方)

- `gate2-flows`(12): R2ケースのUI完結フロー(作成→409証跡→409承認→承認者切替→承認→完了) /
  承認者以外の判断403 / admin画面のサーバー403とadmin表示 /
  検索の要突合・AI未使用ラベルとemployee不可視 / AI競合の要突合表示 / 受領ガード
- `smoke`(14): ホーム優先表示(§5.2順・43業務表なし) / 15カード / 43件表示 /
  AI既知・未知分離 / 禁止入力ブロック / R3完了条件表示 / 競合ケース要突合
- `three-click`(2): ホーム→入口→業務詳細が3クリック以内
- `offline`(2): Emergency PackのSWキャッシュとオフライン再読込・警告表示
- `network`(2): **16画面遷移+API操作でlocalhost以外への通信0件**
- `screenshots`(28): 14画面×desktop/mobile(`screenshots/`へ保存・目視確認済み)

## AC対応は `SPEC_IMPLEMENTATION_MATRIX.md` を参照

## 既知の注意点

- テストはDEMO DBの状態を変更する。順序: seed → integration、seed → e2e
- Playwrightのmobileは幅ベースエミュレーション(isMobile不使用。固定ナビのヒットテスト安定性のため)。
  実機タッチ・iOS Safariは未検証(Gate 1からの継続既知事項)
