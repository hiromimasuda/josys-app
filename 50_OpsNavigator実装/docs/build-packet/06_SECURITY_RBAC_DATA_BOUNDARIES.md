# 06_SECURITY_RBAC_DATA_BOUNDARIES.md(G2生成)

- master: JOSYS-OPS-NAV-FABLE5-001 v1.0.1 / 詳細は実装ルートのSECURITY.md(本書はAPI権限表)

## APIロール権限表(サーバー強制)

| API | employee | operator | approver | k_editor | k_approver | auditor | admin |
|---|---|---|---|---|---|---|---|
| GET /cases | 自作成分 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /cases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH /cases/:id, complete, evidence, approvals(依頼), exceptions | ❌ | ✅ | 一部(evidence/exception) | ❌ | ❌ | ❌ | ✅ |
| POST /approvals/:id/decision | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| GET /knowledge/search | INTERNALのみ | +RESTRICTED | +RESTRICTED | +RESTRICTED | +RESTRICTED | +RESTRICTED | +RESTRICTED |
| POST /knowledge/candidates | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| POST /candidates/:id/review | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| POST /ai/answer | ✅(根拠は権限内のみ) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| acceptance-checks | ❌ | ✅ | ✅ | ❌ | ❌ | 閲覧 | ✅ |
| GET /audit | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| GET /admin/summary | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST /actions/execute | 全ロール403(DISABLED) | | | | | | |

service_accountは上記すべて拒否(同期専用設計、G3で限定付与)。

## データ境界

- HIGH機密: 本文検索対象外(KD-DEMO-005はsearchable=false)。メタデータ閲覧はauditor系のみの設計
- SECRET_POINTER_ONLY: 本文カラム自体なし
- 証跡・出典URI: example.invalidポインタのみ許可(zodで強制)。原本本文は保存しない
