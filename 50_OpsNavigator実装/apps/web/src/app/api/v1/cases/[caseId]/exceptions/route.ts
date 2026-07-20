import { withApi } from "@/server/handler";
import { addException, exceptionSchema } from "@/server/services/caseService";

export const POST = withApi(
  async ({ req, user, params, correlationId }) => {
    const input = exceptionSchema.parse(await req.json());
    return addException(user, params.caseId!, input, correlationId);
  },
  { status: 201 },
);
