import { z } from "zod";
import { withApi } from "@/server/handler";
import { answerQuestion } from "@/server/services/aiService";

const schema = z.object({ question: z.string().min(1).max(1000) });

export const POST = withApi(async ({ req, user, correlationId }) => {
  const input = schema.parse(await req.json());
  return answerQuestion(user, input.question, correlationId);
});
