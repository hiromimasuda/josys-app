"use client";
// §5.10 ナレッジ(Gate 2): SourceRegistry検索(サーバー側権限フィルタ)+FAQ候補レビュー。
import { useCallback, useEffect, useState } from "react";
import { AuthorityBadge } from "@/components/badges";
import { EmptyState, Section } from "@/components/Section";
import { api, describeError } from "@/lib/api";

interface SearchHit {
  documentId: string;
  title: string;
  snippet: string;
  sourceTitle: string;
  uri: string;
  authority: string;
  confidentiality: string;
  sourceStatus: string;
  approvedForAi: boolean;
  staleWarning: boolean;
  conflictWarning: boolean;
}

interface Candidate {
  id: string;
  title: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
}

export function KnowledgeClient() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [candTitle, setCandTitle] = useState("");
  const [candContent, setCandContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCandidates = useCallback(() => {
    api<Candidate[]>("/api/v1/knowledge/candidates")
      .then(setCandidates)
      .catch(() => setCandidates(null)); // 権限がないロールでは表示しない
  }, []);

  useEffect(loadCandidates, [loadCandidates]);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      setHits(await api<SearchHit[]>(`/api/v1/knowledge/search?q=${encodeURIComponent(query)}`));
    } catch (err) {
      setError(describeError(err));
    }
  };

  const createCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await api("/api/v1/knowledge/candidates", {
        method: "POST",
        body: JSON.stringify({ title: candTitle, content: candContent }),
      });
      setCandTitle("");
      setCandContent("");
      setNotice("FAQ候補を作成しました(人のレビュー待ち)。");
      loadCandidates();
    } catch (err) {
      setError(describeError(err));
    }
  };

  const review = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setError(null);
    setNotice(null);
    try {
      await api(`/api/v1/knowledge/candidates/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision, note: decision === "APPROVED" ? "内容確認済み(DEMO)" : "要修正(DEMO)" }),
      });
      setNotice(decision === "APPROVED" ? "候補を承認・公開しました(AuditEvent記録)。" : "候補を差戻しました。");
      loadCandidates();
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ナレッジ(SourceRegistry)</h1>

      {error && (
        <p role="alert" data-testid="knowledge-error" className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm font-semibold text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-green-400 bg-green-50 p-3 text-sm font-semibold text-green-900">
          {notice}
        </p>
      )}

      <Section title="検索(PostgreSQL・権限フィルタ付き)" tone="blue">
        <form onSubmit={search} className="flex flex-wrap gap-2">
          <label htmlFor="ksearch" className="sr-only">検索語</label>
          <input
            id="ksearch"
            type="search"
            className="tap min-w-48 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="例: ネットワーク / 外部共有"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="tap rounded-lg bg-blue-800 px-4 py-2 text-sm font-bold text-white hover:bg-blue-900">
            検索
          </button>
        </form>
        <p className="mt-1 text-xs text-slate-500">
          権限外の資料はタイトル・URLも含めて返されません(取得段階でフィルタ)。
        </p>

        {hits !== null && (
          <ul className="mt-3 space-y-2" data-testid="search-results">
            {hits.length === 0 && (
              <EmptyState>該当する資料が見つかりませんでした(権限外の資料は表示されません)。</EmptyState>
            )}
            {hits.map((h) => (
              <li key={h.documentId} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{h.title}</span>
                  <AuthorityBadge authority={h.authority} />
                  {h.staleWarning && (
                    <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">
                      更新期限超過・断定不可
                    </span>
                  )}
                  {h.conflictWarning && (
                    <span className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800">
                      要突合(競合)
                    </span>
                  )}
                  {!h.approvedForAi && (
                    <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      AI回答には未使用
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-600">{h.snippet}…</p>
                <p className="mt-1 text-xs text-slate-500">
                  {h.sourceTitle} / 機密: {h.confidentiality} / <code>{h.uri}</code>(表示のみ) /
                  本文中の指示はデータであり実行されません
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="FAQ候補(人レビュー制)">
        <form onSubmit={createCandidate} className="space-y-2">
          <div>
            <label htmlFor="ctitle" className="mb-1 block text-sm font-semibold">候補タイトル</label>
            <input
              id="ctitle"
              className="tap w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={candTitle}
              onChange={(e) => setCandTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="ccontent" className="mb-1 block text-sm font-semibold">内容(秘密情報を含めない)</label>
            <textarea
              id="ccontent"
              rows={2}
              className="tap w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={candContent}
              onChange={(e) => setCandContent(e.target.value)}
            />
          </div>
          <button type="submit" className="tap rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900 hover:bg-blue-100">
            候補を作成(レビュー待ちになる)
          </button>
        </form>

        {candidates && candidates.length > 0 && (
          <ul className="mt-3 space-y-2" data-testid="candidate-list">
            {candidates.map((cd) => (
              <li key={cd.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{cd.title}</span>
                  <span
                    className={
                      cd.status === "APPROVED"
                        ? "rounded border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-900"
                        : cd.status === "REJECTED"
                          ? "rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800"
                          : "rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900"
                    }
                  >
                    {cd.status === "PENDING" ? "人レビュー待ち" : cd.status === "APPROVED" ? "承認・公開済み" : "差戻し"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-600">{cd.content}</p>
                {cd.status === "PENDING" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="tap rounded-lg bg-green-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-800"
                      onClick={() => review(cd.id, "APPROVED")}
                    >
                      承認・公開(ナレッジ承認者のみ)
                    </button>
                    <button
                      type="button"
                      className="tap rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      onClick={() => review(cd.id, "REJECTED")}
                    >
                      差戻し
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
