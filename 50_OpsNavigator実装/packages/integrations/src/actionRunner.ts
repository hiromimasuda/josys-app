// ActionRunner: MVPではDISABLEDスタブのみ(§10.4 / manifest DISABLED_STUB_ONLY)。
// いかなる入力でも実行を拒否する。外部書き込みは存在しない。
export interface ActionRequest {
  action: string;
  target: string;
}

export interface ActionPreview {
  allowed: false;
  reason: string;
}

export class DisabledActionRunner {
  readonly mode = "DISABLED" as const;

  async preview(_input: ActionRequest): Promise<ActionPreview> {
    return {
      allowed: false,
      reason: "Action RunnerはMVPでは無効です(EXTERNAL_WRITES_ENABLED=false)。実行連携はGate 5の別承認が必要です。",
    };
  }

  async executeApproved(_input: ActionRequest): Promise<never> {
    throw new Error("ACTION_RUNNER_DISABLED: 外部実行はこのビルドでは常に拒否されます。");
  }
}

export const actionRunner = new DisabledActionRunner();
