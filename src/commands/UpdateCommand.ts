import chalk from "chalk"
import * as yargs from "yargs"
import { waitForConnectorToBeHealthy } from "../utils/connectorUtils.js"
import { BaseCommand } from "./BaseCommand.js"

export type UpdateCommandArgs = { version?: string; rotateApiKey?: boolean; port?: number; start: boolean; description?: string } & ({ id: string } | { all: true })

export class UpdateCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("id", { type: "string", description: "The id of the connector to update. Cannot be used together with --all." })
      .option("description", { type: "string", description: "The description of the connector to update. Cannot be used together with --all." })
      .option("all", { type: "boolean", description: "Update all connectors. Cannot be used together with --id." })
      .option("version", { type: "string", description: "The version to update the connector(s) to." })
      .option("rotate-api-key", { type: "boolean", description: "Generate a new API key for the connector(s)." })
      .option("start", { type: "boolean", default: true, description: "Start the connector(s) after updating." })
      .option("port", { type: "number", description: "The new port the connector should listen on. Cannot be used together with --all." })
      .conflicts("id", "all")
      .conflicts("port", "all")
      .conflicts("description", "all")
      .check((argv) => {
        if (!("id" in argv || "all" in argv)) return "Either --id or --all must be provided."

        if (typeof argv.version === "undefined" && !argv.rotateApiKey && typeof argv.port === "undefined" && typeof argv["description"] === "undefined") {
          return "At least one of --version, --rotateApiKey, --description or --port must be provided."
        }

        return true
      })

  protected async runInternal(args: UpdateCommandArgs): Promise<void> {
    if (typeof args.version !== "undefined") {
      const existsResponse = await this._releaseManager.exists(args.version, this._config.repository)
      if (existsResponse) {
        throw new Error(existsResponse)
      }
    }

    if ("all" in args) {
      for (const connector of this._config.connectors) {
        await this.update(connector.id, args)
        await waitForConnectorToBeHealthy(connector)
      }

      await this.showInstances(this._config.connectors)

      return
    }

    if (!this._config.existsConnector(args.id)) {
      throw new Error(`A connector with the id '${args.id}' does not exist.`)
    }

    if (typeof args.port !== "undefined") {
      const connectorUsingPort = this._config.connectors.find((c) => c.config.infrastructure.httpServer.port === args.port)

      if (connectorUsingPort) {
        throw new Error(`Port ${args.port} is already in use by the connector ${connectorUsingPort.id}.`)
      }
    }

    await this.update(args.id, args)

    const connector = this._config.getConnector(args.id)!

    await waitForConnectorToBeHealthy(connector)

    await this.showInstances([connector])
  }

  private async update(id: string, args: UpdateCommandArgs) {
    console.log(`Updating connector ${chalk.green(id)}...`)

    const connector = this._config.getConnector(id)!

    if (args.rotateApiKey) connector.rotateApiKey()
    if (typeof args.version !== "undefined") connector.version = args.version
    if (args.description?.trim()) connector.description = args.description.trim()
    if (typeof args.port !== "undefined") connector.config.infrastructure.httpServer.port = args.port

    await this._config.save()

    if (!args.start) {
      console.log(`Connector ${chalk.green(id)} updated.`)
      console.log(`Use ${chalk.cyan(`start --id ${id}`)} to start the connector.`)
      console.log()
      return
    }

    await this._processManager.start(id)

    console.log(`Connector ${chalk.green(id)} updated and (re-)started.`)
    console.log()
  }
}
