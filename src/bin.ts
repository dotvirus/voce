import { resolve } from "path";

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

  files = files.map((f) => resolve(f));

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
  evaluateResult(result, {
    failOnSkip: args["fail-skip"],
    failOnTodo: args["fail-todo"],
  });
}

async function main() {
  log("Entry point");
  register();
  let files = <Array<string>>args.files;
  log(args);
  await testFiles(files);
}

main();
