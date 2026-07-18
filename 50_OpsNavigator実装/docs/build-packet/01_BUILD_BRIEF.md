# 01_BUILD_BRIEF.md(G1生成)

- master: JOSYS-OPS-NAV-FABLE5-001 v1.0.1 / 生成ゲート: Gate 1 / 正本は仕様snapshot(本書は参照のみ)

## 目的(§0参照)

既存正本を置き換えず、「起きたこと → 最初の安全な行動 → 判断者 → 手順 → 証跡 → 完了/引継ぎ」へ
案内する薄い社内Webアプリを構築する。Gate 1はクリック可能プロトタイプ。

## スコープ(G1)

- 匿名化fixture(04_SEED_BUNDLE)のみ・mock auth・決定論AI mock・Emergency Pack
- 画面: home / events / operations / cases / calendar / ask / emergency + 閲覧系スタブ

## 非スコープ(G1)

- DB・サーバー保存・RBACのAPI強制・検索・AuditEvent(→G2)
- 本番認証・外部同期・外部AI・deploy(→G3以降、未承認)

## 禁止(§9.1・manifest mustNotBecome)

従業員マスタ化 / credential保存 / 契約原本保存 / 生ログ収集 / 自律実行ツール化
