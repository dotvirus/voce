import ava from "ava";
import { runWorkflow } from "../src/runner";
import sinon from "sinon";
import { WorkflowStep } from "../src/workflow_step";
import yxc, { createSchema } from "@dotvirus/yxc";

ava.serial("Response body & headers test", async (t) => {
  const successCallback = sinon.fake();
  const failCallback = sinon.fake();
  const result = await runWorkflow(
    {
      title: "JSON placeholder",
      baseUrl: "https://jsonplaceholder.typicode.com",
      steps: [
        new WorkflowStep("/todos/1", 200),
        new WorkflowStep("/todos/1", 200)
          .onSuccess(successCallback)
          .onFail(failCallback)
          .validateBody(
            (resBody: unknown) =>
              createSchema({
                userId: yxc.number().eq(1),
                id: yxc.number().eq(1),
                title: yxc.string().eq("delectus aut autem"),
                completed: yxc.boolean().false(),
              })(resBody).errors,
          ),
        new WorkflowStep("/todos/2", 200),
        new WorkflowStep("/todos/2", 200)
          .onSuccess(successCallback)
          .onFail(failCallback)
          .validateBody(
            (resBody: unknown) =>
              createSchema({
                userId: yxc.number().eq(1),
                id: yxc.number().eq(1),
                title: yxc.string().eq("delectus aut autem"),
                completed: yxc.boolean().false(),
              })(resBody).errors,
          ),
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
    numSuccess: 3,
    numTodo: 0,
  });
  t.assert(successCallback.calledOnce);
  t.assert(failCallback.calledOnce);
});
