import { seed, FIXED_NOW } from "./seed";
import type { DemoCase, EventTemplate, Flow, Operation, SourceAsset } from "./types";

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]));

export const flowById = byId(seed.flows);
export const operationById = byId(seed.operations);
export const eventById = byId(seed.eventTemplates);
export const userById = byId(seed.mockUsers);
export const sourceById = byId(seed.sourceAssets);
export const caseById = byId(seed.demoCases);

export const operationsByFlow = (flowId: string): Operation[] =>
  seed.operations.filter((o) => o.flowId === flowId);

export const eventsForOperation = (operationId: string): EventTemplate[] =>
  seed.eventTemplates.filter((e) => e.operationIds.includes(operationId));

export const casesForOperation = (operationId: string): DemoCase[] =>
  seed.demoCases.filter((c) => c.operationIds.includes(operationId));

export const approvalsByCase = (caseId: string) => seed.approvals.filter((a) => a.caseId === caseId);
export const evidenceByCase = (caseId: string) => seed.evidence.filter((e) => e.caseId === caseId);
export const exceptionsByCase = (caseId: string) => seed.exceptions.filter((x) => x.caseId === caseId);

// ホーム(§5.2)用セレクタ。demoOnlyのDEMOケースのみを対象にする。
export const homeSelectors = {
  a0Open: (): DemoCase[] =>
    seed.demoCases.filter((c) => c.operationalPriority === "A0" && c.status !== "COMPLETED"),
  r3Open: (): DemoCase[] => seed.demoCases.filter((c) => c.risk === "R3" && c.status !== "COMPLETED"),
  a1DueSoon: (): DemoCase[] =>
    seed.demoCases.filter((c) => {
      if (c.operationalPriority !== "A1" || c.status === "COMPLETED") return false;
      const due = new Date(c.dueAt).getTime();
      const horizon = FIXED_NOW.getTime() + 3 * 24 * 60 * 60 * 1000; // DEMO簡略: 3日以内(営業日計算はGate 2)
      return due <= horizon;
    }),
  pendingApprovals: () => seed.approvals.filter((a) => a.status === "PENDING"),
  next30Days: () =>
    [...seed.scheduleOccurrences].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
  knowledgeNeedsUpdate: (): SourceAsset[] =>
    seed.sourceAssets.filter((s) => s.status === "STALE" || s.status === "CONFLICTING"),
};

// 表示: UIはJST(UTC+9固定・DSTなし)。保存値はUTC ISOのまま(§14)。
export function formatJst(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())} JST`;
}

export function formatJstDate(iso: string): string {
  return formatJst(iso).slice(0, 10);
}

export const flowsOrdered: Flow[] = [...seed.flows].sort((a, b) => a.id.localeCompare(b.id));
