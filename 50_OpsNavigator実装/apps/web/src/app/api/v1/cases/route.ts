import { withApi } from "@/server/handler";
import { createCase, createCaseSchema, listCases } from "@/server/services/caseService";

export const GET = withApi(async ({ user }) => listCases(user));

export const POST = withApi(
  async ({ req, user, correlationId }) => {
    const input = createCaseSchema.parse(await req.json());
    return createCase(user, input, correlationId);
  },
  { status: 201 },
);
