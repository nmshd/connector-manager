export function parseConfigStrings(configurations?: string[]): any {
  if (!configurations) return

  const config: any = {}

  const configuration = configurations.join(";").trim()

  const configFields = configuration.split(";")

  for (const field of configFields) {
    const [keyPart, value] = field.split("=")
    if (!keyPart || !value) throw new Error(`Invalid additional configuration format. Expected 'key=value' pairs, but got '${field}'`)

    const keys = keyPart.split(/:|__/)

    const object = keys.slice(0, -1).reduce((acc, key) => (acc[key] ??= {}), config)
    object[keys.at(-1)!] = parseString(value)
  }

  return config
}

export function parseString(value: string) {
  try {
    return JSON.parse(value)
  } catch (_) {
    return value
  }
}
