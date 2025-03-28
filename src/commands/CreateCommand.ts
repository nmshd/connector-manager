import chalk from "chalk"
import fs from "fs"
import path from "path"
import * as yargs from "yargs"
import { setDisplayName, waitForConnectorToBeHealthy } from "../utils/connectorUtils.js"
import { BaseCommand } from "./BaseCommand.js"

export interface CreateCommandArgs {
  id: string
  version?: string
  port?: number
  dbConnectionString?: string
  baseUrl?: string
  clientId?: string
  clientSecret?: string
  displayName?: string
  additionalConfigLocation?: string
}

export class CreateCommand extends BaseCommand<CreateCommandArgs> {
  public static builder: yargs.BuilderCallback<any, CreateCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("id", {
        type: "string",
        demandOption: true,
        description: "The id of the connector to create. Must be unique, contain only lowercase characters and must not contain any whitespace characters.",
      })
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
      .option("display-name", { type: "string", description: "The display name (attribute) of the connector." })
      .option("additional-config-location", {
        type: "string",
        description: "Additional configuration file that should be used when creating the connector. Must be a path to a JSON file.",
      })
      .check((argv) => {
        if (argv.id.trim().length === 0) return "The id cannot be empty."
        if (argv.id.toLowerCase() !== argv.id) return "The id must be all lowercase."
        if (/\s/.test(argv.id)) return "The id must not contain any whitespace characters."
        if (argv["display-name"]?.trim().length === 0) return "The display name cannot be empty."
        return true
      })
      .example("$0 --id connector1", "Create a new connector with the minimal number of parameters.")
      .example(
        "$0 --id connector1 --version v6.14.3 --port 9000 --db-connection-string mongodb://localhost:27017 --base-url https://backbone.example.com --client-id myClientId --client-secret myClientSecret",
        "Create a new connector with all possible parameters."
      )

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

    const additionalConfig = await this.readAdditionalConfig(args.additionalConfigLocation)

    const connector = this._config.addConnector(args.version, id, args.dbConnectionString, args.baseUrl, args.clientId, args.clientSecret, args.port, additionalConfig)
    await this._config.save()

    await this._processManager.start(id)

    console.log(`Successfully created the connector ${chalk.green(id)}.\n`)

    await waitForConnectorToBeHealthy(connector)

    if (typeof args.displayName !== "undefined") await setDisplayName(connector, args.displayName.trim())

    await this.showInstances([connector])
  }

  private async readAdditionalConfig(location?: string): Promise<any> {
    if (!location) return

    const resolved = path.resolve(location)

    if (!fs.existsSync(resolved)) throw new Error(`The file ${location} does not exist.`)

    const fileContent = await fs.promises.readFile(resolved, "utf-8")

    try {
      return JSON.parse(fileContent)
    } catch (_) {
      throw new Error(`The file ${location} is not a valid JSON`)
    }
  }
}
