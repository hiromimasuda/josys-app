# Fable 5 Input Packet — READ ME FIRST

- Packet ID: `JOSYS-OPS-NAV-FABLE5-INPUT-001`
- Product: `情シス Ops Navigator`
- Purpose: Gate 0〜2の安全なローカル構築
- Status: `READY_FOR_GATE_0`

## 1. このパケットの役割

この `docs/input/` はFable 5への固定入力です。Fableが実装中に生成する `docs/build-packet/` とは別物です。

- 入力パケット: 人が承認した構築前提。変更禁止
- build packet: FableがGate 0で生成する派生成果物
- 実装コード: 親の実装フォルダ内へ生成
- 製品仕様の正本: `02_MASTER_SPEC.snapshot.md`

入力と生成物を混ぜず、二重正本を作りません。

## 2. 読み順

1. `01_MANIFEST.json`
2. `02_MASTER_SPEC.snapshot.md`
3. `05_SEED_SCHEMA.json`
4. `04_SEED_BUNDLE.json`
5. `06_GATE_ACCEPTANCE_CHECKLIST.md`
6. `07_SHA256SUMS.txt`
7. `08_VERIFY_PACKET.ps1`
8. `03A_GATE0_START_PROMPT.txt`

Gate 0承認後だけ `03B_GATE1_CONTINUE_PROMPT.txt` を使います。Gate 1の人による受領後だけ `03C_GATE2_CONTINUE_PROMPT.txt` を使います。

## 3. 渡すファイル

実行前に、会社がClaude/Fable 5の契約、アカウント、保存・学習条件を承認していることを確認します。未確認ならClaude CodeもClaude.aiも起動せず、このパケットのローカル保管とpreflightだけで停止します。

Claude Codeでは、この実装フォルダをそのまま開きます。Claude.ai Projectへ移す場合は、次の11ファイルだけを個別に追加します。

1. `00_READ_ME_FIRST.md`
2. `01_MANIFEST.json`
3. `02_MASTER_SPEC.snapshot.md`
4. `03A_GATE0_START_PROMPT.txt`
5. `03B_GATE1_CONTINUE_PROMPT.txt`
6. `03C_GATE2_CONTINUE_PROMPT.txt`
7. `04_SEED_BUNDLE.json`
8. `05_SEED_SCHEMA.json`
9. `06_GATE_ACCEPTANCE_CHECKLIST.md`
10. `07_SHA256SUMS.txt`
11. `08_VERIFY_PACKET.ps1`

ワークスペース全体、17件の参照原本、生ログ、Spreadsheetエクスポート、個人情報、秘密情報は追加しません。

## 4. 3段階で渡す

### 第1段階: Gate 0

`03A_GATE0_START_PROMPT.txt` を最初の指示として投入します。Fableは次を作り、停止します。

- `PACKET_VALIDATION.md`
- `IMPLEMENTATION_PLAN.md`
- `RISK_REGISTER.md`
- `SPEC_TRACEABILITY.md`

人が `06_GATE_ACCEPTANCE_CHECKLIST.md` に沿って確認します。

### 第2段階: Gate 1

Gate 0が合格した後、同じセッションへ `03B_GATE1_CONTINUE_PROMPT.txt` を投入します。Fableはクリック可能プロトタイプを作って停止します。吉川さんが代表シナリオを30〜45分で確認し、受領または差戻しを記録します。

### 第3段階: Gate 2

Gate 1を人が受領した後だけ、同じセッションへ `03C_GATE2_CONTINUE_PROMPT.txt` を投入します。FableはローカルMVPを構築し、Gate 3へ進まず停止します。

## 5. 即時停止条件

- SHA-256不一致
- 11/43/15の件数不一致、ID重複、参照切れ
- `CONFIRMED / PROPOSED / NEEDS_CONFIRMATION / CONFLICTING` の混同
- inputフォルダ外の元業務資料が必要になった
- 実名、生データ、secret、credentialを要求した
- 本番API、外部AI、外部送信、deploy、権限変更を要求した
- Gate 3以降へ進もうとした
- 入力ファイルを変更しようとした

停止時は推測で補わず、`BLOCKER_REPORT.md` に不足、影響、安全な代替を記録します。

## 6. seedの扱い

- `04_SEED_BUNDLE.json` は完全合成・匿名化fixtureです。
- 43業務名と11フロー名は現行設計由来です。
- 行別A0〜Dは正本Sheetのエクスポート未同梱のためnullです。
- ホーム画面のA0/A1表示は `DEMO_ONLY` ケースで確認します。
- 15入口と業務IDの関連は `PROPOSED` です。
- `example.invalid` のURLやメールは外部取得しません。

## 7. 完了の受け取り方

Gate 2の完了は「画面がある」だけでは認めません。起動手順、テスト結果、AC-001〜024対応表、desktop/mobileスクリーンショット、外部接続0件、`DEPLOYMENT_NOT_EXECUTED.md` を受領して判定します。Fableが主張できるのは技術完了までで、人の業務受領は別途必要です。
