import { defineWorkflow } from "../../src/workflow";
import { WorkflowStep } from "../../src/workflow_step";

export default defineWorkflow(() => {
  return {
    title: "Google",
    baseUrl: "https://google.com",
    steps: [new WorkflowStep(() => "/", 200).method("HEAD").skip()],
  };
});
