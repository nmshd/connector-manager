import chalk from "chalk"
import * as yargs from "yargs"
import { setDisplayName } from "../utils/connectorUtils.js"
import { BaseCommand } from "./BaseCommand.js"

export interface CreateCommandArgs {
  name: string
  version: string
  dbConnectionString?: string
  baseUrl?: string
  clientId?: string
  clientSecret?: string
  displayName?: string
}

export class CreateCommand extends BaseCommand<CreateCommandArgs> {
  public static builder: yargs.BuilderCallback<any, CreateCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("name", {
        type: "string",
        demandOption: true,
        description: "The name of the connector to create. Must be unique, contain only lowercase characters and must not contain any whitespace characters.",
      })
      .option("version", {
        type: "string",
        description:
          "The version of the connector to create. You can find a list of available versions on https://github.com/nmshd/connector/releases. If none is passed, the latest version is used.",
      })
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
      .check((argv) => {
        if (argv.name.trim().length === 0) return "The name cannot be empty."
        if (argv.name.toLowerCase() !== argv.name) return "The name must be all lowercase."
        if (/\s/.test(argv.name)) return "The name must not contain any whitespace characters."
        if (argv["display-name"]?.trim().length === 0) return "The display name cannot be empty."
        return true
      })
      .example("$0 --name connector1", "Create a new connector with the minimal number of parameters.")
      .example(
        "$0 --name connector1 --version v6.14.3 --db-connection-string mongodb://localhost:27017 --base-url https://backbone.example.com --client-id myClientId --client-secret myClientSecret",
        "Create a new connector with all possible parameters."
      )

  protected async runInternal(args: CreateCommandArgs): Promise<void> {
    const existsResponse = await this._releaseManager.exists(args.version)
    if (existsResponse) {
      console.error(existsResponse)
      process.exit(1)
    }

    const name = args.name.trim()

    if (this._config.existsConnector(name)) {
      console.error(`A connector with the name ${chalk.red(name)} already exists.`)
      process.exit(1)
    }

    console.log("Creating connector...")

    const connector = this._config.addConnector(args.version, name, args.dbConnectionString, args.baseUrl, args.clientId, args.clientSecret)
    await this._config.save()

    await this._processManager.start(name)

    console.log(`Successfully created the connector ${chalk.green(name)}.\n`)

    if (typeof args.displayName !== "undefined") await setDisplayName(connector, args.displayName.trim())

    await this.showInstances([connector])
  }
}
