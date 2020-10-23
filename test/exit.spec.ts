import ava from "ava";
import { runFiles } from "../src/runner";
import { evaluateResult } from "../src/evaluator";

ava.serial("Success with 0", async (t) => {
  const result = await runFiles(["test/fixture/success.fixture.ts"]);
  t.deepEqual(result, {
    numFailed: 0,
    numSkipped: 0,
    numSuccess: 1,
    numTodo: 0,
  });
  t.is(evaluateResult(result), 0);
});

ava.serial("Fail with 1", async (t) => {
  const result = await runFiles(["test/fixture/fail.fixture.ts"]);
  t.deepEqual(result, {
    numFailed: 1,
    numSkipped: 0,
    numSuccess: 0,
    numTodo: 0,
  });
  t.is(evaluateResult(result), 1);
});

ava.serial("Fail with todo", async (t) => {
  const result = await runFiles(["test/fixture/failtodo.fixture.ts"]);
  t.deepEqual(result, {
    numFailed: 0,
    numSkipped: 0,
    numSuccess: 0,
    numTodo: 1,
  });
  t.is(
    evaluateResult(result, {
      failOnTodo: true,
    }),
    1,
  );
});

ava.serial("Fail with skip", async (t) => {
  const result = await runFiles(["test/fixture/failskip.fixture.ts"]);
  t.deepEqual(result, {
    numFailed: 0,
    numSkipped: 1,
    numSuccess: 0,
    numTodo: 0,
  });
  t.is(
    evaluateResult(result, {
      failOnSkip: true,
    }),
    1,
  );
});
