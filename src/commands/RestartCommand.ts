import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export type RestartCommandArgs = { id: string } | { all: true }

export class RestartCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("id", { type: "string", description: "The id of the connector to restart. Cannot be used together with --all." })
      .option("all", { type: "boolean", description: "Restart all connectors. Cannot be used together with --id." })
      .conflicts("id", "all")
      .check((argv) => {
        if (!("id" in argv || "all" in argv)) return "Either --id or --all must be provided."
        return true
      })
      .example("$0 --id connector1", "Restart the connector with the id 'connector1'.")
      .example("$0 --all", "Restart all connectors.")

  protected async runInternal(args: RestartCommandArgs): Promise<void> {
    if ("all" in args) {
      console.log("Restarting all connectors...")
      await this._processManager.restart("all")
      console.log("All connectors restarted.")

      return
    }

    if (!this._config.existsConnector(args.id)) {
      throw new Error(`A connector with the id '${args.id}' does not exist.`)
    }

    console.log(`Restarting connector ${chalk.green(args.id)}...`)
    await this._processManager.restart(args.id)
    console.log(`Connector ${chalk.green(args.id)} restarted.`)
  }
}
