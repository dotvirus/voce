import { IHaxanResponse } from "haxan";
import yxc, {
  createExecutableSchema,
  Handler,
  ObjectHandler,
} from "@dotvirus/yxc";

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
  title: yxc.string().optional(),
  url: orFunction(yxc.string()),
  method: yxc.string().optional(),
  status: yxc.number().natural(),
  reqBody: orFunction(yxc.object().arbitrary()).optional(),
  resBody: orFunction(yxc.any().optional()).nullable(),
  query: orFunction(yxc.record(yxc.string())).optional(),
  reqHeaders: orFunction(yxc.record(yxc.string())).optional(),
  resHeaders: orFunction(orYxcHandler(yxc.record(yxc.string())))
    .optional()
    .nullable(),

  validate: functionType.optional(),

  onBefore: functionType.optional(),

  onSuccess: functionType.optional(),
  onFail: functionType.optional(),

  onAfter: functionType.optional(),

  todo: yxc.boolean().optional(),
  skip: yxc.boolean().optional(),
});

export const workflowSchema = yxc.object({
  title: yxc.string(),
  steps: yxc.array(workflowStepSchema).notEmpty(),

  baseUrl: yxc.string().optional(),

  onBefore: functionType.optional(),
  onAfter: functionType.optional(),

  onBeforeEach: functionType.optional(),
  onAfterEach: functionType.optional(),

  onSuccess: functionType.optional(),
  onFail: functionType.optional(),
});

export type WorkflowStep = {
  title?: string;
  url: string | (() => string);
  status: number;
  method?: string;
  reqBody?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resBody?: any;
  query?: Record<string, string> | (() => Record<string, string>);
  reqHeaders?: Record<string, string> | (() => Record<string, string>);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resHeaders?:
    | Record<string, string>
    | ObjectHandler<any>
    | (() => Record<string, string> | ObjectHandler<any>);

  validate?: (
    ctx: IRunnerContext & {
      step: WorkflowStep;
      response: IHaxanResponse<unknown>;
    },
  ) => unknown;

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
  const result = createExecutableSchema(workflowSchema)(val);
  if (result.ok) {
    return val as Workflow;
  }
  console.error(result.errors);
  throw new Error("Invalid test definition");
}
