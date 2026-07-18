# GATE_1_REPORT.md — Clickable Prototype 実装報告

- Master: `JOSYS-OPS-NAV-FABLE5-001` v1.0.1 / Packet: `JOSYS-OPS-NAV-FABLE5-INPUT-001` v1.0.0
- 実施日: 2026-07-18
- **状態: Gate 1 implementation COMPLETE / Gate 1 human acceptance PENDING**
- 本レポートは技術完了の報告であり、人の受領(吉川さんのウォークスルー)を代替しない
- Gate 2へは進んでいない(コードはDB・サーバー保存・外部同期を含まない)

## 1. 実装した画面 / route一覧

| Route | 画面 | 仕様 | 備考 |
|---|---|---|---|
| `/` | → `/home` へredirect | — | |
| `/home` | 今日の情シス(7セクション順序どおり) | §5.2 | A0/R3・A1期限・承認待ち・失敗自動化(空)・次の30日・引継ぎ・要更新。全43業務表は非表示 |
| `/events` | 発生時アクション15カード | §5.3 | 全カードにリスク+PROPOSEDバッジ |
| `/events/[eventId]` | 入口詳細(15ページSSG) | §5.3 | まずすること/禁止/確認質問(一般ガイドラベル付)、関連業務、証跡、ケース作成ボタン |
| `/operations` | 業務43一覧 | §5.6 | 初任者モード(既定ON)・フロー/検索フィルタ。優先度は全行「要確認」表示 |
| `/operations/[operationId]` | 業務詳細(43ページSSG) | §5.7 | 15セクション構成。未同期項目は推測せず要確認表示 |
| `/cases` | ケース一覧(DEMO5件+ローカル下書き) | §5.5 | |
| `/cases/new` | 受付トリアージ(必須7項目) | §5.4 | 禁止入力の注意+秘密らしき文字列の保存ブロック。localStorage保存(DEMO) |
| `/cases/[caseId]` | ケース詳細(上部固定+7タブ) | §5.5 | R2/R3必須条件の警告、要突合表示、承認/証跡/例外の表示 |
| `/calendar` | 今日/次の30日 | §5.8 | 周期・年間ビューはGate 2表示のプレースホルダ |
| `/ask` | AI相談mock(固定9セクション順) | §5.9, §8.5 | 決定論mock。出典・確度・一般論ラベル分離 |
| `/emergency` | Emergency Pack | §13 | オフライン対応(SW)。役割名のみの連絡先。書き込みボタンなし |
| `/knowledge` | SourceRegistry閲覧 | §5.10 | stale/要突合/AI未承認の表示。検索はGate 2 |
| `/approvals` | 承認待ち・例外の閲覧 | — | 操作はGate 2 |
| `/handover` | 引継ぎ(構成・No-Masuda観点) | §5.11 | 記録はGate 2 |
| `/admin` | 管理(ロール制御デモ) | — | 非adminには権限なし表示。UIのみ(API強制はGate 2) |
| `/menu` | モバイル「その他」メニュー | §5.1 | |

ナビゲーション: §5.1どおり desktop10項目サイドバー / mobile下部5タブ + 緊急パック常設ボタン。

## 2. 11/43/15件数検証

- `python3 tools/verify_packet.py`: **PASS**(43チェック/失敗0。入力パケット無変更を再確認)
- unit `tests/unit/domain.test.ts`: 11 flows / 43 operations / 15 eventTemplates、ID一意・参照整合・優先度null維持・PROPOSED維持 — **PASS**
- アプリはmodule読込時に `validateSeed` を実行し、不整合時はbuild/起動が失敗する設計
- フッターに `11フロー / 43業務 / 15入口 OK` を常時表示(e2eで検証)

## 3. 3クリック到達確認(§16 Gate 1通過条件)

e2e `tests/e2e/three-click.spec.ts`(desktop/mobile両方) — **PASS**

```text
/home → [1]発生時アクション → [2]Wi-Fi・全社ネットワーク障害 → [3]業務1-1詳細
```

## 4. テスト実行結果

| ゲート | コマンド | 結果 |
|---|---|---|
| lint | `pnpm lint`(ESLint + next/core-web-vitals + next/typescript) | **PASS**(error 0 / warning 0) |
| typecheck | `pnpm typecheck`(tsc strict、3プロジェクト) | **PASS** |
| unit | `pnpm test:unit`(Vitest) | **PASS** 3ファイル / 17テスト |
| e2e | `pnpm test:e2e`(Playwright、desktop 1440x900 + mobile 390x844) | **PASS** 44/44 |
| パケット | `python3 tools/verify_packet.py` | **PASS** |

e2e内訳: 主要画面スモーク(ホーム優先表示・15カード・43件表示・AI分離表示・禁止入力ブロック・R3表示・要突合表示)×2形状、3クリック×2、オフラインEmergency Pack×2、**外部通信0件検証×2**(全16画面遷移+AI mock実行で127.0.0.1以外への発信0件)、スクリーンショット12画面×2形状。

