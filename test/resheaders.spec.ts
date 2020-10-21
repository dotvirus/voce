import ava from "ava";
import { runWorkflow } from "../src/runner";
import sinon from "sinon";
import yxc from "@dotvirus/yxc";

ava.serial("Response body & headers test", async (t) => {
  const successCallback = sinon.fake();
  const failCallback = sinon.fake();
  const result = await runWorkflow(
    {
      title: "JSON placeholder",
      baseUrl: "https://jsonplaceholder.typicode.com",
      steps: [
        {
          url: "/todos/1",
          status: 200,
        },
        {
          url: "/todos/1",
          status: 200,
          resHeaders: yxc
            .object({
              "content-type": yxc.string().prefix("application/json;"),
            })
            .arbitrary(),
          onSuccess: successCallback,
          onFail: failCallback,
        },
        {
          url: "/todos/2",
          status: 200,
        },
        {
          url: "/todos/2",
          status: 200,
          resHeaders: yxc
            .object({
              "content-type": yxc.string().prefix("application/yaml;"),
            })
            .arbitrary(),
          onSuccess: successCallback,
          onFail: failCallback,
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
    numFailed: 1,
    numSkipped: 0,
    numSuccess: 3,
    numTodo: 0,
  });
  t.assert(successCallback.calledOnce);
  t.assert(failCallback.calledOnce);
});
