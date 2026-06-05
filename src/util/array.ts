export function pickRandom<T>(items: readonly T[], rng: () => number = Math.random): T {
  if (items.length === 0) {
    throw new Error("pickRandom: cannot pick from an empty list")
  }
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) {
    throw new Error("pickRandom: cannot pick from an empty list")
  }
  return item
}

export function medianSorted(sorted: readonly number[]): number {
  if (sorted.length === 0) {
    throw new Error("medianSorted: empty input")
  }
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    const left = sorted[mid - 1]
    const right = sorted[mid]
    if (left === undefined || right === undefined) {
      throw new Error("medianSorted: empty input")
    }
    return (left + right) / 2
  }
  const center = sorted[mid]
  if (center === undefined) {
    throw new Error("medianSorted: empty input")
  }
  return center
}
