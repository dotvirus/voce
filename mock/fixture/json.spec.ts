import { Workflow } from "../../src/workflow";

export default function (_ctx: any): Workflow {
  return {
    title: "JSON placeholder",
    baseUrl: "https://jsonplaceholder.typicode.com",
    steps: [
      {
        url: "/todos/1",
        status: 200,
        resBody: {
          userId: 1,
          id: 1,
          title: "delectus aut autem",
          completed: false,
        },
      },
      {
        todo: true,
        url: "/todos/1",
        status: 200,
        resBody: {
          userId: 1,
          id: 1,
          title: "delectus aut autem",
          completed: false,
        },
      },
    ],
  };
}
