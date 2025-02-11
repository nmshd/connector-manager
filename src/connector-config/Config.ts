import * as fs from "fs"

export class Config {
  public dbConnectionString = "mongodb://localhost"
  public connectors: ConnectorDefinition[] = []

  private constructor(private readonly configPath: string) {}

  public static async load(configPath: string): Promise<Config> {
    if (fs.existsSync(configPath)) {
      const configFile = await fs.promises.readFile(configPath, "utf-8")
      const configData = JSON.parse(configFile)

      return Object.assign(new Config(configPath), configData)
    }

    return new Config(configPath)
  }

  public async save(): Promise<void> {
    await fs.promises.writeFile(this.configPath, JSON.stringify(this, null, 2))
  }
}

export interface ConnectorDefinition {
  version: string
  name: string
}
