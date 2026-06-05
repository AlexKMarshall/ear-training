/** Dev/QA only: `?unlock=all` bypasses curriculum locks for exercise access (not progress). */
export function isUnlockAllEnabled(search = globalThis.location?.search ?? ""): boolean {
  return new URLSearchParams(search).get("unlock") === "all"
}
