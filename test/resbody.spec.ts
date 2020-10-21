import ava from "ava";
import { runWorkflow } from "../src/runner";
import sinon from "sinon";

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
          resBody: {
            userId: 1,
            id: 1,
            title: "delectus aut autem",
            completed: false,
          },
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
          resBody: {
            userId: 1,
            id: 1,
            title: "delectus aut autem",
            completed: false,
          },
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
