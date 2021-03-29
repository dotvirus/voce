import yxc, { createExecutableSchema, Infer } from "@dotvirus/yxc";

import log from "./log";
import { functionType } from "./util";

const configSchema = yxc.object({
  hooks: yxc
    .object({
      before: functionType().optional(),
      after: functionType().optional(),
    })
    .optional(),
});

export type IConfig = Infer<typeof configSchema>;

export async function getConfig(path: string): Promise<IConfig> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require(path).default;

  log(module);

  const { ok, errors } = createExecutableSchema(configSchema)(module);

  if (ok) {
    return module;
  }
  console.error(`Invalid voce config: ${path}`);
  console.error(errors);
  process.exit(1);
}
