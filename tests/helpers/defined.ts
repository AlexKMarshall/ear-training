export function defined<T>(value: T | undefined | null, label = "value"): T {
  if (value === undefined || value === null) {
    throw new Error(`Expected ${label} to be defined`)
  }
  return value
}
