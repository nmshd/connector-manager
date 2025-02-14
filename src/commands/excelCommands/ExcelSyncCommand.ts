import xlsx from "node-xlsx"
import * as yargs from "yargs"
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
      if (this._config.existsConnector(connectorProperties.name)) {
        await this.updateExistingConnector(connectorProperties)
      } else {
        await this.createNewConnector(connectorProperties)
      }
    }

    await this.deleteOrphanedConnectors(data)

    await this._config.save()

    await this.showInstances(this._config.connectors)
  }

  private async updateExistingConnector(connectorProperties: Parameters) {
    const connector = this._config.getConnector(connectorProperties.name)!

    connector.version = connectorProperties.version
    connector.config.database.connectionString = connectorProperties["db-connection-string"] ?? this._config.dbConnectionString
    connector.config.transportLibrary.baseUrl = connectorProperties["base-url"] ?? this._config.platformBaseUrl
    connector.config.transportLibrary.platformClientId = connectorProperties["client-id"] ?? this._config.platformClientId
    connector.config.transportLibrary.platformClientSecret = connectorProperties["client-secret"] ?? this._config.platformClientSecret

    await this._processManager.restart(connector.name)
  }

  private async createNewConnector(parameters: Parameters) {
    const connector = this._config.addConnector(
      parameters.version,
      parameters.name,
      parameters["db-connection-string"],
      parameters["base-url"],
      parameters["client-id"],
      parameters["client-secret"]
    )

    await this._processManager.start(connector.name)
  }

  private async deleteOrphanedConnectors(parameters: Parameters[]) {
    const connectorsWithNoMatchingRowInExcel = this._config.connectors.filter((c) => !parameters.some((d) => d.name === c.name))

    for (const connectorParameters of connectorsWithNoMatchingRowInExcel) {
      const status = await this._processManager.status(connectorParameters.name)

      if (status[0]?.pid) {
        await this._processManager.delete(connectorParameters.name)
      }

      this._config.deleteConnector(connectorParameters.name)
    }
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
  public "base-url"?: string
  public "client-id"?: string
  public "client-secret"?: string
  public "db-connection-string"?: string
}
