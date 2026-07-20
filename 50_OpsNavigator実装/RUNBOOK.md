# RUNBOOK.md — ローカルDEMO運用手順(Gate 2)

対象: DEMO_ONLYのローカル環境のみ。本番運用手順ではない。

## 起動 / 停止

```bash
pnpm db:up                 # PostgreSQL(127.0.0.1:5432)起動
pnpm build && PORT=3111 pnpm start   # アプリ起動 → http://127.0.0.1:3111
# 停止: Ctrl+C(アプリ) / pnpm db:down(DB。データはvolumeに残る)
```

開発時は `pnpm dev`(ホットリロード)。

## 再seed(データ初期化)

```bash
pnpm db:seed
```

- `docs/input/04_SEED_BUNDLE.json` から全件入れ直す(既存のDEMOデータは削除される)
- 完了時に `seed OK: {"flows":11,"operations":43,...}` の件数検証が走る。不一致なら失敗する
- **integration / e2e テストはデータを変更するため、実行前に必ず再seedする**

## 完全リセット(スキーマから作り直し)

```bash
cd packages/db && pnpm exec prisma migrate reset --force   # DEMO DB専用。全データ削除+migration+seed
```

またはDBボリュームごと破棄:

```bash
docker compose down -v && pnpm db:up && pnpm db:migrate && pnpm db:seed
```

## バックアップ / 復元(DEMOデータ)

```bash
docker compose exec db pg_dump -U opsnav_demo opsnav_demo > /tmp/opsnav_demo.sql   # 取得
cat /tmp/opsnav_demo.sql | docker compose exec -T db psql -U opsnav_demo opsnav_demo  # 復元
```

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `Can't reach database server at 127.0.0.1:5432` | `pnpm db:up` 実行。Dockerデーモン未起動なら起動する(リモート検証環境ではdockerdを手動起動していた) |
| seedが `SEED_COUNT_MISMATCH` | `docs/input/` が改変されていないか `python3 tools/verify_packet.py` で確認 |
| APIが401 | `x-demo-user` ヘッダー(UIではユーザー切替)が必要。未知IDは401 |
| 完了ボタンが409 | 仕様どおりのガード。表示された不足(証跡種別/承認)を満たす |
| e2eが途中で失敗 | `pnpm db:seed` で状態を戻してから再実行 |
| pwshがない環境でのパケット検証 | `python3 tools/verify_packet.py`(同等検証) |

## 環境変数

- 実値: `packages/db/.env` / `apps/web/.env.local`(**gitignore対象・commit禁止**)
- 雛形: それぞれの `.env.example`
- 既定: `AI_ENABLED=false` / `EXTERNAL_WRITES_ENABLED=false` / `AI_PROVIDER=mock`(変更しない)
