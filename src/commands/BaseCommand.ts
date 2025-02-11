import path from "path"
import { Config } from "../connector-config/Config.js"
import { getAppDir } from "../utils/getAppDir.js"
import { ProcessManager } from "../utils/ProcessManager.js"
import { ReleaseManager } from "../utils/ReleaseManager.js"

export abstract class BaseCommand<TArgs> {
  protected _releaseManager!: ReleaseManager
  protected _processManager!: ProcessManager
  protected _config!: Config

  public async run(args: TArgs): Promise<any> {
    const config = await Config.load(path.join(getAppDir(), "config.json"))

    if (!config.isInitialized) {
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

  protected abstract runInternal(args: TArgs): Promise<void>
}
