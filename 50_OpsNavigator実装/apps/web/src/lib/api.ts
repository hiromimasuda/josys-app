"use client";
// APIクライアント。mock authのDEMOユーザーIDをヘッダーで送る。
// 認可はサーバー側で強制される(このヘッダーはUI都合の識別のみ)。

export interface ApiErrorBody {
  code: string;
  message: string;
  correlation_id: string;
  details: Record<string, unknown>;
}

export class ApiClientError extends Error {
  constructor(public body: ApiErrorBody, public status: number) {
    super(body.message);
  }
}

function currentUserId(): string {
  return window.localStorage.getItem("opsnav.mockUserId") ?? "USR-DEMO-002";
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-demo-user": currentUserId(),
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err: ApiErrorBody = body?.error ?? {
      code: "UNKNOWN",
      message: `APIエラー(${res.status})`,
      correlation_id: "-",
      details: {},
    };
    throw new ApiClientError(err, res.status);
  }
  return body.data as T;
}

export function describeError(e: unknown): string {
  if (e instanceof ApiClientError) {
    const details = e.body.details ?? {};
    const extra = Object.keys(details).length > 0 ? ` (${JSON.stringify(details)})` : "";
    return `${e.body.message}${extra} [${e.body.code}]`;
  }
  return e instanceof Error ? e.message : String(e);
}
