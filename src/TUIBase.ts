import { Octokit } from "octokit"
import pm2 from "pm2"
import prompts from "prompts"
import { Config } from "./connector-config/Config.js"

export type TUIBaseConstructor = new (...args: any[]) => TUIBase

export interface Choice extends prompts.Choice {
  value(): Promise<void>
}

export class TUIBase {
  readonly #config: Config
  public get config(): Config {
    return this.#config
  }

  readonly #octokit: Octokit = new Octokit()
  public get octokit(): Octokit {
    return this.#octokit
  }

  readonly #pm2: typeof pm2 = new (pm2 as any).custom()
  public get pm2(): typeof pm2 {
    return this.#pm2
  }

  public constructor(config: Config) {
    this.#config = config
  }

  protected choices: Choice[] = []

  // TODO: add helper methods
}
