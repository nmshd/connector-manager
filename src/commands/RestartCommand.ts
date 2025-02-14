import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export type RestartCommandArgs = { name: string } | { all: true }

export class RestartCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string", description: "The name of the connector to restart. Cannot be used together with --all." })
      .option("all", { type: "boolean", description: "Restart all connectors. Cannot be used together with --name." })
      .conflicts("name", "all")
      .check((argv) => {
        if (!("name" in argv || "all" in argv)) return "Either --name or --all must be provided."
        return true
      })
      .example("$0 --name connector1", "Restart the connector named connector1.")
      .example("$0 --all", "Restart all connectors.")

  protected async runInternal(args: RestartCommandArgs): Promise<void> {
    if ("all" in args) {
      console.log("Restarting all connectors...")
      await this._processManager.restart("all")
      console.log("All connectors restarted.")

      return
    }

    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    console.log(`Restarting connector ${chalk.green(args.name)}...`)
    await this._processManager.restart(args.name)
    console.log(`Connector ${chalk.green(args.name)} restarted.`)
  }
}
