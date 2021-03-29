import ava from "ava";
import { runWorkflow } from "../src/runner";
import sinon from "sinon";
import { WorkflowStep } from "../src/workflow_step";

ava.serial("Google test", async (t) => {
  const successCallback = sinon.fake();
  const failCallback = sinon.fake();
  const result = await runWorkflow(
    {
      title: "Google",
      baseUrl: "http://google.com",
      steps: [
        new WorkflowStep("/", 200).method("HEAD"),
        new WorkflowStep(() => "/", 200).method("HEAD"),
      ],
      onSuccess: successCallback,
      onFail: failCallback,
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
    numSuccess: 2,
    numTodo: 0,
  });
  t.assert(successCallback.called);
  t.assert(!failCallback.calledOnce);
});
