import { withApi } from "@/server/handler";
import { addEvidence, evidenceSchema } from "@/server/services/caseService";

export const POST = withApi(
  async ({ req, user, params, correlationId }) => {
    const input = evidenceSchema.parse(await req.json());
    return addEvidence(user, params.caseId!, input, correlationId);
  },
  { status: 201 },
);
