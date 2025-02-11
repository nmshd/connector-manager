import * as fs from "fs"

export class Config {
  private static readonly DEFAULT_CONFIG_PATH = "./config.json"

  static #instance: Config | undefined

  public dbConnectionString: string = undefined!
  public platformClientId: string = undefined!
  public platformClientSecret: string = undefined!
  public connectors: ConnectorDefinition[] = undefined!

  private constructor() {} // eslint-disable-line @typescript-eslint/no-empty-function

  public static async load(configPath = Config.DEFAULT_CONFIG_PATH): Promise<void> {
    const configFile = await fs.promises.readFile(configPath, "utf-8")
    const configData = JSON.parse(configFile)

    this.#instance = Object.assign(new Config(), configData)
  }

  public static get instance(): Config {
    if (!this.#instance) {
      throw new Error("Config not loaded. Call Config.load() first.")
    }

    return this.#instance
  }

  public async save(configPath = Config.DEFAULT_CONFIG_PATH): Promise<void> {
    await fs.promises.writeFile(configPath, JSON.stringify(this, null, 2))
  }
}

export interface ConnectorDefinition {
  connectorConfigFile: string
  version: string
  displayName: string
}
