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

    const createdConnectors: Parameters[] = []
    for (const connectorProperties of data) {
      if (!this._config.existsConnector(connectorProperties["connector-id"])) {
        await this.createNewConnector(connectorProperties)
        console.log(`Connector ${connectorProperties["connector-id"]} created.`)
        createdConnectors.push(connectorProperties)
      } else {
        console.warn(`A Connector with the id '${connectorProperties["connector-id"]}' already exists. Skipping creation...`)
      }
    }

    if (createdConnectors.length === 0) {
      console.log("Sync completed. No new Connectors were created.")
      return
    }

    await this._config.save()

    console.log("Sync completed. The following Connectors were created:")

    await new Promise((resolve) => setTimeout(resolve, 1000 * this._config.connectors.length))

    await this.showInstances(this._config.connectors.filter((c) => createdConnectors.some((p) => p["connector-id"] === c.name)))
  }

  private async createNewConnector(parameters: Parameters) {
    console.log(`Creating connector ${parameters["connector-id"]}...`)

    const connector = this._config.addConnector(
      parameters["connector-version"],
      parameters["connector-id"],
      parameters["connector-db-connection-string"],
      parameters["backbone-base-url"],
      parameters["backbone-client-id"],
      parameters["backbone-client-secret"],
      parameters["connector-port"] ? parseInt(parameters["connector-port"]) : undefined
    )

    await this._config.save()

    await this._processManager.start(connector.name)

    if (parameters["organization-display-name"]) await setDisplayName(connector, parameters["organization-display-name"].trim())
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
  public "connector-id" = ""
  public "connector-db-connection-string"?: string
  public "connector-port"?: string
  public "connector-version" = ""
  public "organization-display-name"?: string
  public "backbone-base-url"?: string
  public "backbone-client-id"?: string
  public "backbone-client-secret"?: string
}

class DefaultValues {
  public "connector-db-connection-string"?: string
  public "backbone-base-url"?: string
  public "backbone-client-id"?: string
  public "backbone-client-secret"?: string
}
