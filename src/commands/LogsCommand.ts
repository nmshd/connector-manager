import fs from "fs/promises"
import os from "os"
import { Tail } from "tail"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface LogsCommandArgs {
  id: string
  lines: number
  tail: boolean
}

export class LogsCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("id", { type: "string", demandOption: true, description: "The id of the connector to get the logs from." })
      .option("lines", { type: "number", default: 100, description: "The number of log lines to show." })
      .option("tail", { type: "boolean", default: true, description: "Whether to follow the log output." })
      .example("$0 --id connector1", "Show the last 100 log lines of the connector with id 'connector1'.")
      .example("$0 --id connector1 --lines 50", "Show the last 50 log lines of the connector with id 'connector1'.")
      .example("$0 --id connector1 --tail", "Show the last 100 log lines of the connector with id 'connector1' and follow the log output.")

  protected async runInternal(args: LogsCommandArgs): Promise<void> {
    if (!this._config.existsConnector(args.id)) {
      throw new Error(`A connector with the id '${args.id}' does not exist.`)
    }

    const connector = this._config.getConnector(args.id)
    const lastLines = await this.readLastNLines(connector!.logFilePath, args.lines)
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
    const tail = new Tail(logFilePath, { fromBeginning: false, fsWatchOptions: {}, follow: true, useWatchFile: os.platform() === "win32" })

    tail.on("line", (data) => {
      console.log(data)
    })

    tail.on("error", () => {
      throw new Error("An error occurred watching the log file.")
    })

    tail.watch()

    process.on("SIGINT", () => {
      tail.unwatch()
      process.exit()
    })
  }
}
