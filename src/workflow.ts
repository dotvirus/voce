import { IHaxanResponse } from "haxan";
import yxc, { Handler, is, ObjectHandler } from "@dotvirus/yxc";

import { IRunnerContext } from "./runner";

const functionType = yxc.any().rule((v) => typeof v === "function");
const yxcHandlerType = yxc.any().rule((v) => v instanceof Handler);

function orFunction(handler: Handler) {
  return yxc.union([functionType, handler]);
}

function orYxcHandler(handler: Handler) {
  return yxc.union([yxcHandlerType, handler]);
}

export const workflowStepSchema = yxc.object({
  title: yxc.string(),
  url: orFunction(yxc.string()),
  method: yxc.string().optional(),
  status: yxc.number().natural(),
  reqBody: yxc.object().arbitrary().optional(),
  resBody: orYxcHandler(yxc.any()).optional().nullable(),
  query: yxc.record(yxc.string()).optional(),
  reqHeaders: yxc.record(yxc.string()).optional(),
  resHeaders: orYxcHandler(yxc.record(yxc.string())).optional().nullable(),

  onBefore: functionType.optional(),

  onSuccess: functionType.optional(),
  onFail: functionType.optional(),

  onAfter: functionType.optional(),

  todo: yxc.boolean().optional(),
  skip: yxc.boolean().optional(),
});

export const workflowSchema = yxc.object({
  title: yxc.string(),
  steps: yxc.array(workflowStepSchema),

  baseUrl: yxc.string().optional(),

  onBefore: functionType.optional(),
  onAfter: functionType.optional(),

  onBeforeEach: functionType.optional(),
  onAfterEach: functionType.optional(),

  onSuccess: functionType.optional(),
  onFail: functionType.optional(),
});

export type WorkflowStep = {
  title: string;
  url: string | (() => string | Promise<string>);
  status: number;
  method?: string;
  reqBody?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resBody?: Record<string, unknown> | ObjectHandler<any>;
  query?: Record<string, string>;
  reqHeaders?: Record<string, string>;
  resHeaders?: Record<string, string>;

  todo?: boolean;
  skip?: boolean;

  onBefore?: (ctx: IRunnerContext & { step: WorkflowStep }) => unknown;
  onSuccess?: (
    ctx: IRunnerContext & {
      step: WorkflowStep;
      response: IHaxanResponse<unknown>;
    },
  ) => unknown;
  onFail?: (
    ctx: IRunnerContext & {
      step: WorkflowStep;
      response: IHaxanResponse<unknown>;
    },
  ) => unknown;
  onAfter?: (
    ctx: IRunnerContext & {
      step: WorkflowStep;
      response: IHaxanResponse<unknown>;
    },
  ) => unknown;
};
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

export function resolveWorkflow(val: unknown): Workflow {
  if (is(val, workflowSchema)) {
    return val;
  }
  throw new Error("Invalid test definition");
}
