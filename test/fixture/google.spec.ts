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
