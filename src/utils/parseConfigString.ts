export function parseConfigString(configuration?: string): any {
  if (!configuration) return

  const configFields = configuration.split(";")

  const config: any = {}
  for (const field of configFields) {
    const [keyPart, value] = field.split("=")
    if (!keyPart || !value) throw new Error(`Invalid additional configuration format. Expected 'key=value' pairs, but got '${field}'`)

    const keys = keyPart.split(/:|__/)

    const object = keys.slice(0, -1).reduce((acc, key) => (acc[key] ??= {}), config)
    object[keys.at(-1)!] = value
  }

  return config
}
