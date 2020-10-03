import yxc, { Handler, Infer, is } from "@dotvirus/yxc";

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
  data: orYxcHandler(yxc.any()).optional().nullable(),
  onSuccess: functionType.optional(),
  query: yxc.record(yxc.string()).optional(),
  body: yxc.object().arbitrary().optional(),
  headers: yxc.record(yxc.string()).optional(),
  // TODO: response headers
});

export const workflowSchema = yxc.object({
  title: yxc.string(),
  steps: yxc.array(workflowStepSchema),
});

export type Workflow = Infer<typeof workflowSchema>;
export type WorkflowStep = Infer<typeof workflowStepSchema>;

export function resolveWorkflow(val: unknown): Workflow {
  if (is(val, workflowSchema)) {
    return val;
  }
  throw new Error("Invalid test definition");
}
