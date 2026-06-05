import type { HistoryPort } from "./port.ts";
import type { AttemptInput, AttemptRecord } from "./types.ts";

export interface SessionHistoryCache {
  getRecords(): readonly AttemptRecord[];
  historyPort: HistoryPort;
}

export interface CreateSessionHistoryCacheOptions {
  initialRecords?: readonly AttemptRecord[];
}

export function createSessionHistoryCache(
  port: HistoryPort,
  options: CreateSessionHistoryCacheOptions = {},
): SessionHistoryCache {
  let records: AttemptRecord[] = options.initialRecords ? [...options.initialRecords] : [];

  if (!options.initialRecords) {
    void port.getAllAttempts().then((loaded) => {
      records = [...loaded];
    });
  }

  return {
    getRecords: () => records,
    historyPort: {
      getAllAttempts: async () => [...records],
      saveAttempt: async (input: AttemptInput) => {
        await port.saveAttempt(input);
        records.push({ ...input });
      },
    },
  };
}
