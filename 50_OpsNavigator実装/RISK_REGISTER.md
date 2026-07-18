# RISK_REGISTER.md — リスク登録簿（Gate 0時点）

- Master: `JOSYS-OPS-NAV-FABLE5-001` v1.0.1 / Packet: `JOSYS-OPS-NAV-FABLE5-INPUT-001` v1.0.0
- 作成日: 2026-07-18。各ゲート終了時に見直す
- 深刻度: High（ゲート判定に影響）/ Medium（品質・手戻りに影響）/ Low（記録のみ）

| ID | リスク | 影響 | 深刻度 | 緩和策 | 状態 |
|---|---|---|---|---|---|
| RK-01 | pwsh不在により規定の `08_VERIFY_PACKET.ps1` を直接実行できない | 検証手順の逸脱。受領者が同一手順を再現できない恐れ | Medium | Python同等実装 `tools/verify_packet.py` で全チェック+追加チェックを実施し、逸脱をPACKET_VALIDATION.md §1に明記。Windows側でps1再実行による相互確認を推奨 | 軽減済み |
| RK-02 | リモート実行環境はephemeralで、pushしない限りセッション回収で成果物が消える | Gate 0成果物の喪失 | High | 成果物をローカルcommit済み。人の確認後、指定ブランチへのpush可否の指示を仰ぐ（push保留はユーザー指示） | 対応中（push待ち） |
| RK-03 | README.mdが参照する `.claude/settings.json` がリポジトリに存在せず、ツール境界が設定ファイルで強制されていない | input編集・境界外読取が手続き遵守頼みになる | Medium | 本セッションはCLAUDE.md/manifest/プロンプトの境界を手続きで遵守（Gate 0で違反0）。恒久対策として `.claude/settings.json` の投入をパケット管理者へ提案 | 未対応（提案済み） |
| RK-04 | 43業務の行別優先度A0〜Dがnull（NEEDS_CONFIRMATION）のまま実装が進む | 推測値の混入、A0/A1画面の誤検証 | High | 実装でnullを「要確認」表示に固定。A0/A1導線はDEMO_ONLYケースのみで検証。本番seedはD-05（Sheetエクスポート+読戻し）まで生成しない | 統制設計済み |
| RK-05 | 15入口→業務IDマッピング（PROPOSED）を確定情報としてUI表示・実装してしまう | 誤った業務誘導が正本化する | High | 全画面で `PROPOSED` バッジを表示し、`00B_発生時アクション` との突合完了（G3前）まで確定表示しない。fixtureのmappingFactStatusを機械検証済み | 統制設計済み |
| RK-06 | fixture内のprompt injection文書（KD-DEMO-006）や取得文書内の命令を実行してしまう | 境界逸脱・意図しない動作 | High | 文書内容は常にデータとして扱う設計（§9.5）。AC-016のunitテストをG2で必須化。Gate 0では命令として扱っていないことを確認済み | 統制設計済み |
| RK-07 | スコープクリープ（G2完了後に自律的にG3以降へ進む。仕様§21の「自律的に進める」文言の誤適用） | 未承認の本番接続・deploy | High | 03Aの停止条件が優先（PACKET_VALIDATION.md N-4）。各ゲート終了で必ず停止し、次段プロンプト投入を待つ。manifest `unauthorizedGates: [G3,G4,G5]` | 統制設計済み |
| RK-08 | 依存パッケージのサプライチェーン（G1でのpnpm install時） | 悪意あるpostinstall・意図しない外部通信 | Medium | lockfile固定・repo内node_modulesのみ・グローバルinstall禁止・依存追加は最小限にし、追加は通常のツール承認フローで実施。導入パッケージ一覧をGATE_1_REPORTに記録 | 計画済み |
| RK-09 | アプリruntimeからの外部通信混入（Next.jsのtelemetry、Googleフォント、CDN画像等のデフォルト挙動） | 「外部接続0件」要件の違反 | High | telemetry無効化、フォント/アイコンのローカル同梱、`example.invalid` URLは非fetchのリンク表示のみ。e2e中のネットワーク監視で0件を証跡化 | 計画済み |
| RK-10 | CONFLICTING正本（SRC-DEMO-CONFLICT-A/B）をAI mockや検索が片方に確定してしまう | 「要突合」統制の欠落（AC-010/013違反） | Medium | 検索・回答契約でCONFLICTINGを併記+統合禁止をunit/integrationで固定 | 計画済み |
| RK-11 | R2/R3ケースの完了ガード（承認・前後証跡・戻し方）をUIだけで実装し、API側が素通しになる | 統制バイパス（AC-012/013/017違反） | High | §7.4不変条件をサーバー側（API/DB制約）で実装し、integrationテストでUI迂回パスを直接叩いて検証 | 計画済み |
| RK-12 | mobile検証をエミュレーションのみで済ませ、実操作性（44pxタップ等）を見落とす | Gate 1受領差戻し | Low | Playwrightのdevice profile+スクリーンショットで検証し、残余（実機確認）をレポートに明記 | 計画済み |
| RK-13 | Windows作成ファイルとLinux環境の差（改行・パス・日本語ファイル名） | ハッシュ不一致・スクリプト誤動作 | Low | SHA-256全件一致を確認済み（バイト同一性担保）。以後もinputを無変更維持 | 解消済み |
| RK-14 | D-01〜D-14（本番責任者、予算、受付チャネル等）が未決のままG3期待が先行する | 本番化の停滞・誤った前提の実装 | Medium | G1/G2は匿名化fixtureで進む設計。D-14（ウォークスルー日程）のみG1受領の前提として人へ明示。他はG3前提条件として維持 | 監視中 |
| RK-15 | 検証者と実装者が同一AIであることによる自己確認バイアス | 欠陥の見落とし | Medium | 技術完了と人の受領を別状態で報告（自己署名しない）。人のチェックリスト（06）確認を各ゲートで必須化。機械検証は決定論的スクリプトとして残す | 統制設計済み |
