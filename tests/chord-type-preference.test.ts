import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetInversionPreference } from "../src/chord-inversion-preference.ts";
import {
  getActiveChordTypes,
  getSelectableChordTypes,
  getSelectedChordTypeIds,
  isChordTypeSelected,
  resetChordTypePreference,
  setChordTypeSelected,
} from "../src/chord-type-preference.ts";

describe("chord type preference", () => {
  beforeEach(() => {
    resetChordTypePreference();
    resetInversionPreference();
  });

  afterEach(() => {
    resetChordTypePreference();
    resetInversionPreference();
  });

  it("defaults to all selectable chord types", () => {
    const selectableIds = getSelectableChordTypes().map((t) => t.id);
    expect(getSelectedChordTypeIds()).toEqual(selectableIds);
    expect(getActiveChordTypes()).toHaveLength(selectableIds.length);
  });

  it("persists selected chord types", () => {
    setChordTypeSelected("diminished-triad-sing-middle", false);

    expect(getSelectedChordTypeIds()).toEqual([
      "major-triad-sing-middle",
      "minor-triad-sing-middle",
    ]);
    expect(isChordTypeSelected("major-triad-sing-middle")).toBe(true);
    expect(isChordTypeSelected("diminished-triad-sing-middle")).toBe(false);
  });

  it("allows deselecting all chord types", () => {
    setChordTypeSelected("major-triad-sing-middle", false);
    setChordTypeSelected("minor-triad-sing-middle", false);
    setChordTypeSelected("diminished-triad-sing-middle", false);

    expect(getSelectedChordTypeIds()).toEqual([]);
    expect(getActiveChordTypes()).toEqual([]);
  });
});
