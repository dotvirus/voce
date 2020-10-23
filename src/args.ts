import yargs = require("yargs");

export const version = "0.1.0";

export default yargs
  .scriptName("voce")
  .command("$0 [files..]", "Test files")
  .version(version)
  .options({
    register: {
      type: "array",
      default: [],
    },
    bail: {
      type: "boolean",
      default: false,
    },
    timeout: {
      type: "number",
      default: 15000,
    },
    "fail-skip": {
      type: "boolean",
      default: false,
    },
    "fail-todo": {
      type: "boolean",
      default: false,
    },
  }).argv;