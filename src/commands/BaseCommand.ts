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
    this._processManager = new ProcessManager(config)
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
    const tableEntries: (string | number)[][] = [["ID", "Description", "Version", "Status", "CPU", "Memory", "Uptime", "PID", "Port", "Api Key"]]

    const statuses = await this._processManager.status(connectors.length === 1 ? connectors[0].id : "all")

    const entries = connectors.map((connector) =>
      this.getConnectorInfo(
        connector,
        statuses.find((status) => status.name === connector.id)
      )
    )

    tableEntries.push(...entries)

    console.log(table(tableEntries))
  }

  private getConnectorInfo(connector: ConnectorDefinition, status: ProcessDescription | undefined): (string | number)[] {
    const connectorInfo = [
      connector.id,
      connector.description ?? "",
      connector.version,
      status?.pid ? chalk.green("running") : chalk.red("stopped"),
      typeof status?.monit?.cpu !== "undefined" ? `${status.monit.cpu}%` : "",
      typeof status?.monit?.memory !== "undefined" ? `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(status.monit.memory / 1000000)}MB` : "",
      status?.pm2_env?.pm_uptime ? formatDuration(Date.now() - status.pm2_env.pm_uptime) : "",
      status?.pid ?? "",
      connector.config.infrastructure.httpServer.port.toString(),
      connector.config.infrastructure.httpServer.apiKey,
    ]

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
