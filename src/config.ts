import * as z from "zod";

import log from "./log";

const configSchema = z.object({
  hooks: z
    .object({
      before: z.function().optional(),
      after: z.function().optional(),
    })
    .optional(),
});

export type IConfig = z.TypeOf<typeof configSchema>;

export async function getConfig(path: string): Promise<IConfig> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require(path).default;

  log(module);

  const result = configSchema.safeParse(module);

  if (result.success) {
    return module;
  }

  console.error(`Invalid voce config: ${path}`);
  console.error(JSON.stringify(result.error, null, 2));
  process.exit(1);
}
