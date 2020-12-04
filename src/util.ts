import yxc, { AnyHandler } from "@dotvirus/yxc";
import chalk from "chalk";
import { existsSync } from "fs";

export const functionType = (): AnyHandler =>
  yxc.any().rule((v) => typeof v === "function");

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
