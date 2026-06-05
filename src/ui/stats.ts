import { render } from "solid-js/web"
import { createDefaultHistoryPort, type MountDeps } from "../history/port.ts"
import { computeDashboardStats } from "../history/stats.ts"
import { getPracticeMode } from "../practice-modes/registry.ts"
import { StatsView } from "./stats-view.tsx"

export async function mountStats(root: HTMLElement, deps: MountDeps = {}): Promise<void> {
  const history = deps.history ?? createDefaultHistoryPort()
  const records = await history.getAllAttempts()
  const stats = computeDashboardStats(records)
  const hasSingAttempts = records.some(
    (r) => getPracticeMode(r.practiceModeId).responseMode === "sing",
  )

  render(
    () =>
      StatsView({
        stats,
        hasSingAttempts,
      }),
    root,
  )
}
