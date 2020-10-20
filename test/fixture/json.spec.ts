export default function (_ctx: any) {
  return {
    title: "JSON placeholder",
    steps: [
      {
        url: "https://jsonplaceholder.typicode.com/todos/1",
        title: "GET /todos/1",
        status: 200,
        resBody: {
          userId: 1,
          id: 1,
          title: "delectus aut autem",
          completed: false,
        },
      },
    ],
  };
}
