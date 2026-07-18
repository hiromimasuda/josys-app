# build packet 生成計画と文書責任（Gate 0定義）

- 正本: `docs/input/02_MASTER_SPEC.snapshot.md`（JOSYS-OPS-NAV-FABLE5-001 v1.0.1）
- 方針: **仕様本文を複製しない。** 各派生ファイルは仕様の章・IDを参照し、実装に必要な決定・差分・対応関係だけを持つ。矛盾を見つけた場合は統合せず `CONFLICTING` として記録し、該当作業を停止する
- 全ファイルにmaster文書ID・版・生成ゲートをヘッダとして必須記載する

## 生成計画（ファイル別の責任定義）

| ファイル | 生成ゲート | 内容の責任範囲 | 参照する正本箇所 |
|---|---|---|---|
| 00_MANIFEST.yaml | G0（済） | パケット制御・禁止事項・計画一覧 | §20.2 |
| 01_GENERATION_PLAN.md | G0（済・本書） | 生成計画と文書責任の定義 | §20.1, 03A |
| 01_BUILD_BRIEF.md | G1 | 実装の目的・スコープ・非スコープの1枚要約（新規記述のみ） | §0, §2, §16 |
| 02_PRODUCT_REQUIREMENTS.md | G1 | 画面・機能要求の実装向け整理（章参照+実装決定のみ） | §5, §12, §13 |
| 03_DOMAIN_MODEL.yaml | G1 | 実装した型・enum・エンティティの機械可読定義（コードが正） | §6.4, §7 |
| 04_ROUTES_AND_SCREENS.md | G1 | 実装route一覧と画面対応（実装結果の記録） | §5, §11 |
| 05_WORKFLOWS_AND_STATE_MACHINES.md | G2 | 状態遷移・不変条件の実装仕様（サーバー側検証と対応） | §2.2, §7.4 |
| 06_SECURITY_RBAC_DATA_BOUNDARIES.md | G2 | RBAC実装・機密境界・非保存データの実装記録 | §3, §9 |
| 07_AI_ASSISTANT_POLICY.md | G2 | AI mockの回答契約・分類・禁止動作の実装記録 | §8 |
| 08_SOURCE_TRACEABILITY.csv | G2 | 実装要素→仕様章→テストのCSV対応表 | §17, §22 |
| 09_ACCEPTANCE_TESTS.md | G2 | AC-001〜024の実テスト対応と結果参照 | §17.1, 06チェックリスト |
| 10_IMPLEMENTATION_PHASES.md | G1 | 実装順序と各フェーズの完了条件（IMPLEMENTATION_PLAN.mdから実装確定分を反映） | §16, §21実装順 |
| 11_FABLE_BUILD_PROMPT.txt | G2 | 再現用の実装指示記録。冒頭に「単独使用禁止。03A/03B/03Cが正」と明記 | §21 |

## fixtures生成規則（G1）

- 入力: `docs/input/04_SEED_BUNDLE.json` のみ（読み取り専用）
- 変換: 表示用の形へ再構成するのみ。値の追加・推測・補完をしない
  - `operationalPriority` のnullはnullのまま
  - `mappingFactStatus: PROPOSED` を落とさない
  - `demoOnly` / `synthetic` フラグを全件維持
- 生成後検証: 11/43/15件数・ID一意・参照整合を build時に機械検証（失敗時はbuildを落とす）

## 更新規則

- 派生ファイルは実装が変わったゲートでのみ更新する
- 入力パケット（docs/input/）が更新された場合は、SHA-256再検証 → PACKET_VALIDATION.md改訂 → 影響する派生ファイルの改訂、の順で行う
