export default function (_ctx: any) {
  return {
    title: "Google",
    steps: [
      {
        url: () => "https://google.com",
        title: "HEAD google",
        status: 200,
        method: "HEAD",
      },
      {
        url: "https://google.com",
        title: "GET google",
        status: 200,
      },
      {
        url: "https://google.com",
        title: "GET google",
        status: 2040,
      },
    ],
  };
}
