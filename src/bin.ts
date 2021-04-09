import { existsSync } from "fs";
import glob from "glob";
import { resolve } from "path";

import args from "./args";
import { getConfig, IConfig } from "./config";
import { evaluateResult, TestResult } from "./evaluator";
import log from "./log";
import { runFiles } from "./runner";
import { getMissingFiles } from "./util";

function register() {
  if (args.register.length) {
    for (const pkg of args.register) {
      log(`Register ${pkg}`);
      require(pkg);
    }
  }
}

async function testFiles(files: Array<string>) {
  if (!Array.isArray(files) || !files.length) {
    console.error("No input files");
    return TestResult.Failed;
  }

  // Resolve globs
  files = files.flatMap((x) => glob.sync(x)).map((x) => resolve(x));
  // Ensure paths are unique
  files = [...new Set(files)];

  {
    const notFound = getMissingFiles(files);
    if (notFound.length) {
      console.error("Some input files were not found:", notFound);
      return TestResult.Failed;
    }
  }

  log({ files });
  const result = await runFiles(files, {
    bail: args.bail,
  });
  log({ result });
  const failed = evaluateResult(result, {
    failOnSkip: args["fail-skip"],
    failOnTodo: args["fail-todo"],
  });

  return failed;
}

async function loadConfig(configPath: string): Promise<IConfig> {
  log(`Checking config @ ${configPath}`);
  if (existsSync(configPath)) {
    log(`Found config @ ${configPath}, importing...`);
    return getConfig(configPath);
  }
  log(`No config file found (config: ${configPath})`);
  return { hooks: undefined };
}

async function main() {
  log("Entry point");
  register();
  const files = <Array<string>>args.files;
  log({ args });

  const configPath = resolve(args.config);
  log({ configPath });

  const config = await loadConfig(configPath);

  if (config.hooks?.before) {
    log("Running before hook");
    await config.hooks.before();
  }

  const failed = await testFiles(files);

  if (config.hooks?.after) {
    log("Running after hook");
    await config.hooks.after();
  }

  process.exit(failed);
}

main();
