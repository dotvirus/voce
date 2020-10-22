import log from "./log";
import { IWorkflowResult } from "./runner";

export interface IEvaluatorOptions {
  failOnTodo: boolean;
  failOnSkip: boolean;
}

export function evaluateResult(
  result: IWorkflowResult,
  opts?: Partial<IEvaluatorOptions>,
) {
  if (result.numFailed > 0) {
    log("Ran all tests, but had error");
    process.exit(1);
  }

  if (opts?.failOnSkip && result.numSkipped > 0) {
    log("Ran all tests, but had skip");
    process.exit(1);
  }

  if (opts?.failOnTodo && result.numTodo > 0) {
    log("Ran all tests, but had todo");
    process.exit(1);
  }

  log("Ran all tests");
  process.exit(0);
}
