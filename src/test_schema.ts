import yxc, { Handler, Infer, is } from "@dotvirus/yxc";

const functionType = yxc.any().rule((v) => typeof v === "function");
const yxcHandlerType = yxc.any().rule((v) => v instanceof Handler);

function orFunction(handler: Handler) {
  return yxc.union([functionType, handler]);
}

function orYxcHandler(handler: Handler) {
  return yxc.union([yxcHandlerType, handler]);
}

export const testDefinitionSchema = yxc.object({
  title: yxc.string(),
  url: orFunction(yxc.string()),
  method: yxc.string().optional(),
  status: yxc.number().natural(),
  data: orYxcHandler(yxc.object().arbitrary()).optional().nullable(),
  onSuccess: functionType.optional(),
  query: yxc.record(yxc.string()).optional(),
  headers: yxc.record(yxc.string()).optional(),
  // TODO: response headers
});
export const testDefinitionSchemaArray = yxc.array(testDefinitionSchema);

export type TestDefinition = Infer<typeof testDefinitionSchema>;

export function resolveTestDefinition(val: unknown): Array<TestDefinition> {
  if (is(val, testDefinitionSchema)) {
    return [val];
  }
  if (is(val, testDefinitionSchemaArray)) {
    return val;
  }
  throw new Error("Invalid test definition");
}
