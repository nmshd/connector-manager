import { parseString } from "./parseString.js"

export function parseConfigStrings(configurations?: string[]): any {
  if (!configurations) return

  const config: any = {}

  const configFields = configurations.flatMap((config) => config.trim().split(";"))

  for (const field of configFields) {
    const [propertyPath, value] = field.split("=")
    if (!propertyPath || !value) throw new Error(`Invalid additional configuration format. Expected 'key=value' pairs, but got '${field}'`)

    const propertyPathElements = propertyPath.split(/:|__/)

    const object = propertyPathElements.slice(0, -1).reduce((acc, key) => (acc[key] ??= {}), config)
    object[propertyPathElements.at(-1)!] = parseString(value)
  }

  return config
}
