import { Handler, AnyHandler, createExecutableSchema } from "@dotvirus/yxc";
import chalk from "chalk";
import haxan from "haxan";
import ora from "ora";
import { relative } from "path";
import variableDiff from "variable-diff";

import args from "./args";
import log from "./log";
import { resolveWorkflow, Workflow } from "./workflow";

export class TestError extends Error {
  title: string;

  constructor(title: string, message: string) {
    super(message);
    this.title = title;
  }
}

export interface IRunnerContext {
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
        console.error(result.text);
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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const func = require(file).default;
  if (typeof func !== "function") {
    throw new Error(`${file}: not a function`);
  }
  const returnedDefinition = await func(ctx);
  return resolveWorkflow(returnedDefinition);
}

async function runTest(file: string, ctx: IRunnerContext): Promise<boolean> {
  const workflow = await requireWorkflow(file, ctx);
  console.error(
    chalk.blueBright(
      `\n${workflow.title} (${relative(process.cwd(), file)})\n`,
    ),
  );

  log(`Before all hook`);
  workflow.onBefore && (await workflow.onBefore({ ...ctx }));

  for (let i = 0; i < workflow.steps.length; i++) {
    const testCase = workflow.steps[i];

    if (testCase.todo) {
      console.error(
        chalk.cyanBright(
          `? [${i + 1}/${workflow.steps.length}] TODO: ${testCase.title}`,
        ),
      );
      continue;
    }

    if (testCase.skip) {
      console.error(
        chalk.yellowBright(
          `! [${i + 1}/${workflow.steps.length}] SKIP: ${testCase.title}`,
        ),
      );
      continue;
    }

    log(`Before each hook`);
    workflow.onBeforeEach &&
      (await workflow.onBeforeEach({ ...ctx, step: testCase }));
    log(`Before hook`);
    testCase.onBefore && (await testCase.onBefore({ ...ctx, step: testCase }));
    const loader = ora(`[${i + 1}/${workflow.steps.length}] ${testCase.title}`);

    const url = resolveUrl(testCase.url);
    const method = testCase.method || "GET";
    const resBuilder = haxan(url).method(method).timeout(args.timeout);

    if (testCase.reqBody) {
      resBuilder.body(testCase.reqBody);
    }

    if (testCase.query) {
      for (const [key, value] of Object.entries(testCase.query)) {
        resBuilder.param(key, value);
      }
    }

    if (testCase.reqHeaders) {
      for (const [key, value] of Object.entries(testCase.reqHeaders)) {
        resBuilder.header(key, value);
      }
    }

    log(`${method} request to ${url}`);
    const res = await resBuilder.request();
    log(`Got response from ${url}`);

    // eslint-disable-next-line no-inner-declarations
    async function failTest(msg: string) {
      log(`${file} failed`);
      log(`Fail hook`);
      testCase.onFail &&
        (await testCase.onFail({ ...ctx, step: testCase, response: res }));
      log(`After hook`);
      testCase.onAfter &&
        (await testCase.onAfter({ ...ctx, step: testCase, response: res }));
      log(`After each hook`);
      workflow.onAfterEach &&
        (await workflow.onAfterEach({ ...ctx, step: testCase, response: res }));
      log(`Workflow fail hook`);
      workflow.onFail &&
        (await workflow.onFail({ ...ctx, step: testCase, response: res }));
      log(`After all hook`);
      workflow.onAfter && (await workflow.onAfter({ ...ctx }));
      loader.fail();
      throw new TestError(testCase.title, msg);
    }

    if (res.status !== testCase.status) {
      await failTest(
        `Expected status ${res.status} to equal ${testCase.status}`,
      );
    }
    log("Status OK");

    if (testCase.resBody) {
      const testDataHandler = resolveTestDefinitionData(testCase.resBody);
      const result = createExecutableSchema(testDataHandler)(res.data);
      if (!result.ok) {
        await failTest(`Response body not as expected`);
      }
      log("Res body OK");
    }

    if (testCase.resHeaders) {
      const testDataHandler = resolveTestDefinitionData(testCase.resHeaders);
      const result = createExecutableSchema(testDataHandler)(res.headers);
      if (!result.ok) {
        await failTest(`Response headers not as expected`);
      }
      log("Res headers OK");
    }

    log(`${file} OK`);

    log(`Success hook`);
    testCase.onSuccess &&
      (await testCase.onSuccess({ ...ctx, step: testCase, response: res }));

    log(`After hook`);
    testCase.onAfter &&
      (await testCase.onAfter({ ...ctx, step: testCase, response: res }));

    log(`After each hook`);
    workflow.onAfterEach &&
      (await workflow.onAfterEach({ ...ctx, step: testCase, response: res }));

    loader.succeed();
  }

  log(`Workflow success hook`);
  workflow.onSuccess && (await workflow.onSuccess({ ...ctx }));

  log(`After all hook`);
  workflow.onAfter && (await workflow.onAfter({ ...ctx }));

  return true;
}

export async function runTests(files: Array<string>): Promise<void> {
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
