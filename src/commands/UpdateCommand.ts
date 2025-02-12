import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export type UpdateCommandArgs = { force: boolean; version: string } & ({ name: string } | { all: true })

export class UpdateCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string" })
      .option("all", { type: "boolean" })
      .option("force", { type: "boolean" })
      .option("version", { type: "string", demandOption: true })
      .conflicts("name", "all")
      .check((argv) => {
        if (!("name" in argv || "all" in argv)) return "Either --name or --all must be provided."
        return true
      })

  protected async runInternal(args: UpdateCommandArgs): Promise<void> {
    const existsResponse = await this._releaseManager.exists(args.version)
    if (existsResponse) {
      console.error(existsResponse)
      process.exit(1)
    }

    if ("all" in args) {
      for (const connector of this._config.connectors) {
        await this.update(connector.name)
      }

      return
    }

    if (!this._config.connectors.find((c) => c.name === args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    await this.update(args.name)
  }

  private async update(name: string) {
    console.log(`Updating connector ${chalk.green(name)}...`)

    await Promise.resolve()

    console.log(`Connector ${chalk.green(name)} updated.`)
  }
}
