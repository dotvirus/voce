import { existsSync } from "fs";

export function checkFiles(files: Array<string>): Array<string> {
  const notFound: Array<string> = [];
  for (const file of files) {
    if (!existsSync(file)) {
      notFound.push(file);
    }
  }
  return notFound;
}
