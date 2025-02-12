import chalk from "chalk"
import fs from "fs"
import path from "path"
import { table } from "table"
import { Config, ConnectorDefinition } from "../connector-config/Config.js"
import { getAppDir } from "../utils/getAppDir.js"
import { ProcessManager } from "../utils/ProcessManager.js"
import { ReleaseManager } from "../utils/ReleaseManager.js"

export abstract class BaseCommand<TArgs> {
  protected _releaseManager!: ReleaseManager
  protected _processManager!: ProcessManager
  protected _config!: Config

  public async run(args: TArgs, requireInit = true): Promise<any> {
    const config = await Config.load(path.join(getAppDir(), "config.json"))

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
    } catch (e) {
      console.error(e)
      this._processManager.pm2.disconnect()
      process.exit(1)
    } finally {
      this._processManager.pm2.disconnect()
      process.exit(0)
    }
  }

  protected getConnectorConfigFile(connectorName: string): string {
    return `${this.connectorsDir}/${connectorName}.json`
  }

  private get connectorsDir(): string {
    const connectorsDir = `${getAppDir()}/connectors`

    if (!fs.existsSync(connectorsDir)) fs.mkdirSync(connectorsDir, { recursive: true })

    return connectorsDir
  }

  protected abstract runInternal(args: TArgs): Promise<void> | void

  protected async showInstances(connectors: ConnectorDefinition[]): Promise<void> {
    const tableEntries: string[][] = [["Name", "Version", "Status", "cpu", "mem", "Uptime", "PID", "Port", "Api Key"]]
    for (const connector of connectors) {
      const status = await this._processManager.status(connector.name)

      const configFile = this.getConnectorConfigFile(connector.name)
      const config = JSON.parse(fs.readFileSync(configFile, "utf-8"))

      tableEntries.push([
        connector.name,
        connector.version,
        status?.pid ? chalk.green("running") : chalk.red("stopped"),
        status?.monit?.cpu ?? "",
        status?.monit?.memory ?? "",
        formatDuration(Date.now() - (status?.pm2_env?.pm_uptime ?? 0)),
        status?.pid ?? "",
        config.infrastructure.httpServer.port,
        config.infrastructure.httpServer.apiKey,
      ])
    }

    console.log(table(tableEntries))
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
  return Object.entries(time)
    .filter((val) => val[1] !== 0)
    .map(([key, val]) => `${val}${key}`)
    .join(", ")
}
