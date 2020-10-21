import ava from "ava";
import { resolveWorkflow, Workflow } from "../src/workflow";

const fixture = [{}, { title: "test" }, { title: "test", steps: [] }];

fixture.forEach((test, i) => {
  ava.serial(`${i}: Should not be a valid workflow`, (t) => {
    t.throws(() => resolveWorkflow(test));
  });
});

ava.serial(`Should be a valid workflow`, (t) => {
  const wf: Workflow = {
    title: "Test",
    steps: [
      {
        url: "/",
        status: 200,
      },
    ],
  };
  t.deepEqual(resolveWorkflow(wf), wf);
});
