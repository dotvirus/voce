import { Workflow } from "../../src/workflow";

export default function (_ctx: any): Workflow {
  return {
    title: "Google",
    baseUrl: "https://google.com",
    steps: [
      {
        todo: true,
        url: () => "/",
        status: 200,
        method: "HEAD",
      },
    ],
  };
}
