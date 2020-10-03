import log from "./log";
import { resolveWorkflow, Workflow } from "./workflow";
import haxan from "haxan";
import { Handler, AnyHandler, createExecutableSchema } from "@dotvirus/yxc";
import ora from "ora";
import chalk from "chalk";
import variableDiff from "variable-diff";
import { relative } from "path";
import args from "./args";

class TestError extends Error {
  title: string;

  constructor(title: string, message: string) {
    super(message);
    this.title = title;
  }
}

interface IRunnerContext {
  index: number;
  numTests: number;
}

function resolveTestDefinitionData(data: unknown): Handler {
  if (data instanceof Handler) {
    return data;
  } else {
    return new AnyHandler().rule((v) => {
      const result = variableDiff(v, data);
      if (result.changed) {
        console.log(result.text);
      }
      return !result.changed;
    });
  }
}

function resolveUrl(url: unknown): string {
  if (typeof url === "string") {
    return url;
  } else if (typeof url === "function") {
    return resolveUrl(url());
  }
  throw new Error(`Invalid url: ${url}`);
}

async function requireWorkflow(
  file: string,
  ctx: IRunnerContext,
): Promise<Workflow> {
  const func = require(file).default;
  if (typeof func !== "function") {
    throw new Error(`${file}: not a function`);
  }
  const returnedDefinition = await func(ctx);
  return resolveWorkflow(returnedDefinition);
}

async function runTest(file: string, ctx: IRunnerContext): Promise<boolean> {
  const workflow = await requireWorkflow(file, ctx);
  console.log(
    chalk.blueBright(
      `\n${workflow.title} (${relative(process.cwd(), file)})\n`,
    ),
  );

  for (let i = 0; i < workflow.steps.length; i++) {
    const testCase = workflow.steps[i];
    const loader = ora(`[${i + 1}/${workflow.steps.length}] ${testCase.title}`);

    const url = resolveUrl(testCase.url);
    const method = testCase.method || "GET";
    const resBuilder = haxan(url).method(method).timeout(args.timeout);

    if (testCase.body) {
      resBuilder.body(testCase.body);
    }

    if (testCase.query) {
      for (const [key, value] of Object.entries(testCase.query)) {
        resBuilder.param(key, value);
      }
    }

    if (testCase.headers) {
      for (const [key, value] of Object.entries(testCase.headers)) {
        resBuilder.header(key, value);
      }
    }

    log(`${method} request to ${url}`);
    const res = await resBuilder.request();
    log(`Got response from ${url}`);

    if (res.status !== testCase.status) {
      loader.fail();
      throw new TestError(
        testCase.title,
        `Expected status ${res.status} to equal ${testCase.status}`,
      );
    }
    log("Status OK");

    if (testCase.data) {
      const testDataHandler = resolveTestDefinitionData(testCase.data);
      const result = createExecutableSchema(testDataHandler)(res.data);
      if (!result.ok) {
        loader.fail();
        throw new TestError(testCase.title, `Response body not as expected`);
      }
      log("Res body OK");
    }

    testCase.onSuccess && testCase.onSuccess(res);

    loader.succeed();
    log(`${file} OK`);
  }

  return true;
}

export async function runTests(files: Array<string>) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      await runTest(file, {
        index: i,
        numTests: files.length,
      });
    } catch (error) {
      if (args.bail) {
        console.warn(chalk.yellow("\nBailing tests"));
        process.exit(1);
      }
      if (error instanceof TestError) {
        console.warn(chalk.red(`\n${error.title}: ${error.message}`));
      } else {
        throw error;
      }
    }
  }
}
