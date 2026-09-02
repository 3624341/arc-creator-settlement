import { mkdirSync } from "node:fs";

export function ensureRecoveryDirectory(path: string) {
  mkdirSync(path, { recursive: true });
  return path;
}
