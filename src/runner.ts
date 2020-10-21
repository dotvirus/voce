import { Handler, AnyHandler, createExecutableSchema } from "@dotvirus/yxc";
import chalk from "chalk";
import haxan from "haxan";
import ora from "ora";
import { relative, resolve } from "path";
import variableDiff from "variable-diff";

import args from "./args";
import log from "./log";
import { percentFormatter } from "./util";
import { resolveWorkflow, Workflow } from "./workflow";

export interface IRunnerContext {
  index: number;
  numWorkflows: number;
  file: string;
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
  const path = resolve(file);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const func = require(path).default;
  if (typeof func !== "function") {
    throw new Error(`${path}: not a function`);
  }
  const returnedDefinition = await func(ctx);
  return resolveWorkflow(returnedDefinition);
}

export interface IWorkflowResult {
  numSuccess: number;
  numFailed: number;
  numTodo: number;
  numSkipped: number;
}

export async function runWorkflow(
  workflow: Workflow,
  ctx: IRunnerContext,
): Promise<IWorkflowResult> {
  console.error(
    chalk.blueBright(
      `\n${workflow.title} (${relative(process.cwd(), ctx.file)})`,
    ),
  );
  if (workflow.baseUrl) {
    console.error(chalk.grey(`Using base URL ${workflow.baseUrl}\n`));
  }

  const result: IWorkflowResult = {
    numFailed: 0,
    numSkipped: 0,
    numSuccess: 0,
    numTodo: 0,
  };

  const start = Date.now();

  log(`Before all hook`);
  workflow.onBefore && (await workflow.onBefore({ ...ctx }));

  for (let i = 0; i < workflow.steps.length; i++) {
    const testCase = workflow.steps[i];
    const method = testCase.method || "GET";
    const route = resolveUrl(testCase.url);
    const url = (workflow.baseUrl || "") + route;
    const title = testCase.title || `${method} ${route}`;

    if (testCase.todo) {
      console.error(
        chalk.cyanBright(
          `? [${i + 1}/${workflow.steps.length}] TODO: ${title}`,
        ),
      );
      result.numTodo++;
      continue;
    }

    if (testCase.skip) {
      console.error(
        chalk.yellowBright(
          `! [${i + 1}/${workflow.steps.length}] SKIP: ${title}`,
        ),
      );
      result.numSkipped++;
      continue;
    }

    const loader = ora(`[${i + 1}/${workflow.steps.length}] ${title}`).start();
    // eslint-disable-next-line no-inner-declarations
    function setLoaderTime() {
      const now = Date.now();
      const millis = now - start;
      loader.text += chalk.grey(` (${millis} ms)`);
    }

    log(`Before each hook`);
    workflow.onBeforeEach &&
      (await workflow.onBeforeEach({ ...ctx, step: testCase }));
    log(`Before hook`);
    testCase.onBefore && (await testCase.onBefore({ ...ctx, step: testCase }));

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
    async function failTest(msg: string): Promise<IWorkflowResult> {
      log(`${ctx.file} failed`);
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
      setLoaderTime();
      loader.fail();
      result.numFailed++;
      console.warn(chalk.red(`\n${title}: ${msg}`));
      return result;
    }

    if (res.status !== testCase.status) {
      return failTest(
        `Expected status ${res.status} to equal ${testCase.status}`,
      );
    }
    log("Status OK");

    if (testCase.resBody) {
      const testDataHandler = resolveTestDefinitionData(testCase.resBody);
      const result = createExecutableSchema(testDataHandler)(res.data);
      if (!result.ok) {
        return failTest(`Response body not as expected`);
      }
      log("Res body OK");
    }

    if (testCase.resHeaders) {
      const testDataHandler = resolveTestDefinitionData(testCase.resHeaders);
      const result = createExecutableSchema(testDataHandler)(res.headers);
      if (!result.ok) {
        return failTest(`Response headers not as expected`);
      }
      log("Res headers OK");
    }

    if (testCase.validate) {
      log("Running custom validation function");
      try {
        await testCase.validate({ ...ctx, step: testCase, response: res });
      } catch (error) {
        return failTest(error.message);
      }
    }

    log(`${ctx.file} OK`);

    log(`Success hook`);
    testCase.onSuccess &&
      (await testCase.onSuccess({ ...ctx, step: testCase, response: res }));

    log(`After hook`);
    testCase.onAfter &&
      (await testCase.onAfter({ ...ctx, step: testCase, response: res }));

    log(`After each hook`);
    workflow.onAfterEach &&
      (await workflow.onAfterEach({ ...ctx, step: testCase, response: res }));

    setLoaderTime();
    loader.succeed();
    result.numSuccess++;
  }

  log(`Workflow success hook`);
  workflow.onSuccess && (await workflow.onSuccess({ ...ctx }));

  log(`After all hook`);
  workflow.onAfter && (await workflow.onAfter({ ...ctx }));

  return result;
}

export async function runFile(ctx: IRunnerContext): Promise<IWorkflowResult> {
  const workflow = await requireWorkflow(ctx.file, ctx);
  const result = await runWorkflow(workflow, ctx);
  return result;
}

export async function runFiles(files: Array<string>): Promise<IWorkflowResult> {
  const result: IWorkflowResult = {
    numFailed: 0,
    numSkipped: 0,
    numSuccess: 0,
    numTodo: 0,
  };
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const workflowResult = await runFile({
      file,
      index,
      numWorkflows: files.length,
    });
    if (workflowResult.numFailed > 0) {
      if (args.bail) {
        console.warn(chalk.yellow("\nBailing tests"));
        process.exit(1);
      }
    }
    result.numFailed += workflowResult.numFailed;
    result.numSkipped += workflowResult.numSkipped;
    result.numSuccess += workflowResult.numSuccess;
    result.numTodo += workflowResult.numTodo;
  }

  // Summary
  const numSteps =
    result.numFailed + result.numSkipped + result.numSuccess + result.numTodo;
  const formatPercent = percentFormatter(numSteps);

  console.error(chalk.grey("\n-----"));
  console.error(
    `Passed: ${result.numSuccess} ${formatPercent(result.numSuccess)}`,
  );
  if (result.numFailed) {
    console.error(
      chalk.redBright(
        `Failed: ${result.numFailed} ${formatPercent(result.numFailed)}`,
      ),
    );
  }
  if (result.numSkipped) {
    console.error(
      chalk.yellowBright(
        `Skipped: ${result.numSkipped} ${formatPercent(result.numSkipped)}`,
      ),
    );
  }
  if (result.numTodo) {
    console.error(
      chalk.cyanBright(
        `Todo: ${result.numTodo} ${formatPercent(result.numTodo)}`,
      ),
    );
  }

  return result;
}
