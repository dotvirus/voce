import ava from "ava";
import { runWorkflow } from "../src/runner";
import sinon from "sinon";

ava.serial("Mark step as todo", async (t) => {
  const callback = sinon.fake();
  const result = await runWorkflow(
    {
      title: "Google",
      baseUrl: "http://google.com",
      steps: [
        {
          url: "/",
          status: 200,
          method: "HEAD",
          todo: true,
          onAfter: callback,
        },
        {
          url: () => "/",
          status: 200,
          method: "HEAD",
          onAfter: callback,
        },
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
    numTodo: 1,
  });
  t.assert(callback.calledOnce);
});
