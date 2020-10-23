import ava from "ava";
import { runWorkflow } from "../src/runner";
import yxc from "@dotvirus/yxc";

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
          resBody: yxc.object({
            userId: yxc.number().eq(1),
            id: yxc.number().eq(1),
            title: yxc.string().eq("delectus aut autem"),
            completed: yxc.boolean().false(),
          }),
        },
        {
          url: "/todos/1",
          status: 200,
          resBody: () =>
            yxc.object({
              userId: yxc.number().eq(1),
              id: yxc.number().eq(1),
              title: yxc.string().eq("delectus aut autem"),
              completed: yxc.boolean().false(),
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
    numSuccess: 3,
    numTodo: 0,
  });
});
