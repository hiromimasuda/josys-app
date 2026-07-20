import { withApi } from "@/server/handler";
import { candidateSchema, createCandidate, listCandidates } from "@/server/services/knowledgeService";

export const GET = withApi(async ({ user }) => listCandidates(user));

export const POST = withApi(
  async ({ req, user, correlationId }) => {
    const input = candidateSchema.parse(await req.json());
    return createCandidate(user, input, correlationId);
  },
  { status: 201 },
);
