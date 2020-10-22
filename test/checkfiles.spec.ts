import ava from "ava";
import { getMissingFiles } from "../src/util";

ava.serial("Get missing files", (t) => {
  t.deepEqual(getMissingFiles(["package.json", "no.json"]), ["no.json"]);
});
