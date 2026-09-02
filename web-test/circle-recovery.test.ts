import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ensureRecoveryDirectory } from "../lib/circle-recovery";

test("creates a missing Circle recovery directory", () => {
  const root = mkdtempSync(join(tmpdir(), "arc-circle-recovery-"));
  const recoveryPath = join(root, "recovery");

  try {
    assert.equal(ensureRecoveryDirectory(recoveryPath), recoveryPath);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
