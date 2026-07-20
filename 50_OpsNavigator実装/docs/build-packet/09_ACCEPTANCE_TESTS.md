# 09_ACCEPTANCE_TESTS.md(G2生成)

- 正本対応表は実装ルートの `SPEC_IMPLEMENTATION_MATRIX.md`(AC-001〜024の判定と証跡)
- テスト実行結果は `TEST_REPORT.md`
- 本書は場所の索引のみ(内容を二重化しない)

| 種別 | 場所 | 件数 |
|---|---|---:|
| unit | tests/unit/*.test.ts | 17 |
| integration(実DB) | tests/integration/*.test.ts | 23 |
| e2e(実ブラウザ×2形状) | tests/e2e/*.spec.ts | 60 |
| 入力パケット機械検証 | tools/verify_packet.py | 43チェック |
| 人の受入 | docs/input/06_GATE_ACCEPTANCE_CHECKLIST.md Gate 2欄 | 人が実施 |
