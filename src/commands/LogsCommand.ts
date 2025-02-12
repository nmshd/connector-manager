import chalk from "chalk"
import fs from "fs"
import os from "os"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface LogsCommandArgs {
  name: string
}

export class LogsCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) => yargs.option("name", { type: "string", demandOption: true })

  protected runInternal(args: LogsCommandArgs): void {
    if (!this._config.connectors.find((c) => c.name === args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    const homedir = os.homedir()
    const pm2LogsDir = `${homedir}/.pm2/logs`

    const logs = fs.readFileSync(`${pm2LogsDir}/${args.name}-out.log`, "utf8")

    console.log(`Logs for connector ${chalk.green(args.name)}:`)
    console.log(logs)
  }
}
