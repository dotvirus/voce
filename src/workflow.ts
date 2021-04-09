import { IHaxanResponse } from "haxan";

import { IRunnerContext } from "./runner";
import { WorkflowStep } from "./workflow_step";

export type Workflow = {
  title: string;
  steps: WorkflowStep[];

  baseUrl?: string;

  onBefore?: (ctx: IRunnerContext) => unknown;
  onAfter?: (ctx: IRunnerContext) => unknown;
  onBeforeEach?: (ctx: IRunnerContext & { step: WorkflowStep }) => unknown;
  onAfterEach?: (
    ctx: IRunnerContext & {
      step: WorkflowStep;
      response: IHaxanResponse<unknown>;
    },
  ) => unknown;
  onSuccess?: (ctx: IRunnerContext) => unknown;
  onFail?: (
    ctx: IRunnerContext & {
      step: WorkflowStep;
      response: IHaxanResponse<unknown>;
    },
  ) => unknown;
};

// Wrapper for type inference
export function defineWorkflow(
  func: () => Workflow | Promise<Workflow>,
): () => Workflow | Promise<Workflow> {
  return func;
}
