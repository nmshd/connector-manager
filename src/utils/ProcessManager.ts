import path from "path"
import pm2 from "pm2"
import { Config } from "./Config.js"
import { ReleaseManager } from "./ReleaseManager.js"

export class ProcessManager {
  public constructor(private readonly config: Config) {}

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

  public async start(id: string) {
    const connectorFromConfig = this.config.getConnector(id)

    if (!connectorFromConfig) throw new Error("Connector not found in config")

    const connectorPath = await new ReleaseManager().provideRelease(connectorFromConfig.version)

    await new Promise<void>((resolve, reject) => {
      this.#pm2.start(
        {
          name: id,
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

  public async stop(id: string) {
    await new Promise<void>((resolve, reject) => {
      this.#pm2.delete(id, (err: any) => {
        if (err) {
          if (err.message !== undefined && (err.message as String).endsWith("not found")) {
            // if there is no process with the given id, there is no need to delete it, so we consider it a success
            resolve()
          } else {
            reject(err)
          }
        } else {
          resolve()
        }
      })
    })
  }

  public async restart(id: string) {
    await new Promise<void>((resolve, reject) => {
      this.#pm2.restart(id, (err: any) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  public async status(id: string): Promise<pm2.ProcessDescription[]> {
    if (id === "all") {
      return await new Promise<pm2.ProcessDescription[]>((resolve, reject) => {
        this.#pm2.list((err: any, pd) => {
          if (err) return reject(err)
          resolve(pd)
        })
      })
    }

    return await new Promise<pm2.ProcessDescription[]>((resolve, reject) => {
      this.#pm2.describe(id, (err: any, pd) => {
        if (err) return reject(err)
        resolve(pd)
      })
    })
  }

  public async isRunning(id: string) {
    const status = await this.status(id)

    return status.length > 0
  }
}
