import * as fs from "fs"

export class Config {
  static #instance: Config | undefined

  public dbConnectionString = ""
  public platformClientId = ""
  public platformClientSecret = ""
  public connectors: ConnectorDefinition[] = []

  private constructor() {} // eslint-disable-line @typescript-eslint/no-empty-function

  public static async load(configPath: string): Promise<void> {
    if (fs.existsSync(configPath)) {
      const configFile = await fs.promises.readFile(configPath, "utf-8")
      const configData = JSON.parse(configFile)

      this.#instance = Object.assign(new Config(), configData)
    }
  }

  public static get instance(): Config {
    if (!this.#instance) {
      throw new Error("Config not loaded. Call Config.load() first.")
    }

    return this.#instance
  }

  public async save(configPath: string): Promise<void> {
    await fs.promises.writeFile(configPath, JSON.stringify(this, null, 2))
  }
}

export interface ConnectorDefinition {
  connectorConfigFile: string
  version: string
  displayName: string
}
