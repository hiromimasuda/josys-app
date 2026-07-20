import { NextResponse } from "next/server";

// §11.4 エラー形式。内部スタック・SQL・秘密情報を本文に出さない。
export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function errorResponse(e: unknown, correlationId: string) {
  if (e instanceof ApiError) {
    return NextResponse.json(
      { error: { code: e.code, message: e.message, correlation_id: correlationId, details: e.details ?? {} } },
      { status: e.status },
    );
  }
  console.error(`[${correlationId}]`, e);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "内部エラーが発生しました。", correlation_id: correlationId, details: {} } },
    { status: 500 },
  );
}
