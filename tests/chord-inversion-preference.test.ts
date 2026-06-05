import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  getActiveInversions,
  getSelectableInversions,
  getSelectedInversionIds,
  isInversionSelected,
  resetInversionPreference,
  setInversionSelected,
} from "../src/chord-inversion-preference.ts"

describe("chord inversion preference", () => {
  beforeEach(() => {
    resetInversionPreference()
  })

  afterEach(() => {
    resetInversionPreference()
  })

  it("defaults to all selectable inversions", () => {
    const selectableIds = getSelectableInversions().map((inv) => inv.id)
    expect(getSelectedInversionIds()).toEqual(selectableIds)
    expect(getActiveInversions()).toHaveLength(selectableIds.length)
  })

  it("persists selected inversions", () => {
    setInversionSelected("root", false)

    expect(getSelectedInversionIds()).toEqual(["first", "second"])
    expect(isInversionSelected("root")).toBe(false)
    expect(isInversionSelected("first")).toBe(true)
  })

  it("allows deselecting all inversions", () => {
    setInversionSelected("root", false)
    setInversionSelected("first", false)
    setInversionSelected("second", false)

    expect(getSelectedInversionIds()).toEqual([])
    expect(getActiveInversions()).toEqual([])
  })
})
