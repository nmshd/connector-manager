import chalk from "chalk"
import * as yargs from "yargs"
import { setDisplayName } from "../utils/connectorUtils.js"
import { BaseCommand } from "./BaseCommand.js"

export type UpdateCommandArgs = { version?: string; rotateApiKey?: boolean; port?: number; start: boolean; displayName?: string } & ({ name: string } | { all: true })

export class UpdateCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string", description: "The name of the connector to update. Cannot be used together with --all." })
      .option("all", { type: "boolean", description: "Update all connectors. Cannot be used together with --name." })
      .option("version", { type: "string", description: "The version to update the connector(s) to." })
      .option("rotate-api-key", { type: "boolean", description: "Generate a new API key for the connector(s)." })
      .option("start", { type: "boolean", default: true, description: "Start the connector(s) after updating." })
      .option("port", { type: "number", description: "The new port the connector should listen on. Cannot be used together with --all." })
      .option("display-name", { type: "string", description: "The new display name (attribute) of the connector." })
      .conflicts("name", "all")
      .conflicts("port", "all")
      .conflicts("display-name", "all")
      .check((argv) => {
        if (!("name" in argv || "all" in argv)) return "Either --name or --all must be provided."

        if (typeof argv.version === "undefined" && !argv.rotateApiKey && typeof argv.port === "undefined" && typeof argv["display-name"] === "undefined") {
          return "At least one of --version, --rotateApiKey, --display-name or --port must be provided."
        }

        if (typeof argv["display-name"] !== "undefined" && !argv.start) {
          return "The --display-name option requires the --start option, because setting a display name needs the connector to be online."
        }

        if (argv["display-name"]?.trim().length === 0) return "The display name cannot be empty."

        return true
      })

  protected async runInternal(args: UpdateCommandArgs): Promise<void> {
    if (typeof args.version !== "undefined") {
      const existsResponse = await this._releaseManager.exists(args.version)
      if (existsResponse) {
        console.error(existsResponse)
        process.exit(1)
      }
    }

    if ("all" in args) {
      for (const connector of this._config.connectors) {
        await this.update(connector.name, args)
      }

      await this.showInstances(this._config.connectors)

      return
    }

    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    if (typeof args.port !== "undefined") {
      const connectorUsingPort = this._config.connectors.find((c) => c.config.infrastructure.httpServer.port === args.port)

      if (connectorUsingPort) {
        console.error(`Port ${chalk.red(args.port)} is already in use by the connector ${chalk.red(connectorUsingPort.name)}.`)
        process.exit(1)
      }
    }

    await this.update(args.name, args)

    const instance = this._config.getConnector(args.name)
    await this.showInstances([instance!])
  }

  private async update(name: string, args: UpdateCommandArgs) {
    console.log(`Updating connector ${chalk.green(name)}...`)

    const connector = this._config.getConnector(name)!

    if (args.rotateApiKey) connector.rotateApiKey()
    if (typeof args.version !== "undefined") connector.version = args.version
    if (typeof args.port !== "undefined") connector.config.infrastructure.httpServer.port = args.port

    await this._config.save()

    if (!args.start) {
      console.log(`Connector ${chalk.green(name)} updated.`)
      console.log(`Use ${chalk.cyan(`start --name ${name}`)} to start the connector.`)
      console.log()
      return
    }

    await this._processManager.start(name)

    if (typeof args.displayName !== "undefined") await setDisplayName(connector, args.displayName.trim())

    console.log(`Connector ${chalk.green(name)} updated and (re-)started.`)
    console.log()
  }
}
