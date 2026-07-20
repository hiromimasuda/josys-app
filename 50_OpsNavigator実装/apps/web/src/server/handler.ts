import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { DemoUser } from "@ops/db";
import { newCorrelationId } from "./audit";
import { ApiError, errorResponse } from "./errors";
import { resolveUser } from "./authz";

type Handler<T> = (args: {
  req: Request;
  params: Record<string, string>;
  user: DemoUser;
  correlationId: string;
}) => Promise<T>;

// 全API共通: mock auth解決 → 実行 → §11.4形式のエラー整形。
// 第2引数の型はNext.jsのRouteContext検証に合わせる(動的routeではparamsが渡る)。
export function withApi<T>(handler: Handler<T>, init?: { status?: number }) {
  return async (req: Request, ctx: { params: Promise<object> }) => {
    const correlationId = newCorrelationId();
    try {
      const user = await resolveUser(req);
      const params = (ctx?.params ? await ctx.params : {}) as Record<string, string>;
      const data = await handler({ req, params, user, correlationId });
      return NextResponse.json({ data, correlation_id: correlationId }, { status: init?.status ?? 200 });
    } catch (e) {
      if (e instanceof ZodError) {
        return errorResponse(
          new ApiError("VALIDATION_ERROR", 400, "入力内容が要件を満たしていません。", {
            issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          }),
          correlationId,
        );
      }
      return errorResponse(e, correlationId);
    }
  };
}
