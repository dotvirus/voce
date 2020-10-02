import yargs = require("yargs");

export default yargs
  .scriptName("ultra-api")
  .version("0.0.1")
  .command("$0 [files..]", "Count lines in path")
  .options({
    register: {
      type: "array",
      default: [],
    },
  }).argv;
