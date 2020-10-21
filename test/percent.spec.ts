import ava from "ava";
import { getPercentString, percentFormatter } from "../src/util";

ava.serial("getPercentString", (t) => {
  t.is(getPercentString(1, 3), 33.33);
});

ava.serial("percentFormatter", (t) => {
  t.is(percentFormatter(10)(5), "50%");
});
