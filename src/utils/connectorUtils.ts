import { DisplayNameJSON } from "@nmshd/content"
import chalk from "chalk"
import { ConnectorDefinition } from "./Config.js"

export async function setDisplayName(connector: ConnectorDefinition, displayName: string) {
  const isHealthy = await waitForConnectorToBeHealthy(connector)
  if (!isHealthy) {
    console.error(`The connector ${chalk.red(connector.name)} did not become healthy. Could not set display name.`)
    return
  }

  const existingDisplayNames = await connector.sdk.attributes.getOwnRepositoryAttributes({
    "content.value.@type": "DisplayName",
    onlyLatestVersions: true,
  })

  if (existingDisplayNames.isError) {
    console.error(chalk.red(`Could not get existing display names: ${existingDisplayNames.error.message}`))
    return
  }

  if (existingDisplayNames.result.some((attribute) => (attribute.content.value as DisplayNameJSON).value === displayName)) {
    console.log(`Display name ${chalk.green(displayName)} already exists. Skipping...`)
    return
  }

  const result = await connector.sdk.attributes.createRepositoryAttribute({ content: { value: { "@type": "DisplayName", value: displayName } } })
  if (result.isError) {
    console.error(chalk.red(`Could not set display name: ${result.error.message}`))
    return
  }
}

export async function waitForConnectorToBeHealthy(connector: ConnectorDefinition): Promise<boolean> {
  console.log(`Waiting for connector ${chalk.green(connector.name)} to be healthy...`)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  let iterations = 0

  while (iterations < 500) {
    try {
      const response = await connector.sdk.monitoring.getHealth()
      if (response.isHealthy) return true
    } catch {
      // Ignore
    }

    iterations++
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return false
}
