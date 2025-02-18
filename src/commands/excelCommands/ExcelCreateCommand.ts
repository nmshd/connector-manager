import fs from "fs"
import path from "path"
import * as yargs from "yargs"
import { getRootDir as getDistDirectory } from "../../getRootDir.js"
import { BaseCommand } from "../BaseCommand.js"

export interface ExcelCreateCommandArgs {
  out: string
}

export class ExcelCreateCommand extends BaseCommand<ExcelCreateCommandArgs> {
  private static readonly TEMPLATE_FILE_NAME = "Connectors-Template.xlsx"
  private static readonly DEFAULT_OUT = "./Connectors.xlsx"

  public static builder: yargs.BuilderCallback<any, ExcelCreateCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("out", {
        type: "string",
        description: `The path of the excel file to be created.`,
        default: ExcelCreateCommand.DEFAULT_OUT,
      })
      .example(`$0 excel create`, `Creates a new Excel file at the default path.`)
      .example(`$0 excel create --out ./path/to/Connectors.xlsx`, `Creates a new Excel file at the specified path.`)

  protected async runInternal(args: ExcelCreateCommandArgs): Promise<void> {
    const distDirectory = getDistDirectory()
    const templateFilePath = path.join(distDirectory, "..", ExcelCreateCommand.TEMPLATE_FILE_NAME)
    const outFileDirectory = path.dirname(args.out)

    await fs.promises.mkdir(outFileDirectory, { recursive: true })

    await fs.promises.copyFile(templateFilePath, args.out)
    console.log(`Excel file created at: ${args.out}`)
  }
}
