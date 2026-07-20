# SECURITY.md — Gate 2 ローカルMVPのセキュリティ境界

## 到達可能範囲

- アプリ・DBとも **127.0.0.1 のみ**にバインド。外部公開なし
- アプリruntimeの外部通信 **0件**(e2eで機械検証)。telemetry無効、外部フォント/CDN/画像なし
- `example.invalid` のURI(証跡・出典)は表示専用でfetch・リンク化しない

## 認証・認可

- 認証はmock(`x-demo-user` ヘッダー)。**実credentialは存在しない**
- 認可(RBAC)は**全APIでサーバー側強制**(UI非表示に依存しない)。未知ユーザー401、権限外403
- 本番認証(Google Workspace/ドメイン制限)はGate 3の承認後。現時点では未実装・未接続

## データの取扱い

- fixtureは完全合成(`syntheticOnly/demoOnly`)。実名・実メール・実URL・実IDなし
- 保存しないもの(§9.4): パスワード/APIキー/Token/Cookie/秘密鍵/個人情報全文/原ログ本文/契約原本。
  該当カラム自体を設計しない
- 禁止入力はクライアント注意喚起+**サーバー側で保存拒否**(`FORBIDDEN_INPUT`)
- 機密レベル: employee=INTERNALのみ、情シス系ロール=+RESTRICTED。HIGHは本文検索対象外
  (取得段階でフィルタし、タイトル・URLも漏らさない)

## 高リスク操作の統制

- R2: 実行前承認 + 実行前/実行後/本人確認の証跡がないと完了不可(サーバー側で409)
- R3: 上記に加え、承認がない場合は緊急封じ込め記録(理由・共有時刻・最小操作・事後確認)必須
- 承認判断はapproverロールのみ。完了の直接PATCHは不可(completeエンドポイント経由のみ)
- Action Runnerは `DisabledActionRunner` のみ(常に拒否)。`EXTERNAL_WRITES_ENABLED=false` 既定

## Prompt injection対策(§9.5)

- 取得文書・fixture本文(例: KD-DEMO-006の命令文)は**常にデータ**として扱う。実行経路が存在しない
- AI mockはキーワード分類のみで文書内容を命令として解釈しない(integrationテストで検証)
- AI根拠は `approvedForAi=true` かつ `ACTIVE` の資料のみ。stale/競合/未承認/Restrictedは引用しない
- 競合正本はAIが統合せず「要突合」として併記

## 監査

- AuditEventは追記専用(アプリからupdate/delete経路なし)。閲覧はauditor/adminのみ
- 記録対象: ケース作成/状態変更/完了(拒否含む)/証跡/承認/例外/候補作成・公開/受領/AI回答種別
- 質問本文・個人情報・秘密情報はAuditEventへ保存しない

## 秘密情報の管理

- `packages/db/.env` / `apps/web/.env.local` はgitignore対象。commitされる値はDEMO_ONLYの
  loopback接続例のみ(`.env.example`)
- `NEXT_PUBLIC_*` に秘密を入れない(該当変数なし)

## 既知の制限(Gate 3以降で対応)

- 実ドメイン制限・実ログイン(AC-023の完全対応)
- 外部正本同期・index運用(AC-017)
- セキュリティ事象向け固定プレイブックの正本化(現状は一般ガイドをラベル付きで表示)
