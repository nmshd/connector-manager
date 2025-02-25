import chalk from "chalk"
import * as yargs from "yargs"
import { waitForConnectorToBeHealthy } from "../utils/connectorUtils.js"
import { BaseCommand } from "./BaseCommand.js"

export type StartCommandArgs = { id: string } | { all: true }

export class StartCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("id", { type: "string", description: "The id of the connector to start. Cannot be used together with --all." })
      .option("all", { type: "boolean", description: "Start all connectors. Cannot be used together with --id." })
      .conflicts("id", "all")
      .check((argv) => {
        if (!("id" in argv || "all" in argv)) return "Either --id or --all must be provided."
        return true
      })
      .example("$0 --id connector1", "Start the connector with the id 'connector1'.")
      .example("$0 --all", "Start all connectors.")

  protected async runInternal(args: StartCommandArgs): Promise<void> {
    if ("all" in args) {
      console.log("Starting all connectors...")
      console.log()

      for (const connector of this._config.connectors) {
        await this.start(connector.id)
      }

      console.log("All connectors started.")

      return
    }

    if (!this._config.existsConnector(args.id)) {
      throw new Error(`A connector with the id '${args.id}' does not exist.`)
    }

    await this.start(args.id)
  }

  private async start(id: string) {
    console.log(`Starting connector ${chalk.green(id)}...`)

    await this._processManager.start(id)

    const connector = this._config.getConnector(id)!
    await waitForConnectorToBeHealthy(connector)

    console.log(`Connector ${chalk.green(id)} is now running.`)
    console.log()
  }
}
