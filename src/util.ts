import chalk from "chalk";
import { existsSync } from "fs";
import glob from "glob";
import { promisify } from "util";

import log from "./log";

export function getMissingFiles(files: Array<string>): Array<string> {
  const notFound: Array<string> = [];
  for (const file of files) {
    if (!existsSync(file)) {
      notFound.push(file);
    }
  }
  return notFound;
}

export function getPercentString(num: number, max: number, fixed = 2): number {
  return parseFloat((100 * (num / max)).toFixed(fixed));
}

export function percentFormatter(max: number) {
  return function (num: number): string {
    return chalk.grey(`${getPercentString(num, max)}%`);
  };
}

export const globPromise = promisify(glob);

/**
 * Finds all files described by multiple glob patterns
 */
export async function globFiles(
  input: string[],
  cwd: string,
): Promise<string[]> {
  const files = [
    ...new Set(
      (
        await Promise.all(
          input.map((item) =>
            globPromise(item, { cwd, nodir: true, absolute: true }),
          ),
        )
      ).flat(),
    ),
  ];
  return files;
}

/**
 * Visit files described by multiple glob expressions
 */
export async function* fileVisitor(
  globs: string[],
  cwd = process.cwd(),
): AsyncGenerator<string> {
  for (const globExp of globs) {
    const files = await globPromise(globExp, { cwd });

    log("Glob result:");
    log(files);

    for (const file of files) {
      yield file;
    }
  }
}
