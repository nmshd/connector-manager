import chalk from "chalk"
import fs from "fs"
import * as yargs from "yargs"
import { ConnectorDefinition } from "../connector-config/Config.js"
import { BaseCommand } from "./BaseCommand.js"

export interface CreateCommandArgs {
  name: string
  version: string
}

export class CreateCommand extends BaseCommand<CreateCommandArgs> {
  public static builder: yargs.BuilderCallback<any, CreateCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string", demandOption: true })
      .option("version", { type: "string", demandOption: true })
      .check((argv) => {
        if (argv.name === "all") return "The name 'all' is reserved."
        return true
      })

  protected async runInternal(args: CreateCommandArgs): Promise<void> {
    const existsResponse = await this._releaseManager.exists(args.version)
    if (existsResponse) {
      console.error(existsResponse)
      process.exit(1)
    }

    console.log("Creating connector...")

    const apiKey = "OD3fMLcBGyQ2eCpI9JdTYRozltF"
    const port = 8080 + this._config.connectors.length - 1
    const connectorDefinition: ConnectorDefinition = await this.createConnector(args.name, args.version, apiKey, port)

    await this._processManager.start(args.name)

    console.log(`Successfully created the connector ${chalk.green(args.name)}.\n`)

    await this.showInstances([connectorDefinition])
  }

  private async createConnector(name: string, version: string, apiKey: string, port: number): Promise<ConnectorDefinition> {
    if (this._config.connectors.find((c) => c.name === name)) {
      console.error(`A connector with the name ${chalk.red(name)} already exists.`)
      process.exit(1)
    }

    const connectorDefinition = this._config.addConnector(version, name)
    await this._config.save()

    fs.writeFileSync(
      this.getConnectorConfigFile(name),
      JSON.stringify(
        {
          database: {
            connectionString: this._config.dbConnectionString,
            dbName: name,
          },
          transportLibrary: {
            baseUrl: this._config.platformBaseUrl,
            platformClientId: this._config.platformClientId,
            platformClientSecret: this._config.platformClientSecret,
          },
          logging: { categories: { default: { appenders: ["console"] } } },
          infrastructure: { httpServer: { apiKey, port } },
        },
        null,
        2
      )
    )

    return connectorDefinition
  }
}
