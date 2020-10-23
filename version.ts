const pkg = require("./package.json");
import { version } from "./src/args";

const releaseVersion = process.argv[2];

if (pkg.version === version && version === releaseVersion) {
  console.log("Version OK");
  process.exit(0);
}
console.log("Version mismatch");
process.exit(1);
