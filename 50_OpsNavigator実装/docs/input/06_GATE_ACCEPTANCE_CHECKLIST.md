# Gate Acceptance Checklist

- Master document: `JOSYS-OPS-NAV-FABLE5-001`
- Packet: `JOSYS-OPS-NAV-FABLE5-INPUT-001`

## Gate 0 — 仕様・データ境界

- [ ] `07_SHA256SUMS.txt` と入力ファイルが一致
- [ ] Manifest、Seed、Schemaがparse可能
- [ ] Schema検証PASS
- [ ] 11 flows、43 operations、15 eventTemplates
- [ ] ID重複0、参照切れ0
- [ ] secret/credential/PII検出0
- [ ] A0〜D行別値nullを維持
- [ ] 15入口mappingをPROPOSEDとして維持
- [ ] D-01〜D-14をGate 3以降の未決として維持
- [ ] `PACKET_VALIDATION.md` がPASS
- [ ] `IMPLEMENTATION_PLAN.md`、`RISK_REGISTER.md`、`SPEC_TRACEABILITY.md` が存在
- [ ] inputフォルダの変更0
- [ ] コード実装、本番接続、package install、deploy 0

Gate 0判定: `PASS / RETURN / BLOCKED`

## Gate 1 — Clickable Prototype

- [ ] ホームは今日、DEMO A0/A1、承認待ち、次の30日を優先
- [ ] 15入口すべて表示
- [ ] 43業務一覧と詳細
- [ ] ケース作成
- [ ] AI構造化回答mock
- [ ] Emergency Pack
- [ ] 代表事象から業務詳細へ3クリック以内
- [ ] mobile幅で主要操作が可能
- [ ] desktop/mobileスクリーンショット
- [ ] 外部runtime通信0
- [ ] すべて匿名化fixture

Gate 1判定: `PASS / RETURN / BLOCKED`

## Gate 2 — Local Working MVP

- [ ] PostgreSQL/Prisma migrationとseed
- [ ] Case、WorkItem、Approval、Evidence、Exception
- [ ] RBACをserver/API側でも強制
- [ ] SourceRegistryと全文検索
- [ ] stale、conflicting、Restricted、AI未承認を区別
- [ ] prompt injection資料を命令として扱わない
- [ ] R2/R3は承認と証跡なしで完了不可
- [ ] AuditEventが主要変更を記録
- [ ] PWA Emergency Packがオフライン表示可能
- [ ] lint PASS
- [ ] typecheck PASS
- [ ] unit PASS
- [ ] integration PASS
- [ ] e2e PASS
- [ ] 11/43/15検証PASS
- [ ] secret/PII検査PASS
- [ ] 起動手順を別PCでも再現可能
- [ ] `DEPLOYMENT_NOT_EXECUTED.md` が存在

Gate 2判定: `PASS / CONDITIONAL_PASS / RETURN / BLOCKED`

## AC-001〜AC-024 証跡対応

| AC | 必須証跡 |
|---|---|
| AC-001 | ホーム優先表示のe2e/スクリーンショット |
| AC-002 | 入社入口から関連業務へのe2e |
| AC-003 | 退職R2・削除前ゲートのe2e |
| AC-004 | 全社Wi-Fi障害の初動表示 |
| AC-005 | PC紛失R3固定導線 |
| AC-006 | 誤送信R3固定プレイブック |
| AC-007 | SaaSログイン不可の段階切分け |
| AC-008 | Drive外部共有の承認ゲート |
| AC-009 | 未知問題で社内未確認と一般論を分離 |
| AC-010 | データ復元の証跡・承認・戻し方 |
| AC-011 | 自動化停止の手動代替 |
| AC-012 | 契約期限の期限・判断者表示 |
| AC-013 | 正本競合をCONFLICTING表示 |
| AC-014 | stale資料の警告と優先順位 |
| AC-015 | AI未承認sourceを回答根拠から除外 |
| AC-016 | Restrictedを権限外で検索不可 |
| AC-017 | R2/R3を証跡なしでclose不可 |
| AC-018 | 承認者以外がapprove不可 |
| AC-019 | AuditEvent記録 |
| AC-020 | 例外に担当・期限・次回確認日必須 |
| AC-021 | 引継ぎ受領/差戻し記録 |
| AC-022 | offline Emergency Pack |
| AC-023 | mobile主要導線 |
| AC-024 | UTC保存/JST表示 |

## 最終受領物

- [ ] repo一式
- [ ] 起動・停止・再seed手順
- [ ] database migration
- [ ] `SPEC_IMPLEMENTATION_MATRIX.md`
- [ ] `TEST_REPORT.md`
- [ ] desktop/mobileスクリーンショット
- [ ] 失敗/未実装/要確認一覧
- [ ] `DEPLOYMENT_NOT_EXECUTED.md`
- [ ] Gate 3以降へ進んでいないこと
