import fs from "fs"
import * as yargs from "yargs"
import { getAppDir } from "../utils/getAppDir.js"
import { BaseCommand } from "./BaseCommand.js"

export interface CreateCommandArgs {
  name: string
  version: string
}

export class CreateCommand extends BaseCommand<CreateCommandArgs> {
  public static builder: yargs.BuilderCallback<any, CreateCommandArgs> = (yargs: yargs.Argv) =>
    yargs.option("name", { type: "string", demandOption: true }).option("version", { type: "string", demandOption: true })

  protected async runInternal(args: CreateCommandArgs): Promise<void> {
    const existsResponse = await this._releaseManager.exists(args.version)
    if (existsResponse) {
      console.error(existsResponse)
      process.exit(1)
    }

    console.log("Creating connector...")

    this._config.connectors.push({ name: args.name, version: args.version })
    await this._config.save()

    const connectorsDir = `${getAppDir()}/connectors`
    if (!fs.existsSync(connectorsDir)) fs.mkdirSync(connectorsDir, { recursive: true })
    const configDir = `${connectorsDir}/${args.name}.json`

    fs.writeFileSync(
      configDir,
      JSON.stringify(
        {
          database: {
            connectionString: this._config.dbConnectionString,
            dbName: args.name,
          },
          transportLibrary: {
            baseUrl: this._config.platformBaseUrl,
            platformClientId: this._config.platformClientId,
            platformClientSecret: this._config.platformClientSecret,
          },
          logging: {
            categories: {
              default: {
                appenders: ["console"],
              },
            },
          },
          infrastructure: {
            httpServer: {
              // TODO: generate random port
              apiKey: "OD3fMLcBGyQ2eCpI9JdTYRozltF",
              port: 8080 + this._config.connectors.length - 1,
            },
          },
        },
        null,
        2
      )
    )

    await this._processManager.start(args.name)

    console.log(`Successfully created the connector '${args.name}'.`)
  }
}
