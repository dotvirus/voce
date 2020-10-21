import ava from "ava";
import { checkFiles } from "../src/util";

ava.serial("Check files", (t) => {
  t.deepEqual(checkFiles(["package.json", "no.json"]), ["no.json"]);
});
