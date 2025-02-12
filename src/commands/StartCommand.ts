import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export type StartCommandArgs = { name: string } | { all: true }

export class StartCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string" })
      .option("all", { type: "boolean" })
      .conflicts("name", "all")
      .check((argv) => {
        if (!("name" in argv || "all" in argv)) return "Either --name or --all must be provided."
        return true
      })

  protected async runInternal(args: StartCommandArgs): Promise<void> {
    if ("all" in args) {
      console.log("Starting all connectors...")

      await this._processManager.startAll()
      console.log("All connectors started.")

      return
    }

    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    console.log(`Starting connector ${chalk.green(args.name)}...`)
    await this._processManager.start(args.name)
    console.log(`Connector ${chalk.green(args.name)} started.`)
  }
}
