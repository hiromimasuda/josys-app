import { withApi } from "@/server/handler";
import { completeCase, completeSchema } from "@/server/services/caseService";

export const POST = withApi(async ({ req, user, params, correlationId }) => {
  const body = await req.json().catch(() => ({}));
  const input = completeSchema.parse(body);
  return completeCase(user, params.caseId!, input, correlationId);
});
