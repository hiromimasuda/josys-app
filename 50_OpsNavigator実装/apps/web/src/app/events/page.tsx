import Link from "next/link";
import { seed } from "@ops/domain";
import { FactStatusBadge, RiskBadge } from "@/components/badges";

// §5.3 発生時アクション: 15カード
export default function EventsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">発生時アクション</h1>
      <p className="text-sm text-slate-600">
        起きたことを選んでください。関連業務への対応付けは
        <span className="mx-1 font-semibold">提案(PROPOSED)</span>
        であり、正本(00B_発生時アクション)との突合前です。
      </p>
      <ul data-testid="event-cards" className="grid gap-3 sm:grid-cols-2">
        {seed.eventTemplates.map((ev) => (
          <li key={ev.id}>
            <Link
              href={`/events/${ev.id}`}
              className="tap flex h-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:bg-blue-50/40"
            >
              <span className="text-base font-bold text-slate-900">{ev.name}</span>
              <span className="flex flex-wrap items-center gap-2">
                <RiskBadge risk={ev.initialRisk} />
                <FactStatusBadge status={ev.mappingFactStatus} />
              </span>
              {ev.riskNote && <span className="text-xs text-slate-600">{ev.riskNote}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
