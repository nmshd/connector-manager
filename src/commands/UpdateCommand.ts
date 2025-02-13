import chalk from "chalk"
import * as yargs from "yargs"
import { BaseCommand } from "./BaseCommand.js"

export type UpdateCommandArgs = { version?: string; rotateApiKey?: boolean; port?: number; start: boolean } & ({ name: string } | { all: true })

export class UpdateCommand extends BaseCommand<never> {
  public static builder: yargs.BuilderCallback<any, never> = (yargs: yargs.Argv) =>
    yargs
      .option("name", { type: "string" })
      .option("all", { type: "boolean" })
      .option("version", { type: "string" })
      .option("rotate-api-key", { type: "boolean" })
      .option("start", { type: "boolean", default: true })
      .option("port", { type: "number" })
      .conflicts("name", "all")
      .conflicts("port", "all")
      .check((argv) => {
        if (!("name" in argv || "all" in argv)) return "Either --name or --all must be provided."

        if (typeof argv.version === "undefined" && !argv.rotateApiKey && typeof argv.port === "undefined") {
          return "At least one of --version, --rotateApiKey or --port must be provided."
        }

        return true
      })

  protected async runInternal(args: UpdateCommandArgs): Promise<void> {
    if (typeof args.version !== "undefined") {
      const existsResponse = await this._releaseManager.exists(args.version)
      if (existsResponse) {
        console.error(existsResponse)
        process.exit(1)
      }
    }

    if ("all" in args) {
      for (const connector of this._config.connectors) {
        await this.update(connector.name, args)
      }

      return
    }

    if (!this._config.existsConnector(args.name)) {
      console.error(`A connector with the name ${chalk.red(args.name)} does not exist.`)
      process.exit(1)
    }

    if (typeof args.port !== "undefined") {
      const connectorUsingPort = this._config.connectors.find((c) => c.config.infrastructure.httpServer.port === args.port)

      if (connectorUsingPort) {
        console.error(`Port ${chalk.red(args.port)} is already in use by the connector ${chalk.red(connectorUsingPort.name)}.`)
        process.exit(1)
      }
    }

    await this.update(args.name, args)
  }

  private async update(name: string, args: UpdateCommandArgs) {
    console.log(`Updating connector ${chalk.green(name)}...`)

    const connector = this._config.getConnector(name)!

    if (args.rotateApiKey) connector.rotateApiKey()
    if (typeof args.version !== "undefined") connector.version = args.version
    if (typeof args.port !== "undefined") connector.config.infrastructure.httpServer.port = args.port

    await this._config.save()

    if (!args.start) {
      console.log(`Connector ${chalk.green(name)} updated.`)
      console.log(`Use ${chalk.cyan(`start --name ${name}`)} to start the connector.`)
      console.log()
      return
    }

    await this._processManager.start(name)

    console.log(`Connector ${chalk.green(name)} updated and (re-)started.`)
    console.log()
  }
}
