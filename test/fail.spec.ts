import ava from "ava";
import { runWorkflow } from "../src/runner";
import sinon from "sinon";

ava.serial("HEAD Google", async (t) => {
  const callback = sinon.fake();
  const successCallback = sinon.fake();
  const failCallback = sinon.fake();
  const result = await runWorkflow(
    {
      title: "Google",
      baseUrl: "http://google.com",
      steps: [
        {
          url: "/",
          status: 201,
          method: "HEAD",
        },
        {
          url: () => "/",
          status: 200,
          method: "HEAD",
          onBefore: callback,
        },
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
    numFailed: 1,
    numSkipped: 0,
    numSuccess: 0,
    numTodo: 0,
  });
  t.assert(!callback.called);
  t.assert(!successCallback.called);
  t.assert(failCallback.calledOnce);
});
