import path from "path"
import pm2 from "pm2"
import { Config } from "../connector-config/Config.js"
import { ReleaseManager } from "./ReleaseManager.js"

export class ProcessManager {
  readonly #releaseManager: ReleaseManager

  public constructor(
    private readonly config: Config,
    releaseManager: ReleaseManager
  ) {
    this.#releaseManager = releaseManager
  }

  readonly #pm2: typeof pm2 = new (pm2 as any).custom()
  public get pm2() {
    return this.#pm2
  }

  public async init() {
    await this.connectToPM2()
  }

  private async connectToPM2() {
    const promise = new Promise<void>((resolve, reject) =>
      this.pm2.connect(false, (err: any) => {
        if (err) return reject(err)

        resolve()
      })
    )

    const timeout = new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Connection to PM2 timed out")), 1000))

    await Promise.race([promise, timeout])
  }

  public async start(name: string) {
    const connectorFromConfig = this.config.getConnector(name)

    if (!connectorFromConfig) throw new Error("Connector not found in config")

    const connectorPath = await new ReleaseManager().provideRelease(connectorFromConfig.version)

    await new Promise<void>((resolve, reject) => {
      this.#pm2.start(
        {
          name: name,
          script: path.join(connectorPath, "dist", "index.js"),
          args: ["start", "-c", connectorFromConfig.configFilePath],
          merge_logs: true,
          output: connectorFromConfig.logFilePath,
          error: connectorFromConfig.logFilePath,
        },
        (err: any) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })
  }

  public async stop(name: string) {
    await new Promise<void>((resolve, reject) => {
      this.#pm2.stop(name, (err: any) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  public async delete(name: string) {
    if (name === "all") throw new Error("Cannot delete all connectors")

    await new Promise<void>((resolve, reject) => {
      this.#pm2.delete(name, (err: any) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  public async restart(name: string) {
    await new Promise<void>((resolve, reject) => {
      this.#pm2.restart(name, (err: any) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  public async list() {
    await new Promise<void>((resolve, reject) => {
      this.#pm2.list((err: any) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  public async status(name: string) {
    return await new Promise<pm2.ProcessDescription | undefined>((resolve, reject) => {
      this.#pm2.describe(name, (err: any, pd) => {
        if (err) return reject(err)

        resolve(pd[0])
      })
    })
  }
}
