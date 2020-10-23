import ava from "ava";
import { runWorkflow } from "../src/runner";

ava.serial("Response body as function & headers test", async (t) => {
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
          resBody: () => ({
            userId: 1,
            id: 1,
            title: "delectus aut autem",
            completed: false,
          }),
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
    numSuccess: 2,
    numTodo: 0,
  });
});
