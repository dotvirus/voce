import { Workflow } from "../../src/workflow";

export default function (_ctx: any): Workflow {
  return {
    title: "Google",
    baseUrl: "https://google.com",
    steps: [
      {
        url: () => "/",
        title: "HEAD google",
        status: 200,
        method: "HEAD",
        todo: true,
      },
      {
        url: "/",
        title: "GET google",
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
      },
      {
        skip: true,
        url: "/",
        title: "GET google",
        status: 200,
      },
    ],
  };
}
