import { withApi } from "@/server/handler";
import { searchKnowledge } from "@/server/services/searchService";

export const GET = withApi(async ({ req, user }) => {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return searchKnowledge(user, q);
});
