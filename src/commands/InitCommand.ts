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
      .option("db-connection-string", {
        type: "string",
        demandOption: true,
        description:
          "The connection string to your existing MongoDB instance. This connection string will be used as a default for all the Connectors you create. You can find the syntax of a connection string in the official MongoDB documentation: https://www.mongodb.com/docs/manual/reference/connection-string/#srv-connection-format.",
      })
      .option("base-url", {
        type: "string",
        demandOption: true,
        description: "The base URL of the Backbone the Connector should connect to. You can obtain this URL from the operator of the Backbone.",
      })
      .option("client-id", {
        type: "string",
        demandOption: true,
        description: "The client ID of the OAuth2 client that should be used to authenticate the Connector on the Backbone. You can obtain it from the operator of the Backbone.",
      })
      .option("client-secret", {
        type: "string",
        demandOption: true,
        description:
          "The client secret of the OAuth2 client that should be used to authenticate the Connector on the Backbone. You can obtain it from the operator of the Backbone.",
      })

  protected async runInternal(args: InitCommandArgs): Promise<void> {
    this._config.dbConnectionString = args.dbConnectionString
    this._config.platformBaseUrl = args.baseUrl
    this._config.platformClientId = args.clientId
    this._config.platformClientSecret = args.clientSecret

    await this._config.save()
  }
}
