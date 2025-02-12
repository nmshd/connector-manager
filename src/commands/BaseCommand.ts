import chalk from "chalk"
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
    } catch (e) {
      console.error(e)
      this._processManager.pm2.disconnect()
      process.exit(1)
    } finally {
      this._processManager.pm2.disconnect()
      process.exit(0)
    }
  }

  protected abstract runInternal(args: TArgs): Promise<void> | void

  protected async showInstances(connectors: ConnectorDefinition[]): Promise<void> {
    const tableEntries: string[][] = [["Name", "Version", "Status", "Port", "Api Key"]]
    for (const connector of connectors) {
      const status = await this._processManager.status(connector.name)

      tableEntries.push([
        connector.name,
        connector.version,
        status?.pid ? chalk.green("running") : chalk.red("stopped"),
        connector.config.infrastructure.httpServer.port.toString(),
        connector.config.infrastructure.httpServer.apiKey,
      ])
    }

    console.log(table(tableEntries))
  }
}
