import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface ShowCommandArgs {
  name: string
}

export class ShowCommand extends BaseCommand<ShowCommandArgs> {
  public static builder: yargs.BuilderCallback<any, ShowCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string", demandOption: true, description: "The name of the connector to show." })
      .example("$0 --name connector1", "Show the details of the connector named connector1.")

  protected async runInternal(args: ShowCommandArgs): Promise<void> {
    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    const connector = this._config.getConnector(args.name)
    await this.showInstances([connector!])
  }
}
