import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export type StopCommandArgs = { id: string } | { all: true }

export class StopCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("id", { type: "string", description: "The id of the connector to stop. Cannot be used together with --all." })
      .option("all", { type: "boolean", description: "Stop all connectors. Cannot be used together with --id." })
      .conflicts("id", "all")
      .check((argv) => {
        if (!("id" in argv || "all" in argv)) return "Either --id or --all must be provided."
        return true
      })
      .example("$0 --id connector1", "Stop the connector with id connector1.")
      .example("$0 --all", "Stop all connectors.")

  protected async runInternal(args: StopCommandArgs): Promise<void> {
    if ("all" in args) {
      console.log("Stopping all connectors...")
      await this._processManager.stop("all")
      console.log("All connectors stopped.")

      return
    }

    if (!this._config.existsConnector(args.id)) {
      throw new Error(`A connector with the id '${args.id}' does not exist.`)
    }

    console.log(`Stopping connector ${chalk.green(args.id)}...`)
    await this._processManager.stop(args.id)
    console.log(`Connector ${chalk.green(args.id)} stopped.`)
  }
}