## 5. desktop / mobileスクリーンショット

`screenshots/desktop/`・`screenshots/mobile/` に各12枚(home, events, event-detail-wifi, operations, operation-detail, cases, case-detail-r3, case-new, calendar, knowledge, emergency, ask-answer)。実ブラウザ(Chromium)で目視確認済み。モバイルの緊急パックボタン折返し不具合を発見・修正済み。

注: fullPageスクリーンショットでは固定下部ナビが本文中央に写り込むが、実表示では画面下部固定である(撮影方式の特性)。

## 6. 使用パッケージ(承認済みリストどおり・lockfile固定)

- runtime: next@15.5.20, react@19.2.7, react-dom@19.2.7, clsx@2.1.1
- dev: typescript@5.9.3, tailwindcss@4.3.3, @tailwindcss/postcss, postcss, eslint@9, eslint-config-next@15.5.20, @eslint/eslintrc, @types/*, vitest@2.1.9, @vitejs/plugin-react, jsdom, @testing-library/react, @testing-library/jest-dom, @playwright/test@1.61.1
- グローバルinstall 0件。ブラウザはプリインストールChromiumを使用(追加ダウンロード0)
- pnpm v10の既定でビルドスクリプト(esbuild/sharp/unrs-resolver)は未実行のまま動作確認済み

## 7. 統制事項の遵守

- `docs/input/` 変更0件(SHA-256全件一致を再確認)
- アプリruntime外部通信0件(e2eで機械検証)。telemetry無効・外部フォント/CDN/画像なし
- `example.invalid` URIは表示のみ(リンク化・fetchなし)
- 行別優先度A0〜D: 全43行null=「要確認」表示を維持(推測なし)。A0/A1画面はDEMO_ONLYケースのみで検証
- 15入口mapping: 全画面でPROPOSEDバッジ表示
- AI: 決定論mock(同一入力=同一出力をunitで検証)。外部AI未接続・APIキー不要・actionExecutionAllowed=false固定
- prompt injection fixture(KD-DEMO-006)を命令として扱うコードなし
- deploy・push・本番接続・実データ投入 0件

## 8. 変更ファイル一覧(Gate 1コミット)

```text
package.json / pnpm-workspace.yaml / pnpm-lock.yaml / tsconfig.base.json / .gitignore
vitest.config.ts / playwright.config.ts
packages/domain/ (types, seed読込+検証, セレクタ)
packages/ai/ (§8.5契約サブセット, 決定論mockProvider)
apps/web/ (Next.js App Router: 17 route, コンポーネント, PWA sw.js/manifest/icons)
tests/unit/ (3ファイル) / tests/e2e/ (5ファイル)
screenshots/desktop/ ×12 / screenshots/mobile/ ×12
GATE_1_REPORT.md / WALKTHROUGH_CHECKLIST.md / docs/build-packet/(G1派生文書)
```

## 9. 未実装・既知リスク・残課題

| # | 内容 | 対応予定 |
|---|---|---|
| 1 | サーバー保存・DB・RBACのAPI強制・AuditEvent・検索・承認操作・R2/R3完了ガードのサーバー実装 | Gate 2(計画どおり) |
| 2 | ケース作成はlocalStorage下書きのみ(端末内・DEMO) | Gate 2でDB化 |
| 3 | 業務詳細の手順・理由・正本リンクは未同期(要確認表示) | Gate 2 SourceRegistry/検索、Gate 3同期 |
| 4 | モバイル検証は幅ベースエミュレーション(390x844)。実機タッチ・iOS Safariでの確認は未実施 | Gate 1受領時に実機確認を推奨 |
| 5 | Playwright `isMobile` エミュレーションは固定ナビのヒットテストが不安定なため不使用(実レイアウトの問題ではない) | 記録のみ |
| 6 | PWAオフラインは一度アクセスしたページのキャッシュ+ `/emergency` precacheが対象 | Gate 2で対象を精査 |
| 7 | 15入口の初動ガイド文はすべて一般論ラベル付き(社内正本由来ではない) | Gate 3以降で正本突合 |
| 8 | packages/ui は分離せずapps/web/src/componentsに実装(依存最小化を優先。計画からの軽微な変更) | 必要ならGate 2で分離 |
| 9 | 成果物はローカルコミットのみ。push保留のためセッション消滅リスクあり(RK-02) | 人の確認後にpush指示を |

## 10. 次のステップ

1. 吉川さんが `WALKTHROUGH_CHECKLIST.md` で30〜45分のウォークスルーを実施し、受領/差戻しを記録する(D-14)
2. 受領後、同じセッションへ `docs/input/03C_GATE2_CONTINUE_PROMPT.txt` を投入するとGate 2を開始する
