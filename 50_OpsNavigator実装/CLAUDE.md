# 情シス Ops Navigator — Claude Code/Fable 5 実装ルール

## 現在地

- 状態: `HANDOFF_READY / IMPLEMENTATION_NOT_STARTED`
- 初期承認範囲: `Gate 0のみ`
- Gate 1: `docs/input/03B_GATE1_CONTINUE_PROMPT.txt` が明示的に投入された後だけ実行可能
- Gate 2: Gate 1の人による画面確認後、`docs/input/03C_GATE2_CONTINUE_PROMPT.txt` が投入された後だけ実行可能
- Gate 3〜5: 未承認。実装スタブと手順書を超えて進めない

## 最初に読む順番

1. `docs/input/00_READ_ME_FIRST.md`
2. `docs/input/01_MANIFEST.json`
3. `docs/input/02_MASTER_SPEC.snapshot.md`
4. `docs/input/05_SEED_SCHEMA.json`
5. `docs/input/04_SEED_BUNDLE.json`
6. `docs/input/06_GATE_ACCEPTANCE_CHECKLIST.md`
7. `docs/input/07_SHA256SUMS.txt`
8. `docs/input/08_VERIFY_PACKET.ps1`

`02_MASTER_SPEC.snapshot.md` が製品仕様の正本スナップショットである。補助ファイルと矛盾する場合は、勝手に統合せず `CONFLICTING` として報告する。

## 読み書き境界

- 読み取りは、この実装フォルダ内だけに限定する。
- `docs/input/` は入力専用。編集、整形、移動、削除しない。
- 書き込みは、この実装フォルダ内の `docs/input/` 以外だけに限定する。
- 親の `情シス業務`、PMコア、引継ぎ設計、他PJを探索・編集しない。
- `.env`、秘密鍵、APIキー、Token、Cookie、credential、個人情報、生ログ、契約原本、監査原本を読まない。
- `git reset`、`git clean`、`git add -A`、全体一括format、push、PR、本番deployを行わない。

## 実装境界

- 本番Google Workspace、Drive、Sheets、Slack、GAS、Salesforce、SaaS、外部AIへ接続しない。
- AIは決定論的mockで実装し、APIキーを要求しない。
- Action Runnerは `DISABLED` のスタブだけにする。
- 日常優先度A0〜Dの行別値がnullの場合は推測しない。DEMOケースだけで画面を検証する。
- 15入口の関連業務マッピングは `PROPOSED` として表示する。
- R2/R3は、承認と証跡なしで完了状態へ遷移させない。
- 依存パッケージはローカルrepo内だけに追加する。グローバルinstallは禁止し、ネットワーク利用はClaude Codeの通常承認に従う。
- アプリ実行時の外部通信、telemetry、外部画像/CDN読み込みは無効にする。

## 品質

- Gate 0の最初に `pwsh -File docs/input/08_VERIFY_PACKET.ps1` を実行する。
- `11 flows / 43 operations / 15 event templates` を機械検証する。
- AC-001〜AC-024をテストまたは手動証跡へ対応付ける。
- Fable自身は人の受領へ署名しない。技術完了と人の受領を別状態で報告する。
- lint、typecheck、unit、integration、e2eを実行する。
- desktop/mobileを実ブラウザで確認し、スクリーンショットを保存する。
- 失敗、未実装、要確認、外部接続未実施を隠さない。
