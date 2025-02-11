import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface InitCommandArgs {
  dbConnectionString: string
  baseUrl: string
  clientId: string
  clientSecret: string
}

export class InitCommand extends BaseCommand<InitCommandArgs> {
  public static builder: yargs.BuilderCallback<any, InitCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("db-connection-string", { type: "string", demandOption: true })
      .option("base-url", { type: "string", demandOption: true })
      .option("client-id", { type: "string", demandOption: true })
      .option("client-secret", { type: "string", demandOption: true })

  protected async runInternal(args: InitCommandArgs): Promise<void> {
    this._config.dbConnectionString = args.dbConnectionString
    this._config.platformBaseUrl = args.baseUrl
    this._config.platformClientId = args.clientId
    this._config.platformClientSecret = args.clientSecret

    await this._config.save()
  }
}
