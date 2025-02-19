import * as yargs from "yargs"
import { BaseCommand } from "../BaseCommand.js"
import { ExcelCreateCommand } from "./ExcelCreateCommand.js"
import { ExcelSyncCommand } from "./ExcelSyncCommand.js"

export class ExcelBaseCommand extends BaseCommand<unknown> {
  public static builder: yargs.BuilderCallback<any, unknown> = (yargs: yargs.Argv) =>
    yargs
      .command("create", "Create a new Excel file for you to fill.", ExcelCreateCommand.builder, async (args) => await new ExcelCreateCommand().run(args))
      .command(
        "sync",
        "Read an Excel file and create any Connector with an id that doesn't exist yet. Does NOT update existing Connectors.",
        ExcelSyncCommand.builder,
        async (args) => await new ExcelSyncCommand().run(args)
      )

  protected runInternal(_: unknown): Promise<void> | void {
    throw new Error("Method not implemented.")
  }
}
