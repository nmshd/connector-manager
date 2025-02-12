import chalk from "chalk"
import fs from "fs"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface LogsCommandArgs {
  name: string
}

export class LogsCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) => yargs.option("name", { type: "string", demandOption: true })

  protected runInternal(args: LogsCommandArgs): void {
    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    const connector = this._config.getConnector(args.name)
    const logs = fs.readFileSync(connector!.logFilePath, "utf8")

    console.log(`Logs for connector ${chalk.green(args.name)}:`)
    console.log(logs)
  }
}
