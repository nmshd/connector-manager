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
        if (fs.existsSync(c.directory)) {
          await fs.promises.rm(c.directory, { recursive: true, force: true })
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

  public addConnector(
    version: string,
    name: string,
    dbConnectionString?: string,
    platformBaseUrl?: string,
    platformClientId?: string,
    platformClientSecret?: string
  ): ConnectorDefinition {
    if (this.existsConnector(name)) {
      throw new Error(`A connector with the name ${name} already exists.`)
    }

    dbConnectionString = dbConnectionString === "" || dbConnectionString === undefined ? this.dbConnectionString : dbConnectionString
    platformBaseUrl = platformBaseUrl === "" || platformBaseUrl === undefined ? this.platformBaseUrl : platformBaseUrl
    platformClientId = platformClientId === "" || platformClientId === undefined ? this.platformClientId : platformClientId
    platformClientSecret = platformClientSecret === "" || platformClientSecret === undefined ? this.platformClientSecret : platformClientSecret

    const connector = new ConnectorDefinition(this.appDir, name, version, {
      database: {
        connectionString: dbConnectionString,
        dbName: name,
      },
      transportLibrary: {
        baseUrl: platformBaseUrl,
        platformClientId: platformClientId,
        platformClientSecret: platformClientSecret,
      },
      logging: { categories: { default: { appenders: ["console"] } } },
      infrastructure: { httpServer: { apiKey: "", port: this.findFreePort() } },
    })

    connector.rotateApiKey()

    this.#connectors.push(connector)
    return connector
  }

  private findFreePort(): number {
    let port = 8080

    // eslint-disable-next-line no-loop-func
    while (this.#connectors.some((c) => c.config.infrastructure.httpServer.port === port)) port++

    return port
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
  public constructor(
    private readonly appDir: string,
    public readonly name: string,
    public version: string,
    public config: ConnectorConfig
  ) {}

  public get directory(): string {
    return path.join(this.appDir, "connectors", this.name)
  }

  public get configFilePath(): string {
    return path.join(this.directory, "config.json")
  }

  public get logFilePath(): string {
    return path.join(this.directory, "logs.txt")
  }

  public static async load(json: any, appDir: string): Promise<ConnectorDefinition> {
    const configPath = this.buildFilePath(appDir, json.name, "config.json")
    const configContent = await fs.promises.readFile(configPath)
    const configJson = JSON.parse(configContent.toString())
    return new ConnectorDefinition(appDir, json.name, json.version, configJson)
  }

  public rotateApiKey(): void {
    this.config.infrastructure.httpServer.apiKey = generateRandomString()
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

export function generateRandomString() {
  const minLength = 30
  const maxLength = 40

  const pools = [
    {
      chars: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
      minimumNumberOfOccurrences: 2,
    },

    {
      chars: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
      minimumNumberOfOccurrences: 2,
    },
    {
      chars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      minimumNumberOfOccurrences: 2,
    },
    {
      chars: ["!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~", "]"],
      minimumNumberOfOccurrences: 1,
    },
  ]
  const allChars = pools.flatMap((pool) => pool.chars)
  let password = ""

  while (password.length < minLength) {
    const pool = pools[Math.floor(Math.random() * pools.length)]
    password += pool.chars[Math.floor(Math.random() * pool.chars.length)]
  }

  while (password.length < maxLength) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  password = password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("")

  pools.forEach((pool) => {
    const occurrences = password.split("").filter((char) => pool.chars.includes(char)).length
    if (occurrences < pool.minimumNumberOfOccurrences) {
      throw new Error("Password does not meet the pool requirements")
    }
  })

  return password
}
