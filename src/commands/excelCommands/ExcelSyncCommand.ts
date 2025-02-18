import xlsx from "node-xlsx"
import * as yargs from "yargs"
import { setDisplayName } from "../../utils/connectorUtils.js"
import { BaseCommand } from "../BaseCommand.js"

export interface ExcelSyncCommandArgs {
  file: string
}

export class ExcelSyncCommand extends BaseCommand<ExcelSyncCommandArgs> {
  public static builder: yargs.BuilderCallback<any, ExcelSyncCommandArgs> = (yargs: yargs.Argv) =>
    yargs.option("file", {
      type: "string",
      demandOption: true,
      description: "The path to the Excel file you want to synchronize with your connector instances.",
    })

  protected async runInternal(args: ExcelSyncCommandArgs): Promise<void> {
    const workSheets = xlsx.parse(args.file)
    const workSheet = workSheets[0]

    const data = this.convertToJSON(workSheet.data)

    for (const connectorProperties of data) {
      if (!this._config.existsConnector(connectorProperties["connector-id"])) {
        await this.createNewConnector(connectorProperties)
      }
    }

    await this._config.save()

    await new Promise((resolve) => setTimeout(resolve, 1000 * this._config.connectors.length))

    await this.showInstances(this._config.connectors)
  }

  private async createNewConnector(parameters: Parameters) {
    console.log(`Creating connector ${parameters["connector-id"]}...`)

    const connector = this._config.addConnector(
      parameters.version,
      parameters.name,
      parameters["db-connection-string"],
      parameters["base-url"],
      parameters["client-id"],
      parameters["client-secret"],
      parameters.port ? parseInt(parameters.port) : undefined
    )

    await this._config.save()

    await this._processManager.start(connector.name)

    if (parameters["initial-display-name"]) await setDisplayName(connector, parameters["initial-display-name"].trim())
  }

  private convertToJSON(array: string[][]): Parameters[] {
    const headers = array[0]

    const jsonData = array.slice(1).map((row) => {
      const obj = new Parameters()
      for (const [index, header] of headers.entries()) {
        const lowerCaseHeader = header.toLowerCase()

        const key = Object.keys(obj).find((k) => k.toLowerCase() === lowerCaseHeader)

        if (key) {
          obj[key as keyof Parameters] = row[index]
        } else {
          throw new Error(`There is no matching parameter for the column '${header}'`)
        }
      }

      return obj
    })
    return jsonData
  }
}

class Parameters {
  public "name" = ""
  public version = ""
  public port?: string
  public "initial-display-name"?: string
  public "base-url"?: string
  public "client-id"?: string
  public "client-secret"?: string
  public "db-connection-string"?: string
}
