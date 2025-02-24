import { DisplayNameJSON } from "@nmshd/content"
import chalk from "chalk"
import { ProcessDescription } from "pm2"
import { table } from "table"
import { Config, ConnectorDefinition } from "../utils/Config.js"
import { getAppDir } from "../utils/getAppDir.js"
import { ProcessManager } from "../utils/ProcessManager.js"
import { ReleaseManager } from "../utils/ReleaseManager.js"

export abstract class BaseCommand<TArgs> {
  protected _releaseManager!: ReleaseManager
  protected _processManager!: ProcessManager
  protected _config!: Config

  public async run(args: TArgs, requireInit = true): Promise<any> {
    const config = await Config.load(getAppDir())

    if (!config.isInitialized && requireInit) {
      console.error("The Connector Manager was not initialized. Please run the init command.")
      process.exit(1)
    }

    this._releaseManager = new ReleaseManager()
    this._processManager = new ProcessManager(config, this._releaseManager)
    await this._processManager.init()
    this._config = config

    try {
      await this.runInternal(args)
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(chalk.red(e.message))
      } else {
        console.error(e)
      }

      this._processManager.pm2.disconnect()
      process.exit(1)
    } finally {
      this._processManager.pm2.disconnect()
      process.exit(0)
    }
  }

  protected abstract runInternal(args: TArgs): Promise<void> | void

  protected async showInstances(connectors: ConnectorDefinition[]): Promise<void> {
    const tableEntries: (string | number)[][] = [["ID", "Version", "Status", "CPU", "Memory", "Uptime", "PID", "Port", "Api Key", "Display Name(s)"]]

    const statuses = await this._processManager.status(connectors.length === 1 ? connectors[0].id : "all")

    const promises = connectors.map((connector) =>
      this.getConnectorInfo(
        connector,
        statuses.find((status) => status.name === connector.id)
      )
    )

    const entries = await Promise.all(promises)

    tableEntries.push(...entries)

    console.log(table(tableEntries))
  }

  private async getConnectorInfo(connector: ConnectorDefinition, status: ProcessDescription | undefined): Promise<(string | number)[]> {
    const connectorInfo = [
      connector.id,
      connector.version,
      status?.pid ? chalk.green("running") : chalk.red("stopped"),
      typeof status?.monit?.cpu !== "undefined" ? `${status.monit.cpu}%` : "",
      typeof status?.monit?.memory !== "undefined" ? `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(status.monit.memory / 1000000)}MB` : "",
      status?.pm2_env?.pm_uptime ? formatDuration(Date.now() - status.pm2_env.pm_uptime) : "",
      status?.pid ?? "",
      connector.config.infrastructure.httpServer.port.toString(),
      connector.config.infrastructure.httpServer.apiKey,
    ]

    if (!status?.pid) {
      connectorInfo.push("<unknown>")
      return connectorInfo
    }

    try {
      const result = await connector.sdk.attributes.getOwnRepositoryAttributes({ "content.value.@type": "DisplayName", onlyLatestVersions: true })
      if (result.isError) {
        logDisplayNameFetchError(result.error.message)
        connectorInfo.push(chalk.red("Error"))
      } else {
        const displayNames = result.result.map((attribute) => (attribute.content.value as DisplayNameJSON).value)
        connectorInfo.push(displayNames.join(", "))
      }
    } catch (error: any) {
      if (error?.message) {
        logDisplayNameFetchError(error?.message)
      } else {
        logDisplayNameFetchError(JSON.stringify(error))
      }
      connectorInfo.push(chalk.red("Error"))
    }

    function logDisplayNameFetchError(errorMessage: string) {
      console.error(`An error occurred while fetching the display name(s) for connector ${connector.id}: "${errorMessage}"`)
    }

    return connectorInfo
  }
}

const formatDuration = (ms: number) => {
  if (ms < 0) ms = -ms
  const time = {
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
  }

  if (time.d > 0) return `${time.d}d${time.h}h`
  if (time.h > 0) return `${time.h}h${time.m}m`
  if (time.m > 0) return `${time.m}m${time.s}s`
  return `${time.s}s`
}
