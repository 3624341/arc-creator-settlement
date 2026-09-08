export function getEscrowAddressFromCreatedLogs(logs: readonly unknown[]) {
  for (let index = logs.length - 1; index >= 0; index -= 1) {
    const log = logs[index];
    const args = log && typeof log === "object" && "args" in log ? (log as { args?: unknown }).args : undefined;
    const escrow = args && typeof args === "object" && "escrow" in args ? (args as { escrow?: unknown }).escrow : undefined;
    if (typeof escrow === "string" && /^0x[a-fA-F0-9]{40}$/.test(escrow)) {
      return escrow as `0x${string}`;
    }
  }
  return undefined;
}
