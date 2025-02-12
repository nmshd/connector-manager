import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export type RestartCommandArgs = { name: string } | { all: true }

export class RestartCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string" })
      .option("all", { type: "boolean" })
      .conflicts("name", "all")
      .check((argv) => {
        if (!("name" in argv || "all" in argv)) return "Either --name or --all must be provided."
        return true
      })

  protected async runInternal(args: RestartCommandArgs): Promise<void> {
    if ("all" in args) return await this._processManager.restart("all")

    if (!this._config.connectors.find((c) => c.name === args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    await this._processManager.restart(args.name)
  }
}
