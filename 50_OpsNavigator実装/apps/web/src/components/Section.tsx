import type { ReactNode } from "react";
import clsx from "clsx";

export function Section({
  title,
  children,
  tone = "neutral",
  id,
}: {
  title: ReactNode;
  children: ReactNode;
  tone?: "neutral" | "red" | "amber" | "purple" | "blue";
  id?: string;
}) {
  const tones = {
    neutral: "border-slate-200",
    red: "border-red-300",
    amber: "border-amber-300",
    purple: "border-purple-300",
    blue: "border-blue-200",
  } as const;
  return (
    <section id={id} className={clsx("rounded-xl border bg-white p-4 shadow-sm", tones[tone])}>
      <h2 className="mb-3 text-base font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
      {children}
    </p>
  );
}
