import chalk from "chalk"
import fs from "fs"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface DeleteCommandArgs {
  name: string
  yes: boolean
}

export class DeleteCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) => yargs.option("name", { type: "string", demandOption: true }).option("yes", { type: "boolean" })

  protected async runInternal(args: DeleteCommandArgs): Promise<void> {
    if (!this._config.connectors.find((c) => c.name === args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    if (!args.yes) {
      console.log("This will stop and delete the connector. Are you sure you want to continue? Re-run the command with the --yes flag to confirm.")
      process.exit(0)
    }

    await this._processManager.stop(args.name)
    await this._processManager.delete(args.name)

    this._config.connectors = this._config.connectors.filter((c) => c.name !== args.name)
    await this._config.save()

    fs.unlinkSync(this.getConnectorConfigFile(args.name))

    console.log(`Successfully stopped and deleted the connector ${chalk.red(args.name)}.\n`)
  }
}
