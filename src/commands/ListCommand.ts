import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export class ListCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) => yargs

  protected async runInternal(): Promise<void> {
    const connectors = this._config.connectors

    await this.showInstances(connectors)
  }
}
