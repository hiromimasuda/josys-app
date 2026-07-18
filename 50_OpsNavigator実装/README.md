# 情シス Ops Navigator 実装ワークスペース

このフォルダは、Claude Fable 5でGate 0〜2を構築する専用の隔離ワークスペースです。現時点ではコード未生成です。

`CLAUDE.md` と `.claude/settings.json` が毎セッションの境界を固定し、input編集、秘密ファイル読取、WebFetch、危険なGit操作、グローバルinstallを拒否します。

## 推奨する渡し方

前提として、会社が利用を承認したClaude契約・アカウントを使います。未承認ならClaude Codeも起動せず、パケットのローカル検証までで停止します。

Claude Codeで、このフォルダを作業ディレクトリとして開始します。

先にパケットを検証します。

```powershell
Set-Location -LiteralPath 'C:\Users\LEGA241-\Documents\情シス業務\20_情シス君_外部委託・実務引継ぎ\50_OpsNavigator実装'
& '.\docs\input\08_VERIFY_PACKET.ps1'
```

`Status: PASS` を確認してからFable 5を起動します。

```powershell
$fableGate0Prompt = Get-Content -Raw -LiteralPath '.\docs\input\03A_GATE0_START_PROMPT.txt'
claude --model fable --effort high --permission-mode default --name 'ops-navigator-gate0' $fableGate0Prompt
```

`--permission-mode bypassPermissions` や `--dangerously-skip-permissions` は使用しません。

Gate 0の返却物を確認し、問題がなければ同じClaude Codeセッションへ次を入力します。

```text
次のファイルをGate 1の実行指示として読み、本文に従ってください: @docs/input/03B_GATE1_CONTINUE_PROMPT.txt
```

Gate 1完成後、吉川さんの30〜45分ウォークスルーを行います。画面と導線を受領した後だけ、同じセッションへ次を入力します。

```text
次のファイルをGate 2の実行指示として読み、本文に従ってください: @docs/input/03C_GATE2_CONTINUE_PROMPT.txt
```

## Claude.ai Projectへ渡す場合

会社で承認された非公開Projectだけを使用し、`docs/input/` の11ファイルを個別に追加します。最初のチャットへ `03A_GATE0_START_PROMPT.txt` を貼り付けます。

ただし、ローカルrepo、Docker、Playwright、テストまで構築しきる用途はClaude Codeを推奨します。承認されていない個人アカウントや保存条件不明の環境へは渡しません。

## Gate別の停止点

- Gate 0: パケット検証、実装計画、リスク、仕様対応表を返して停止
- Gate 1: クリック可能プロトタイプとdesktop/mobile確認後、人が受領
- Gate 2: Gate 1受領後にローカルMVP、DB、RBAC、検索、監査、テスト
- Gate 3以降: 別承認があるまで禁止

詳細は `docs/input/00_READ_ME_FIRST.md` を参照してください。
