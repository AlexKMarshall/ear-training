import { describe, expect, it } from "vitest"
import { excludeLegacyRecords, isLegacyChordAttempt } from "../../src/history/legacy-records.ts"
import { attempt } from "../fixtures/attempts.ts"

describe("legacy chord attempts", () => {
  it("detects chord-middle practice mode", () => {
    expect(
      isLegacyChordAttempt(
        attempt({
          practiceModeId: "chord-middle" as never,
          passed: true,
          attemptNumber: 1,
          centsOff: 0,
        }),
      ),
    ).toBe(true)
  })

  it("detects chord-1a content tier", () => {
    expect(
      isLegacyChordAttempt(
        attempt({
          practiceModeId: "chord-sing",
          contentTierId: "chord-1a" as never,
          passed: true,
          attemptNumber: 1,
          centsOff: 0,
        }),
      ),
    ).toBe(true)
  })

  it("keeps chord-sing attempts", () => {
    expect(
      isLegacyChordAttempt(
        attempt({
          practiceModeId: "chord-sing",
          contentTierId: "chord-major-root",
          passed: true,
          attemptNumber: 1,
          centsOff: 0,
        }),
      ),
    ).toBe(false)
  })

  it("filters legacy records from unlock and stats inputs", () => {
    const records = [
      attempt({
        practiceModeId: "chord-middle" as never,
        contentTierId: "chord-1a" as never,
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
      attempt({
        practiceModeId: "chord-sing",
        contentTierId: "chord-major-root",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
    ]
    expect(excludeLegacyRecords(records)).toHaveLength(1)
    expect(excludeLegacyRecords(records)[0]?.practiceModeId).toBe("chord-sing")
  })
})
