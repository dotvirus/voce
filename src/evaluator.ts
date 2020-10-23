import log from "./log";
import { IWorkflowResult } from "./runner";

export interface IEvaluatorOptions {
  failOnTodo: boolean;
  failOnSkip: boolean;
}

export enum TestResult {
  Success,
  Failed,
}

// Returns if the test failed
export function evaluateResult(
  result: IWorkflowResult,
  opts?: Partial<IEvaluatorOptions>,
): TestResult {
  if (result.numFailed > 0) {
    log("Ran all tests, but had error");
    return TestResult.Failed;
  }

  if (opts?.failOnSkip && result.numSkipped > 0) {
    log("Ran all tests, but had skip");
    return TestResult.Failed;
  }

  if (opts?.failOnTodo && result.numTodo > 0) {
    log("Ran all tests, but had todo");
    return TestResult.Failed;
  }

  log("Ran all tests, successfully");
  return TestResult.Success;
}
