import { withApi } from "@/server/handler";
import { approvalRequestSchema, requestApproval } from "@/server/services/caseService";

export const POST = withApi(
  async ({ req, user, params, correlationId }) => {
    const input = approvalRequestSchema.parse(await req.json());
    return requestApproval(user, params.caseId!, input, correlationId);
  },
  { status: 201 },
);
