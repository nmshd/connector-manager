import chalk from "chalk"
import { ConnectorDefinition } from "./Config.js"

export async function waitForConnectorToBeHealthy(connector: ConnectorDefinition): Promise<boolean> {
  console.log(`Waiting for connector ${chalk.green(connector.id)} to be healthy...`)

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
