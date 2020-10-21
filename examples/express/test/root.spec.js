const startServer = require("..");

module.exports.default = async () => {
  const port = 8080;
  await startServer(port);

  return {
    title: "Express example",
    baseUrl: `http://localhost:${port}`,
    steps: [
      {
        url: "/",
        status: 200,
        resBody: "Hello world!",
      },
      {
        url: "/greet/test",
        status: 200,
        resBody: "Hello test!",
      },
      {
        url: "/greet/peter",
        status: 200,
        resBody: "Hello peter!",
      },
    ],
  };
};
