# 07_AI_ASSISTANT_POLICY.md(G2生成)

- master: JOSYS-OPS-NAV-FABLE5-001 v1.0.1 §8 / 実装の正: `apps/web/src/server/services/aiService.ts`

## 実装済みポリシー(mock)

- provider: 決定論mockのみ(`AI_ENABLED=false`)。外部AI・APIキーなし
- 分類: キーワード規則 → {既知(Wi-Fi系), 正本競合(外部共有系), 未知(その他)}。文書内容や質問中の
  命令文は分類にのみ使い、実行しない(actionExecutionAllowed=false固定)
- 根拠(grounding): `approvedForAi=true ∧ status=ACTIVE ∧ searchable ∧ 権限内機密` の文書のみ。
  stale/CONFLICTING/未承認/RESTRICTED超えは引用禁止(integrationで検証)
- 競合: internalPolicy.conclusion=null + conflictSources併記 + 承認必須。統合しない
- 未知: §8.7フロー(安全な収集→ケース引き渡し)。confidence=NONE
- 表示: §5.9の固定9項目順。一般論は「社内適用は要確認」ラベル必須
- 監査: AI_ANSWERED(シナリオID+回答種別のみ。質問本文・PIIは保存しない)

## Gate 4(実provider)への引き継ぎ条件

- adapter差し替え点: `answerQuestion()` のシナリオ分岐を provider呼出へ置換し、
  ①grounding済み文書のみをcontextへ、②§8.5契約へのschema検証、③opaque source ID、
  ④固定プレイブック優先(セキュリティ事象)、⑤confidenceのサーバー側算出 を維持すること
- 前提: D-10(AI契約・データ条件)の決定とGate 4承認
