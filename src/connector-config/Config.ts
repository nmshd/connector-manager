import crypto from "crypto"
import fs from "fs"
import path from "path"

export class Config {
  public dbConnectionString = ""
  public platformClientId = ""
  public platformClientSecret = ""
  public platformBaseUrl = ""

  private deletedConnectors: ConnectorDefinition[] = []

  public get isInitialized(): boolean {
    return !!this.dbConnectionString && !!this.platformClientId && !!this.platformClientSecret && !!this.platformBaseUrl
  }

  private get configPath(): string {
    return path.join(this.appDir, "config.json")
  }

  #connectors: ConnectorDefinition[] = []
  public get connectors(): ConnectorDefinition[] {
    return this.#connectors
  }

  public constructor(private readonly appDir: string) {}

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
    this.#connectors = await Promise.all(json.connectors.map(async (c: any) => await ConnectorDefinition.load(c, this.appDir)))
  }

  public async save(): Promise<void> {
    if (!fs.existsSync(this.appDir)) {
      await fs.promises.mkdir(this.appDir, { recursive: true })
    }

    await fs.promises.writeFile(this.configPath, JSON.stringify(this.toJson(), null, 2))

    await Promise.all(
      this.#connectors.map(async (connector) => {
        const connectorConfigPath = connector.configFilePath
        const connectorsConfigPathDirectory = path.dirname(connectorConfigPath)

        if (!fs.existsSync(connectorsConfigPathDirectory)) {
          await fs.promises.mkdir(connectorsConfigPathDirectory, { recursive: true })
        }

        await fs.promises.writeFile(connectorConfigPath, JSON.stringify(connector.config, null, 2))
      })
    )

    await Promise.all(
      this.deletedConnectors.map(async (c) => {
        if (fs.existsSync(c.configFilePath)) {
          await fs.promises.unlink(c.configFilePath)
        }

        if (fs.existsSync(c.logFilePath)) {
          await fs.promises.unlink(c.logFilePath)
        }
      })
    )

    this.deletedConnectors = []
  }

  private toJson(): any {
    return {
      dbConnectionString: this.dbConnectionString,
      platformClientId: this.platformClientId,
      platformClientSecret: this.platformClientSecret,
      platformBaseUrl: this.platformBaseUrl,
      connectors: this.#connectors.map((c) => c.toJson()),
    }
  }

  public addConnector(version: string, name: string, port: number): ConnectorDefinition {
    const connector = new ConnectorDefinition(this.appDir, version, name, {
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
      infrastructure: { httpServer: { apiKey: "", port } },
    })

    connector.rotateApiKey()

    this.#connectors.push(connector)
    return connector
  }

  public deleteConnector(name: string): void {
    const connector = this.#connectors.find((c) => c.name === name)

    if (!connector) return

    this.#connectors = this.#connectors.filter((c) => c.name !== name)

    this.deletedConnectors.push(connector)
  }

  public existsConnector(name: string): boolean {
    return this.#connectors.some((c) => c.name === name)
  }

  public getConnector(name: string): ConnectorDefinition | undefined {
    return this.#connectors.find((c) => c.name === name)
  }
}

export class ConnectorDefinition {
  private static readonly API_KEY_CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-="

  public constructor(
    private readonly appDir: string,
    public version: string,
    public name: string,
    public config: ConnectorConfig
  ) {}

  public get configFilePath(): string {
    return ConnectorDefinition.buildFilePath(this.appDir, this.name, "config.json")
  }

  public get logFilePath(): string {
    return ConnectorDefinition.buildFilePath(this.appDir, this.name, "logs.txt")
  }

  public static async load(json: any, appDir: string): Promise<ConnectorDefinition> {
    const configPath = this.buildFilePath(appDir, json.name, "config.json")
    const configContent = await fs.promises.readFile(configPath)
    const configJson = JSON.parse(configContent.toString())
    return new ConnectorDefinition(appDir, json.version, json.name, configJson)
  }

  public rotateApiKey(): void {
    const length = Math.floor(Math.random() * 11) + 20 // Random length between 20 and 30
    let apiKey = ""
    const randomValues = crypto.randomBytes(length)
    for (let i = 0; i < length; i++) {
      apiKey += ConnectorDefinition.API_KEY_CHARSET[randomValues[i] % ConnectorDefinition.API_KEY_CHARSET.length]
    }
    this.config.infrastructure.httpServer.apiKey = apiKey
  }

  public toJson(): any {
    return {
      version: this.version,
      name: this.name,
    }
  }

  private static buildFilePath(appDir: string, name: string, file: string): string {
    return path.join(appDir, "connectors", name, file)
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
