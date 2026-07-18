import { EmptyState, Section } from "@/components/Section";

// §5.11 引継ぎ(Gate 1: 構成の提示のみ。受領・差戻し記録はGate 2)
export default function HandoverPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">引継ぎ</h1>

      <Section title="習熟段階">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>0〜1か月: 今日の情シス・代表A0/A1・次の30日を一人で回せる</li>
          <li>1〜3か月: 43業務・周期・例外・未確認事項を扱える</li>
          <li>3か月以降: 横断差分・統制・自動化資産・改善へ広げる</li>
        </ul>
      </Section>

      <Section title="No-Masudaテスト(受領テスト)の観点" tone="blue">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>シナリオと操作対象</li>
          <li>判断理由を説明できるか</li>
          <li>実動作の結果</li>
          <li>証跡が残っているか</li>
          <li>不足と差戻し内容</li>
          <li>受領 / 差戻しの記録</li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          「説明済み・資料作成済み」だけでは受領になりません。実動作・証跡・受領記録が必要です。
        </p>
      </Section>

      <Section title="受領・差戻しの記録">
        <EmptyState>
          受領チェック(AcceptanceCheck)の記録・差戻し管理はGate 2で実装します。Gate 1のウォークスルーはWALKTHROUGH_CHECKLIST.mdを使用してください。
        </EmptyState>
      </Section>
    </div>
  );
}
