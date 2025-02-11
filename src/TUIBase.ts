import prompts from "prompts"

export type TUIBaseConstructor = new (...args: any[]) => TUIBase

export interface Choice extends prompts.Choice {
  value(): Promise<void>
}

export class TUIBase {
  protected choices: Choice[] = []

  // TODO: add helper methods
}
