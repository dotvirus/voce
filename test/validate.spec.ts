import ava from "ava";
import { runWorkflow } from "../src/runner";
import sinon from "sinon";
import { WorkflowStep } from "../src/workflow_step";

ava.serial("Validate function", async (t) => {
  const callback = sinon.fake();
  const result = await runWorkflow(
    {
      title: "Google",
      baseUrl: "http://google.com",
      steps: [
        new WorkflowStep("/", 200)
          .method("GET")
          .validateResponse(({ response }) => {
            if (
              typeof response.data === "string" &&
              response.data.includes("window.google")
            ) {
              callback();
              return true;
            }
            throw new Error("Not google home page");
          }),
      ],
    },
    {
      file: __filename,
      index: 0,
      numWorkflows: 1,
    },
  );
  t.deepEqual(result, {
    numFailed: 0,
    numSkipped: 0,
    numSuccess: 1,
    numTodo: 0,
  });
  t.assert(callback.calledOnce);
});

ava.serial("Validate function -> fail", async (t) => {
  const callback = sinon.fake();
  const result = await runWorkflow(
    {
      title: "Google",
      baseUrl: "http://google.com",
      steps: [
        new WorkflowStep("/", 200)
          .method("HEAD")
          .validateResponse(({ response }) => {
            if (
              typeof response.data === "string" &&
              response.data.includes("window.google")
            ) {
              return true;
            }
            callback();
            throw new Error("Not google home page");
          }),
      ],
    },
    {
      file: __filename,
      index: 0,
      numWorkflows: 1,
    },
  );
  t.deepEqual(result, {
    numFailed: 1,
    numSkipped: 0,
    numSuccess: 0,
    numTodo: 0,
  });
  t.assert(callback.calledOnce);
});
