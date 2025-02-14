import chalk from "chalk"
import prompts from "prompts"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface DeleteCommandArgs {
  name: string
  yes: boolean
}

export class DeleteCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) => yargs.option("name", { type: "string", demandOption: true }).option("yes", { type: "boolean" })

  protected async runInternal(args: DeleteCommandArgs): Promise<void> {
    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    if (!args.yes) {
      const answer = await prompts({
        name: "confirm",
        type: "confirm",
        message: `Are you sure you want to delete the connector ${chalk.red(args.name)}?`,
        initial: false,
      })

      if (!answer.confirm) process.exit(0)
    }

    await this._processManager.delete(args.name)

    this._config.deleteConnector(args.name)
    await this._config.save()

    console.log(`Successfully stopped and deleted the connector ${chalk.red(args.name)}.\n`)
  }
}
