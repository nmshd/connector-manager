import chalk from "chalk"
import fs from "fs/promises"
import { Tail } from "tail"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface LogsCommandArgs {
  name: string
  lines: number
  tail: boolean
}

export class LogsCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs.option("name", { type: "string", demandOption: true }).option("lines", { type: "number", default: 100 }).option("tail", { type: "boolean", default: true })

  protected async runInternal(args: LogsCommandArgs): Promise<void> {
    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    const connector = this._config.getConnector(args.name)
    const lastLines = this.readLastNLines(connector!.logFilePath, args.lines)
    console.log(lastLines)

    if (!args.tail) return

    this.tailLogs(connector!.logFilePath)

    await new Promise<void>(() => {
      // never resolve
    })
  }

  private async readLastNLines(filePath: string, n: number): Promise<string> {
    const logs = await fs.readFile(filePath, "utf8")
    const lines = logs.split("\n")

    return lines.slice(-n).join("\n")
  }

  private tailLogs(logFilePath: string): void {
    const tail = new Tail(logFilePath, { fromBeginning: false, fsWatchOptions: {}, follow: true })

    tail.on("line", (data) => {
      console.log(data)
    })

    tail.on("error", () => {
      console.log("An error occurred watching the log file.")
      process.exit(1)
    })

    tail.watch()

    process.on("SIGINT", () => {
      tail.unwatch()
      process.exit()
    })
  }
}
