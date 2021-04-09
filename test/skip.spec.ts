import ava from "ava";
import { runWorkflow } from "../src/runner";
import sinon from "sinon";
import { WorkflowStep } from "../src/workflow_step";

ava.serial("Skip step", async (t) => {
  const callback = sinon.fake();
  const result = await runWorkflow(
    {
      title: "Google",
      baseUrl: "http://google.com",
      steps: [
        new WorkflowStep("/", 200).method("HEAD").skip().onAfter(callback),
        new WorkflowStep("/", 200).method("HEAD").onAfter(callback),
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
    numSkipped: 1,
    numSuccess: 1,
    numTodo: 0,
  });
  t.assert(callback.calledOnce);
});
