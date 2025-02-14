import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export type StartCommandArgs = { name: string } | { all: true }

export class StartCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string", description: "The name of the connector to start. Cannot be used together with --all." })
      .option("all", { type: "boolean", description: "Start all connectors. Cannot be used together with --name." })
      .conflicts("name", "all")
      .check((argv) => {
        if (!("name" in argv || "all" in argv)) return "Either --name or --all must be provided."
        return true
      })
      .example("$0 --name connector1", "Start the connector named connector1.")
      .example("$0 --all", "Start all connectors.")

  protected async runInternal(args: StartCommandArgs): Promise<void> {
    if ("all" in args) {
      console.log("Starting all connectors...")
      console.log()

      for (const connector of this._config.connectors) {
        await this.start(connector.name)
      }

      console.log("All connectors started.")

      return
    }

    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    await this.start(args.name)
  }

  private async start(name: string) {
    console.log(`Starting connector ${chalk.green(name)}...`)

    await this._processManager.start(name)

    console.log(`Connector ${chalk.green(name)} started.`)
    console.log()
  }
}
