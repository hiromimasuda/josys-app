# 05_WORKFLOWS_AND_STATE_MACHINES.md(G2生成)

- master: JOSYS-OPS-NAV-FABLE5-001 v1.0.1 / 実装の正: `apps/web/src/server/services/caseService.ts`

## Case状態機械(サーバー強制)

```text
OPEN → IN_PROGRESS | BLOCKED | WAITING_APPROVAL
IN_PROGRESS → WAITING_APPROVAL | BLOCKED | OPEN
WAITING_APPROVAL → IN_PROGRESS | BLOCKED
BLOCKED → IN_PROGRESS | OPEN
任意(未完了) →[POST /complete のみ]→ COMPLETED(終端)
```

- PATCHでのCOMPLETED直行は `USE_COMPLETE_ENDPOINT` で拒否
- 承認依頼作成時、未完了ケースは `WAITING_APPROVAL` へ

## 完了ガード(§7.4 / AC-012・013)

```text
complete(case):
  if risk in {R2, R3}:
    require evidence kinds ⊇ {BEFORE, AFTER, USER_CONFIRMATION}  → 不足: 409 EVIDENCE_REQUIRED
    if no APPROVED approval:
      R2 → 409 APPROVAL_REQUIRED
      R3 → emergency{reason, sharedAt, minimalActions, postReviewAt} 必須
            → なし: 409 APPROVAL_OR_EMERGENCY_REQUIRED
  拒否・成功ともAuditEventへ追記(拒否はresult=DENIED+reasonCode)
```

## 承認 / ナレッジ / 受領のフロー

- Approval: PENDING →[approver/adminのみ]→ APPROVED | REJECTED(再判断不可)
- KnowledgeCandidate: PENDING →[knowledge_approver/adminのみ]→ APPROVED(検索対象化) | REJECTED
- AcceptanceCheck: ACCEPTED は operated=true かつ evidenceUri 必須(409で拒否)
