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
      description: "The path to the Excel file you want to synchronize with your connector instances.",
      default: "./Connectors.xlsx",
    })

  protected async runInternal(args: ExcelSyncCommandArgs): Promise<void> {
    const data = this.readFromExcel(args.file)

    const createdConnectors: Parameters[] = []

    for (const connectorProperties of data.connectors) {
      if (!this._config.existsConnector(connectorProperties["connector-id"])) {
        await this.createNewConnector(connectorProperties, data.defaults)
        console.log(`Connector ${connectorProperties["connector-id"]} created.`)
        createdConnectors.push(connectorProperties)
        await this._config.save()
      } else {
        console.warn(`A Connector with the id '${connectorProperties["connector-id"]}' already exists. Skipping creation...`)
      }
    }

    if (createdConnectors.length === 0) {
      console.log("Sync completed. No new Connectors were created.")
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 3000))

    console.log("Sync completed. The following Connectors were created:")

    await this.showInstances(this._config.connectors.filter((c) => createdConnectors.some((p) => p["connector-id"] === c.id)))
  }

  private readFromExcel(filename: string) {
    const workSheets = xlsx.parse(filename)

    const parameters = this.parseParameters(workSheets[0].data)
    const defaultValues = this.parseDefaults(workSheets[1].data)
    return new ExcelData(parameters, defaultValues)
  }

  private async createNewConnector(parameters: Parameters, defaults: DefaultValues) {
    console.log(`Creating connector ${parameters["connector-id"]}...`)

    const connector = this._config.addConnector(
      parameters["connector-version"] ?? defaults["connector-version"] ?? (await this._releaseManager.getLatestVersionNumber()),
      parameters["connector-id"],
      parameters["connector-db-connection-string"] ?? defaults["connector-db-connection-string"],
      parameters["backbone-base-url"] ?? defaults["backbone-base-url"],
      parameters["backbone-client-id"] ?? defaults["backbone-client-id"],
      parameters["backbone-client-secret"] ?? defaults["backbone-client-secret"],
      parameters["connector-port"] ? parseInt(parameters["connector-port"]) : undefined
    )

    await this._config.save()

    await this._processManager.start(connector.id)

    if (parameters["organization-display-name"]) await setDisplayName(connector, parameters["organization-display-name"].trim())
  }

  private parseParameters(array: string[][]): Parameters[] {
    const headers = array[0]

    const parameters = array.slice(1).map((row) => {
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
    return parameters
  }

  private parseDefaults(array: string[][]): DefaultValues {
    const headers = array[0]
    const row = array[1]

    const defaultValues = new DefaultValues()

    for (const [index, header] of headers.entries()) {
      const lowerCaseHeader = header.toLowerCase()

      const key = Object.keys(defaultValues).find((k) => k.toLowerCase() === lowerCaseHeader)

      if (key) {
        defaultValues[key as keyof DefaultValues] = row[index]
      } else {
        throw new Error(`There is no matching parameter for the column '${header}'`)
      }
    }

    return defaultValues
  }
}

class ExcelData {
  public readonly connectors: Parameters[]
  public readonly defaults: DefaultValues

  public constructor(parameters: Parameters[], defaults: DefaultValues) {
    this.connectors = parameters
    this.defaults = defaults
  }
}

class Parameters {
  public "connector-id" = ""
  public "connector-db-connection-string"?: string
  public "connector-port"?: string
  public "connector-version"? = ""
  public "organization-display-name"?: string
  public "backbone-base-url"?: string
  public "backbone-client-id"?: string
  public "backbone-client-secret"?: string
}

class DefaultValues {
  public "connector-db-connection-string"?: string
  public "connector-version"?: string
  public "backbone-base-url"?: string
  public "backbone-client-id"?: string
  public "backbone-client-secret"?: string
}
