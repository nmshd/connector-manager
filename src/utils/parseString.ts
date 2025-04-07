export function parseString(value: string) {
  try {
    return JSON.parse(value)
  } catch (_) {
    return value
  }
}
