import log from "./log";
import { resolveTestDefinition, TestDefinition } from "./test_schema";
import haxan from "haxan";
import { Handler, AnyHandler, createExecutableSchema } from "@dotvirus/yxc";
import deepEqual from "deep-equal";
import ora from "ora";

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
    return new AnyHandler().rule((v) => deepEqual(v, data));
  }
}

function resolveTestDefinitionUrl(url: unknown): string {
  if (typeof url === "string") {
    return url;
  } else if (typeof url === "function") {
    return resolveTestDefinitionUrl(url());
  }
  throw new Error(`Invalid url: ${url}`);
}

async function requireTestDefinition(
  file: string,
  ctx: IRunnerContext,
): Promise<Array<TestDefinition>> {
  const func = require(file).default;
  if (typeof func !== "function") {
    throw new Error(`${file}: not a function`);
  }
  const returnedDefinition = await func(ctx);
  return resolveTestDefinition(returnedDefinition);
}

async function runTest(file: string, ctx: IRunnerContext): Promise<boolean> {
  const workflow = await requireTestDefinition(file, ctx);
  console.log(`\n${file}\n`);

  for (let i = 0; i < workflow.length; i++) {
    const testCase = workflow[i];
    const loader = ora(
      `[${i + 1}/${workflow.length}] Running ${testCase.title}`,
    );

    const url = resolveTestDefinitionUrl(testCase.url);
    const method = testCase.method || "GET";
    const resBuilder = haxan(url).method(method);

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
        console.warn(result.errors);
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
      if (error instanceof TestError) {
        console.warn(`${error.title}: ${error.message}`);
      } else {
        throw error;
      }
    }
  }
}
