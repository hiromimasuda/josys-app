import { withApi } from "@/server/handler";
import { decideApproval, decisionSchema } from "@/server/services/caseService";

export const POST = withApi(async ({ req, user, params, correlationId }) => {
  const input = decisionSchema.parse(await req.json());
  return decideApproval(user, params.approvalId!, input, correlationId);
});
