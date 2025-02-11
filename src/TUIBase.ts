import fs from "fs"
import { Octokit } from "octokit"
import pm2 from "pm2"
import prompts from "prompts"

export type TUIBaseConstructor = new (...args: any[]) => TUIBase

export interface Choice extends prompts.Choice {
  value(): Promise<void>
}

export class TUIBase {
  readonly #octokit: Octokit = new Octokit()
  public get octokit(): Octokit {
    return this.#octokit
  }

  readonly #pm2: typeof pm2 = new (pm2 as any).custom()
  public get pm2(): typeof pm2 {
    return this.#pm2
  }

  public get appDir(): string {
    const base = process.env.APPDATA ?? (process.platform === "darwin" ? `${process.env.HOME}/Library/Preferences` : `${process.env.HOME}/.local/share`)

    const appDir = `${base}/enmeshed-connector-manager`

    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true })
    }

    return appDir
  }

  protected choices: Choice[] = []

  // TODO: add helper methods
}
