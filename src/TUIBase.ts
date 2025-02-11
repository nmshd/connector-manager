import { Octokit } from "octokit"
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

  protected choices: Choice[] = []

  // TODO: add helper methods
}
