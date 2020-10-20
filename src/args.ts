import yargs = require("yargs");

export default yargs
  .scriptName("api-tester")
  .command("$0 [files..]", "Test files")
  .version("0.0.1")
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
  }).argv;
