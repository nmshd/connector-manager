import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface ShowCommandArgs {
  id: string
}

export class ShowCommand extends BaseCommand<ShowCommandArgs> {
  public static builder: yargs.BuilderCallback<any, ShowCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("id", { type: "string", demandOption: true, description: "The id of the connector to show." })
      .example("$0 --id connector1", "Show the details of the connector with id connector1.")

  protected async runInternal(args: ShowCommandArgs): Promise<void> {
    if (!this._config.existsConnector(args.id)) {
      throw new Error(`A connector with the id '${args.id}' does not exist.`)
    }

    const connector = this._config.getConnector(args.id)
    await this.showInstances([connector!])
  }
}
