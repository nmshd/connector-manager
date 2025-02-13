import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export interface CreateCommandArgs {
  name: string
  version: string
  dbConnectionString?: string
  baseUrl?: string
  clientId?: string
  clientSecret?: string
}

export class CreateCommand extends BaseCommand<CreateCommandArgs> {
  public static builder: yargs.BuilderCallback<any, CreateCommandArgs> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string", demandOption: true })
      .option("version", { type: "string", demandOption: true })
      .option("db-connection-string", { type: "string" })
      .option("base-url", { type: "string" })
      .option("client-id", { type: "string" })
      .option("client-secret", { type: "string" })
      .check((argv) => {
        if (argv.name === "all") return "The name 'all' is reserved."
        return true
      })

  protected async runInternal(args: CreateCommandArgs): Promise<void> {
    const existsResponse = await this._releaseManager.exists(args.version)
    if (existsResponse) {
      console.error(existsResponse)
      process.exit(1)
    }

    if (this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} already exists.`)
      process.exit(1)
    }

    console.log("Creating connector...")

    const connector = this._config.addConnector(args.version, args.name, args.dbConnectionString, args.baseUrl, args.clientId, args.clientSecret)
    await this._config.save()

    await this._processManager.start(args.name)

    console.log(`Successfully created the connector ${chalk.green(args.name)}.\n`)

    await this.showInstances([connector])
  }
}
