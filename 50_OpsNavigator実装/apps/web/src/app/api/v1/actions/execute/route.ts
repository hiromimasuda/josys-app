import { actionRunner } from "@ops/integrations";
import { ApiError } from "@/server/errors";
import { withApi } from "@/server/handler";

// Action Runner: 常に拒否(DISABLED_STUB_ONLY)。外部書き込みはこのビルドに存在しない。
export const POST = withApi(async () => {
  const preview = await actionRunner.preview({ action: "any", target: "any" });
  throw new ApiError("ACTION_RUNNER_DISABLED", 403, preview.reason, { mode: actionRunner.mode });
});
