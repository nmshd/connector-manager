import * as yargs from "yargs"
import { BaseCommand } from "../BaseCommand.js"
import { ExcelSyncCommand } from "./ExcelSyncCommand.js"

export class ExcelBaseCommand extends BaseCommand<unknown> {
  public static builder: yargs.BuilderCallback<any, unknown> = (yargs: yargs.Argv) =>
    yargs.command("sync", "Synchronize your connector instances with an Excel file.", ExcelSyncCommand.builder, async (args) => await new ExcelSyncCommand().run(args))

  protected runInternal(_: unknown): Promise<void> | void {
    throw new Error("Method not implemented.")
  }
}
