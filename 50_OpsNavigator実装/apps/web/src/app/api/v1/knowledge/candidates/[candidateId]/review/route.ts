import { withApi } from "@/server/handler";
import { reviewCandidate, reviewSchema } from "@/server/services/knowledgeService";

export const POST = withApi(async ({ req, user, params, correlationId }) => {
  const input = reviewSchema.parse(await req.json());
  return reviewCandidate(user, params.candidateId!, input, correlationId);
});
