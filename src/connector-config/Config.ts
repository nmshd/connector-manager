import fs from "fs"
import path from "path"

export class Config {
  public dbConnectionString = ""
  public platformClientId = ""
  public platformClientSecret = ""
  public platformBaseUrl = ""

  public get isInitialized(): boolean {
    return !!this.dbConnectionString && !!this.platformClientId && !!this.platformClientSecret && !!this.platformBaseUrl
  }

  public connectors: ConnectorDefinition[] = []

  private constructor(private readonly configPath: string) {}

  public static async load(configPath: string): Promise<Config> {
    const config = new Config(configPath)

    if (fs.existsSync(configPath)) {
      const fileContentAsString = await fs.promises.readFile(configPath, "utf-8")
      const fileContentAsJson = JSON.parse(fileContentAsString)
      config.fillFromJson(fileContentAsJson)
    }

    return config
  }

  private fillFromJson(json: any) {
    this.dbConnectionString = json.dbConnectionString
    this.platformClientId = json.platformClientId
    this.platformClientSecret = json.platformClientSecret
    this.platformBaseUrl = json.platformBaseUrl
    this.connectors = json.connectors.map((c: any) => ConnectorDefinition.fromJson(c))
  }

  public async save(): Promise<void> {
    const configDirectory = path.dirname(this.configPath)

    if (!fs.existsSync(configDirectory)) {
      await fs.promises.mkdir(configDirectory, { recursive: true })
    }

    await fs.promises.writeFile(this.configPath, JSON.stringify(this.toJson(), null, 2))
  }

  private toJson(): any {
    return {
      dbConnectionString: this.dbConnectionString,
      platformClientId: this.platformClientId,
      platformClientSecret: this.platformClientSecret,
      platformBaseUrl: this.platformBaseUrl,
      connectors: this.connectors.map((c) => c.toJson()),
    }
  }

  public addConnector(version: string, name: string): ConnectorDefinition {
    const connector = new ConnectorDefinition(version, name)
    this.connectors.push(connector)
    return connector
  }
}

export class ConnectorDefinition {
  public constructor(
    public version: string,
    public name: string
  ) {}

  public static fromJson(json: any): ConnectorDefinition {
    return new ConnectorDefinition(json.version, json.name)
  }

  public toJson(): any {
    return {
      version: this.version,
      name: this.name,
    }
  }
}
