import chalk from "chalk"
import prompts from "prompts"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface DeleteCommandArgs {
  id: string
  yes: boolean
}

export class DeleteCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("id", { type: "string", demandOption: true, description: "The id of the connector to delete." })
      .option("yes", { type: "boolean", description: "Set this flag to confirm the deletion." })
      .example("$0 --id connector1 --yes", "Delete the connector with the id 'connector1'.")

  protected async runInternal(args: DeleteCommandArgs): Promise<void> {
    if (!this._config.existsConnector(args.id)) {
      throw new Error(`A connector with the id '${args.id}' does not exist.`)
    }

    if (!args.yes) {
      const answer = await prompts({
        name: "confirm",
        type: "confirm",
        message: `Are you sure you want to delete the connector ${chalk.red(args.id)}?`,
        initial: false,
      })

      if (!answer.confirm) process.exit(0)
    }

    await this._processManager.stop(args.id)

    this._config.deleteConnector(args.id)
    await this._config.save()

    console.log(`Successfully stopped and deleted the connector ${chalk.red(args.id)}.\n`)
  }
}
