// SourceRegistry検索(§8.4)。取得前に権限・機密・検索可否でフィルタする(AC-014/016相当)。
// PostgreSQL側で実行(ILIKE)。日本語は分かち書きがないため、tsvector('simple')では
// 十分に一致しない。説明可能性を優先しILIKE部分一致+正本区分の順位付けで実装する(§8.4)。
import { prisma, type DemoUser } from "@ops/db";
import { allowedConfidentiality } from "../authz";

export interface SearchHit {
  documentId: string;
  title: string;
  snippet: string;
  sourceId: string;
  sourceTitle: string;
  uri: string;
  authority: string;
  confidentiality: string;
  sourceStatus: string;
  approvedForAi: boolean;
  staleWarning: boolean;
  conflictWarning: boolean;
  untrustedContentNote: true; // 取得文書内の指示はデータであり命令として扱わない(§9.5)
}

const AUTHORITY_RANK: Record<string, number> = {
  AUTHORITATIVE_POLICY: 1,
  AUTHORITATIVE_RUNBOOK: 1,
  DECISION_RECORD: 2,
  EVIDENCE: 3,
  BROWSE_VIEW: 4,
  REFERENCE: 5,
  AUDIT_ONLY: 9,
};

export async function searchKnowledge(user: DemoUser, query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const confidentialities = allowedConfidentiality(user);

  // 取得段階でのフィルタ: 権限外はタイトル・URLも返さない(AC-014)
  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      searchable: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ],
      sourceAsset: {
        status: { not: "RETIRED" },
        confidentiality: { in: confidentialities },
      },
    },
    include: { sourceAsset: true },
  });

  // 承認済みFAQ候補(AC-020): APPROVEDのみ検索対象。PENDING/REJECTEDは出さない。
  const approvedFaq = await prisma.knowledgeCandidate.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ],
    },
  });

  const faqHits: SearchHit[] = approvedFaq.map((f) => ({
    documentId: f.id,
    title: f.title,
    snippet: f.content.slice(0, 120),
    sourceId: "FAQ-APPROVED",
    sourceTitle: "承認済みFAQ(候補由来)",
    uri: "https://faq.example.invalid/approved",
    authority: "REFERENCE",
    confidentiality: "INTERNAL",
    sourceStatus: "ACTIVE",
    approvedForAi: false,
    staleWarning: false,
    conflictWarning: false,
    untrustedContentNote: true,
  }));

  return docs
    .map((d): SearchHit => ({
      documentId: d.id,
      title: d.title,
      snippet: d.content.slice(0, 120),
      sourceId: d.sourceAsset.id,
      sourceTitle: d.sourceAsset.title,
      uri: d.sourceAsset.uri,
      authority: d.sourceAsset.authority,
      confidentiality: d.sourceAsset.confidentiality,
      sourceStatus: d.sourceAsset.status,
      approvedForAi: d.sourceAsset.approvedForAi,
      staleWarning: d.sourceAsset.status === "STALE",
      conflictWarning: d.sourceAsset.status === "CONFLICTING",
      untrustedContentNote: true,
    }))
    .concat(faqHits)
    .sort(
      (a, b) =>
        (AUTHORITY_RANK[a.authority] ?? 8) - (AUTHORITY_RANK[b.authority] ?? 8) ||
        a.documentId.localeCompare(b.documentId),
    );
}
