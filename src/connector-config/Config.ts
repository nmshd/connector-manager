import fs from "fs"
import path from "path"

export class Config {
  public dbConnectionString = ""
  public platformClientId = ""
  public platformClientSecret = ""
  public platformBaseUrl = ""

  private deletedConnectors: string[] = []

  public get isInitialized(): boolean {
    return !!this.dbConnectionString && !!this.platformClientId && !!this.platformClientSecret && !!this.platformBaseUrl
  }

  private get configPath(): string {
    return path.join(this.appDir, "config.json")
  }

  public connectors: ConnectorDefinition[] = []

  private constructor(private readonly appDir: string) {}

  public static async load(appDir: string): Promise<Config> {
    const config = new Config(appDir)

    if (fs.existsSync(config.configPath)) {
      const fileContentAsString = await fs.promises.readFile(config.configPath, "utf-8")
      const fileContentAsJson = JSON.parse(fileContentAsString)
      await config.fillFromJson(fileContentAsJson)
    }

    return config
  }

  private async fillFromJson(json: any) {
    this.dbConnectionString = json.dbConnectionString
    this.platformClientId = json.platformClientId
    this.platformClientSecret = json.platformClientSecret
    this.platformBaseUrl = json.platformBaseUrl
    this.connectors = await Promise.all(json.connectors.map(async (c: any) => await ConnectorDefinition.load(c, this.appDir)))
  }

  public async save(): Promise<void> {
    if (!fs.existsSync(this.appDir)) {
      await fs.promises.mkdir(this.appDir, { recursive: true })
    }

    await fs.promises.writeFile(this.configPath, JSON.stringify(this.toJson(), null, 2))

    await Promise.all(
      this.connectors.map(async (connector) => {
        const connectorsDir = path.join(this.appDir, "connectors")
        const connectorConfigPath = path.join(connectorsDir, `${connector.name}.json`)

        if (!fs.existsSync(connectorsDir)) {
          await fs.promises.mkdir(connectorsDir, { recursive: true })
        }

        await fs.promises.writeFile(connectorConfigPath, JSON.stringify(connector.config, null, 2))
      })
    )

    await Promise.all(
      this.deletedConnectors.map(async (connectorName) => {
        const connectorsDir = path.join(this.appDir, "connectors")
        const connectorConfigPath = path.join(connectorsDir, `${connectorName}.json`)

        if (fs.existsSync(connectorConfigPath)) {
          await fs.promises.unlink(connectorConfigPath)
        }
      })
    )
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

  public addConnector(version: string, name: string, apiKey: string, port: number): ConnectorDefinition {
    const connector = new ConnectorDefinition(version, name, {
      database: {
        connectionString: this.dbConnectionString,
        dbName: name,
      },
      transportLibrary: {
        baseUrl: this.platformBaseUrl,
        platformClientId: this.platformClientId,
        platformClientSecret: this.platformClientSecret,
      },
      logging: { categories: { default: { appenders: ["console"] } } },
      infrastructure: { httpServer: { apiKey, port } },
    })
    this.connectors.push(connector)
    return connector
  }

  public deleteConnector(name: string): void {
    this.connectors = this.connectors.filter((c) => c.name !== name)

  public existsConnector(name: string): boolean {
    return this.connectors.some((c) => c.name === name)
  }

  public getConnector(name: string): ConnectorDefinition | undefined {
    return this.connectors.find((c) => c.name === name)
  }
}

export class ConnectorDefinition {
  public constructor(
    public version: string,
    public name: string,
    public config: ConnectorConfig
  ) {}

  public static async load(json: any, configDirectory: string): Promise<ConnectorDefinition> {
    const configPath = path.join(configDirectory, "connectors", `${json.name}.json`) // TODO: extract creation of config path
    const configContent = await fs.promises.readFile(configPath)
    const configJson = JSON.parse(configContent.toString())
    return new ConnectorDefinition(json.version, json.name, configJson)
  }

  public toJson(): any {
    return {
      version: this.version,
      name: this.name,
    }
  }
}

export interface ConnectorConfig {
  database: {
    connectionString: string
    dbName: string
  }
  transportLibrary: {
    baseUrl: string
    platformClientId: string
    platformClientSecret: string
  }
  logging: any
  infrastructure: { httpServer: { apiKey: string; port: number } }
}
