import chalk from "chalk";
import haxan from "haxan";
import ora from "ora";
import { relative, resolve } from "path";

import args from "./args";
import log from "./log";
import { percentFormatter } from "./util";
import { Workflow } from "./workflow";
import { ValueGetter } from "./workflow_step";

export interface IRunnerContext {
  index: number;
  numWorkflows: number;
  file: string;
}

function resolveIfFunction<T>(val: ValueGetter<T>): T {
  if (typeof val === "function") {
    return (val as () => T)();
  }
  return val;
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
  return await func(ctx);
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

  let workflowFailed = false;
  let errorMessage: string | null = null;

  log(`Before all hook`);
  workflow.onBefore && (await workflow.onBefore({ ...ctx }));

  for (let i = 0; i < workflow.steps.length; i++) {
    const start = Date.now();
    const testCase = workflow.steps[i];
    const method = resolveIfFunction(testCase._method);
    const route = resolveIfFunction(testCase._url);
    const url = (workflow.baseUrl || "") + route;
    const title = testCase._title || `${method} ${route}`;

    if (workflowFailed) {
      console.error(
        chalk.gray(`- [${i + 1}/${workflow.steps.length}] ${title}`),
      );
      continue;
    }

    if (testCase._todo) {
      console.error(
        chalk.cyanBright(
          `? [${i + 1}/${workflow.steps.length}] TODO: ${title}`,
        ),
      );
      result.numTodo++;
      continue;
    }

    if (testCase._skip) {
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
    testCase._onBefore &&
      (await testCase._onBefore({ ...ctx, step: testCase }));

    const resBuilder = haxan(url).method(method).timeout(args.timeout);

    if (testCase._body) {
      const body = resolveIfFunction(testCase._body);
      resBuilder.body(body);
    }

    if (testCase._query) {
      const query = resolveIfFunction(testCase._query);
      for (const [key, value] of Object.entries(query)) {
        resBuilder.param(key, value);
      }
    }

    if (testCase._headers) {
      const headers = resolveIfFunction(testCase._headers);
      for (const [key, value] of Object.entries(headers)) {
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
      testCase._onFail &&
        (await testCase._onFail({ ...ctx, step: testCase, response: res }));
      log(`After hook`);
      testCase._onAfter &&
        (await testCase._onAfter({ ...ctx, step: testCase, response: res }));
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
      errorMessage = `\n${title}: ${msg}`;
      workflowFailed = true;
      return result;
    }

    if (res.status !== testCase._status) {
      await failTest(
        `Expected status ${res.status} to equal ${testCase._status}`,
      );
      continue;
    }
    log("Status OK");

    if (testCase._bodyValidator) {
      try {
        const result = testCase._bodyValidator(res.data);

        if (result !== true) {
          if (Array.isArray(result) && !result.length) {
            log("Res body OK");
          } else {
            await failTest(
              `Response body not as expected: ${JSON.stringify(
                result,
                null,
                2,
              )}`,
            );
            continue;
          }
        } else {
          log("Res body OK");
        }
      } catch (error) {
        console.error(error);
        await failTest(
          `Response body not as expected: ${JSON.stringify(error, null, 2)}`,
        );
        continue;
      }
    }

    if (testCase._headersValidator) {
      try {
        const result = testCase._headersValidator(res.headers);

        if (result !== true) {
          if (Array.isArray(result) && !result.length) {
            log("Res headers OK");
          } else {
            await failTest(
              `Response headers not as expected: ${JSON.stringify(
                result,
                null,
                2,
              )}`,
            );
            continue;
          }
        } else {
          log("Res headers OK");
        }
      } catch (error) {
        await failTest(
          `Response headers not as expected: ${JSON.stringify(
            error.message || error,
            null,
            2,
          )}`,
        );
        continue;
      }
    }

    if (testCase._responseValidator) {
      log("Running custom validation function");
      try {
        const result = await testCase._responseValidator({
          ...ctx,
          step: testCase,
          response: res,
        });

        if (result !== true) {
          if (Array.isArray(result) && !result.length) {
            log("Response OK");
          } else {
            await failTest(
              `Response validator failed: ${JSON.stringify(result, null, 2)}`,
            );
            continue;
          }
        } else {
          log("Response OK");
        }
      } catch (error) {
        await failTest(
          `Response validator failed: ${JSON.stringify(
            error.message || error,
            null,
            2,
          )}`,
        );
        continue;
      }
    }

    log(`${ctx.file} OK`);

    log(`Success hook`);
    testCase._onSuccess &&
      (await testCase._onSuccess({ ...ctx, step: testCase, response: res }));

    log(`After hook`);
    testCase._onAfter &&
      (await testCase._onAfter({ ...ctx, step: testCase, response: res }));

    log(`After each hook`);
    workflow.onAfterEach &&
      (await workflow.onAfterEach({ ...ctx, step: testCase, response: res }));

    setLoaderTime();
    loader.succeed();
    result.numSuccess++;
  }

  if (!workflowFailed) {
    log(`Workflow success hook`);
    workflow.onSuccess && (await workflow.onSuccess({ ...ctx }));
  } else {
    console.warn(chalk.red(errorMessage));
  }

  log(`After all hook`);
  workflow.onAfter && (await workflow.onAfter({ ...ctx }));

  return result;
}

export async function runFile(ctx: IRunnerContext): Promise<IWorkflowResult> {
  const workflow = await requireWorkflow(ctx.file, ctx);
  const result = await runWorkflow(workflow, ctx);
  return result;
}

export interface IRunnerOptions {
  bail: boolean;
}

export async function runFiles(
  files: Array<string>,
  opts?: Partial<IRunnerOptions>,
): Promise<IWorkflowResult> {
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
      if (opts?.bail) {
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
    `Passed : ${result.numSuccess} ${formatPercent(result.numSuccess)}`,
  );
  if (result.numFailed) {
    console.error(
      chalk.redBright(
        `Failed : ${result.numFailed} ${formatPercent(result.numFailed)}`,
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
        `Todo   : ${result.numTodo} ${formatPercent(result.numTodo)}`,
      ),
    );
  }

  return result;
}
