import { withApi } from "@/server/handler";
import { acceptanceSchema, listAcceptance, recordAcceptance } from "@/server/services/acceptanceService";

export const GET = withApi(async ({ user }) => listAcceptance(user));

export const POST = withApi(
  async ({ req, user, correlationId }) => {
    const input = acceptanceSchema.parse(await req.json());
    return recordAcceptance(user, input, correlationId);
  },
  { status: 201 },
);
