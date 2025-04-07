import chalk from "chalk"
import * as yargs from "yargs"
import { waitForConnectorToBeHealthy } from "../utils/connectorUtils.js"
import { parseConfigStrings } from "../utils/parseConfigStrings.js"
import { BaseCommand } from "./BaseCommand.js"

export interface CreateCommandArgs {
  id: string
  description?: string
  version?: string
  port?: number
  dbConnectionString?: string
  baseUrl?: string
  clientId?: string
  clientSecret?: string
  additionalConfiguration?: string[]
}

export class CreateCommand extends BaseCommand<CreateCommandArgs> {
  public static builder: yargs.BuilderCallback<any, CreateCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("id", {
        type: "string",
        demandOption: true,
        description: "The id of the connector to create. Must be unique, contain only lowercase characters and must not contain any whitespace characters.",
      })
      .option("description", { type: "string", description: "The description of the connector to create. This is only used for display purposes." })
      .option("version", {
        type: "string",
        description:
          "The version of the connector to create. You can find a list of available versions on https://github.com/nmshd/connector/releases. If none is passed, the latest version is used.",
      })
      .option("port", { type: "number", description: "The port the connector should listen on. Defaults to 3000." })
      .option("db-connection-string", {
        type: "string",
        description: "The connection string for the database the connector should use. Defaults to the value you specified during 'cman init'.",
      })
      .option("base-url", { type: "string", description: "The base URL of the backbone the connector should connect to. Defaults to the value you specified during 'cman init'." })
      .option("client-id", {
        type: "string",
        description:
          "The client ID of the OAuth2 client that should be used to authenticate the Connector on the Backbone. Defaults to the value you specified during 'cman init'.",
      })
      .option("client-secret", {
        type: "string",
        description:
          "The client secret of the OAuth2 client that should be used to authenticate the Connector on the Backbone. Defaults to the value you specified during 'cman init'.",
      })
      .option("additional-configuration", {
        alias: "c",
        type: "array",
        description: "Additional configuration for the connector. Use 'key=value' pairs separated by semicolons. Nested keys can be specified using ':' or '__'.",
      })
      .check((argv) => {
        if (argv.id.trim().length === 0) return "The id cannot be empty."
        if (argv.id.toLowerCase() !== argv.id) return "The id must be all lowercase."
        if (/\s/.test(argv.id)) return "The id must not contain any whitespace characters."
        return true
      })
      .example("$0 --id connector1", "Create a new connector with the minimal number of parameters.")
      .example(
        "$0 --id connector1 --version v6.14.3 --port 9000 --db-connection-string mongodb://localhost:27017 --base-url https://backbone.example.com --client-id myClientId --client-secret myClientSecret",
        "Create a new connector with all possible parameters."
      )
      .example("$0 --id connector1 --additional-configuration 'key1=value1;key2=value2' -c 'nested__key=false'", "Create a new connector with additional configuration.")

  protected async runInternal(args: CreateCommandArgs): Promise<void> {
    args.version ??= await this._releaseManager.getLatestVersionNumber(this._config.repository)

    const existsResponse = await this._releaseManager.exists(args.version, this._config.repository)
    if (existsResponse) {
      throw new Error(existsResponse)
    }

    const id = args.id.trim()

    if (this._config.existsConnector(id)) {
      throw new Error(`A connector with the id ${id} already exists.`)
    }

    console.log("Creating connector...")

    const additionalConfig = await parseConfigStrings(args.additionalConfiguration)

    const connector = this._config.addConnector(
      args.version,
      id,
      args.description,
      args.dbConnectionString,
      args.baseUrl,
      args.clientId,
      args.clientSecret,
      args.port,
      additionalConfig
    )
    await this._config.save()

    await this._processManager.start(id)

    console.log(`Successfully created the connector ${chalk.green(id)}.\n`)

    await waitForConnectorToBeHealthy(connector)

    await this.showInstances([connector])
  }
}
