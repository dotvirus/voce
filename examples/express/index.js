const app = require("./app");

module.exports = (port = 8080) => {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      resolve(() => server.close());
    });
  });
};
