import { describe, expect, it } from "vitest";
import { createMemoryHistoryPort } from "../../src/history/port.ts";
import { createSessionHistoryCache } from "../../src/history/session-cache.ts";
import type { AttemptInput } from "../../src/history/types.ts";

const sampleAttempt = (overrides: Partial<AttemptInput> = {}): AttemptInput => ({
  practiceModeId: "interval-melodic-sing",
  passed: true,
  timestamp: 1,
  ...overrides,
});

describe("createSessionHistoryCache", () => {
  it("seeds getRecords synchronously when initialRecords is provided", () => {
    const port = createMemoryHistoryPort();
    const seeded = [sampleAttempt({ timestamp: 10 }), sampleAttempt({ timestamp: 20 })];
    const cache = createSessionHistoryCache(port, { initialRecords: seeded });

    expect(cache.getRecords()).toHaveLength(2);
    expect(cache.getRecords()[0]?.timestamp).toBe(10);
  });

  it("appends to getRecords when saveAttempt runs on historyPort", async () => {
    const port = createMemoryHistoryPort();
    const cache = createSessionHistoryCache(port, { initialRecords: [] });

    await cache.historyPort.saveAttempt(sampleAttempt({ timestamp: 5 }));

    expect(cache.getRecords()).toHaveLength(1);
    expect(cache.getRecords()[0]?.timestamp).toBe(5);
  });

  it("delegates saveAttempt to the backing port", async () => {
    const port = createMemoryHistoryPort();
    const cache = createSessionHistoryCache(port, { initialRecords: [] });

    await cache.historyPort.saveAttempt(sampleAttempt({ timestamp: 7 }));

    const backingRecords = await port.getAllAttempts();
    expect(backingRecords).toHaveLength(1);
    expect(backingRecords[0]?.timestamp).toBe(7);
  });

  it("returns the in-memory mirror from historyPort.getAllAttempts", async () => {
    const port = createMemoryHistoryPort();
    const seeded = [sampleAttempt({ timestamp: 3 })];
    const cache = createSessionHistoryCache(port, { initialRecords: seeded });

    const mirrored = await cache.historyPort.getAllAttempts();
    expect(mirrored).toHaveLength(1);
    expect(mirrored[0]?.timestamp).toBe(3);
  });
});
