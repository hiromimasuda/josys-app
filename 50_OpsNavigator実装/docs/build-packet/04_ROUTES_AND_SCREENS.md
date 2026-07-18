# 04_ROUTES_AND_SCREENS.md(G1生成)

- master: JOSYS-OPS-NAV-FABLE5-001 v1.0.1 / 実装結果の記録(詳細はGATE_1_REPORT.md §1)

| Route | 種別 | 仕様 |
|---|---|---|
| `/` | redirect→/home | — |
| `/home` | static | §5.2 |
| `/events` | static | §5.3 |
| `/events/[eventId]` | SSG×15 | §5.3 |
| `/operations` | static(client filter) | §5.6 |
| `/operations/[operationId]` | SSG×43 | §5.7 |
| `/cases` | static(client merge) | §5.5 |
| `/cases/new` | dynamic(searchParams) | §5.4 |
| `/cases/[caseId]` | SSG×5 | §5.5 |
| `/calendar` | static | §5.8 |
| `/ask` | static(client) | §5.9 |
| `/emergency` | static+SW precache | §13 |
| `/knowledge` | static | §5.10(閲覧のみ) |
| `/approvals` | static | 閲覧のみ |
| `/handover` | static | §5.11(構成のみ) |
| `/admin` | static(client role) | UIロール制御のみ |
| `/menu` | static | §5.1 mobile |
| `/sw.js`, `/manifest.webmanifest`, `/icons/*` | 静的資産 | §13/PWA |

API route: なし(G1はサーバーAPIを持たない。§11のAPIはG2で実装)
