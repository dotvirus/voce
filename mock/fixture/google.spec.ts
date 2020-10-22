import { Workflow } from "../../src/workflow";

export default function (_ctx: any): Workflow {
  return {
    title: "Google",
    baseUrl: "https://google.com",
    steps: [
      {
        url: () => "/",
        status: 201,
        method: "HEAD",
      },
      {
        url: "/",
        status: 200,
        validate: ({ response }) => {
          if (
            typeof response.data === "string" &&
            response.data.includes("window.google")
          ) {
            return true;
          }
          throw new Error("Not google home page");
        },
        todo: true,
      },
      {
        skip: true,
        url: "/",
        status: 200,
      },
    ],
  };
}
