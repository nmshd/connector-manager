import { ConnectorTUI } from "@nmshd/connector-tui"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface TuiCommandArgs {
  id: string
}

export class TuiCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("id", { type: "string", demandOption: true, description: "The id of the connector to restart. Cannot be used together with --all." })
      .example("$0 --id connector1", "Start the Connector TUI for the connector with id 'connector1'.")

  protected async runInternal(args: TuiCommandArgs): Promise<void> {
    const connector = this._config.getConnector(args.id)
    if (!connector) {
      throw new Error(`A connector with the id '${args.id}' does not exist.`)
    }

    const tui = await ConnectorTUI.create(`http://localhost:${connector.config.infrastructure.httpServer.port}`, connector.config.infrastructure.httpServer.apiKey)
    await tui.run()
  }
}
