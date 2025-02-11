import chalk from "chalk"
import { table } from "table"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export class ListCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) => yargs

  protected async runInternal(): Promise<void> {
    const connectors = this._config.connectors.map((c) => ({
      name: c.name,
      version: c.version,
    }))

    const tableEntries: string[][] = [["Name", "Version", "Status"]]
    for (const connector of connectors) {
      const status = await this._processManager.status(connector.name)

      tableEntries.push([connector.name, connector.version, status?.pid ? chalk.green("running") : chalk.red("stopped")])
    }

    console.log(table(tableEntries))
  }
}
