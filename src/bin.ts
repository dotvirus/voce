import { resolve } from "path";
import glob from "glob";

import args from "./args";
import { evaluateResult } from "./evaluator";
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
    process.exit(1);
  }

  // Resolve globs
  files = files.flatMap((x) => glob.sync(x)).map((x) => resolve(x));
  // Ensure paths are unique
  files = [...new Set(files)];

  {
    const notFound = getMissingFiles(files);
    if (notFound.length) {
      console.error("Some input files were not found:", notFound);
      process.exit(1);
    }
  }

  log(files);
  const result = await runFiles(files, {
    bail: args.bail,
  });
  log(result);
  const failed = evaluateResult(result, {
    failOnSkip: args["fail-skip"],
    failOnTodo: args["fail-todo"],
  });
  process.exit(failed);
}

async function main() {
  log("Entry point");
  register();
  const files = <Array<string>>args.files;
  log(args);
  await testFiles(files);
}

main();
