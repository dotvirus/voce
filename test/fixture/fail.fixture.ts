import { defineWorkflow } from "../../src/workflow";
import { WorkflowStep } from "../../src/workflow_step";

export default defineWorkflow(() => {
  return {
    title: "Google",
    baseUrl: "https://google.com",
    steps: [new WorkflowStep(() => "/", 201).method("HEAD")],
  };
});
