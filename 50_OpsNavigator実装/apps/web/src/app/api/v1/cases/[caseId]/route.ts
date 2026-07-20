import { z } from "zod";
import { withApi } from "@/server/handler";
import { getCase, updateCaseStatus } from "@/server/services/caseService";

export const GET = withApi(async ({ user, params }) => getCase(user, params.caseId!));

const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_APPROVAL", "BLOCKED", "COMPLETED"]),
});

export const PATCH = withApi(async ({ req, user, params, correlationId }) => {
  const input = patchSchema.parse(await req.json());
  return updateCaseStatus(user, params.caseId!, input.status, correlationId);
});
