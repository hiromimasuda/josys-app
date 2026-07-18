# 02_PRODUCT_REQUIREMENTS.md(G1生成)

- master: JOSYS-OPS-NAV-FABLE5-001 v1.0.1 / 本書は仕様章への参照と**実装決定**のみを持つ(本文複製なし)

## 画面要求 → 実装決定

| 仕様 | 実装決定(G1) |
|---|---|
| §5.1 ナビ | desktop: サイドバー10項目 / mobile: 下部5タブ+`/menu`。緊急パックはヘッダー常設 |
| §5.2 home | 7セクションを仕様順で固定。データはdemoCases/approvals/scheduleOccurrences/sourceAssetsから導出。fixedNow(2026-07-17T07:00Z)基準 |
| §5.3 events | カード15枚。詳細の初動文はseed未提供のため一般論ラベル付きの`eventGuides`(アプリ内定義)で表示。社内確定と混同しない表示を必須とする |
| §5.4 cases/new | 必須7項目のみ。秘密らしき文字列は保存前ブロック。G1はlocalStorage下書き |
| §5.5 case詳細 | 上部固定+7タブ相当(アンカー)。R2/R3の完了条件警告を常設 |
| §5.6-5.7 operations | 初任者モード既定ON(操作対象行のみ)。優先度はnull=要確認固定 |
| §5.8 calendar | 今日/次の30日のみ。周期・年間はG2 |
| §5.9 ask | 固定9セクション順。§8.5契約サブセット(packages/ai/contract.ts)で描画 |
| §13 Emergency Pack | SW(network-first+cache退避、/emergency precache)。役割名のみの連絡先 |
| §12 UX | 日本語・システムフォント・バッジは色+文字・44pxタップ・skip link・reduced motion |

## データ統制(factModel)

- CONFIRMED: そのまま表示 / PROPOSED: バッジ必須 / NEEDS_CONFIRMATION: null維持・要確認表示 / CONFLICTING: 併記+要突合
- `example.invalid` URIは表示専用(リンク化・fetch禁止)
