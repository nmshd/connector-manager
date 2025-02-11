import chalk from "chalk"
import { readFile } from "fs/promises"
import prompts from "prompts"
import { TUIBaseWithMixins } from "./mixins/TUIBaseWithMixins.js"

export class TUI extends TUIBaseWithMixins {
  public async run() {
    await this.showStartupMessage()

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
    while (true) {
      const result = await prompts({
        type: "select",
        name: "action",
        message: "What do you want to do?",
        choices: this.choices,
      })

      if (!result.action) break

      try {
        await result.action.apply(this)
      } catch (error) {
        console.log(chalk.red("An Error occurred: "), error)
      }
    }
  }

  private async showStartupMessage() {
    const jsonString = (await readFile(new URL("../package.json", import.meta.url))).toString()
    const packageJson = JSON.parse(jsonString)

    console.log(`Welcome to the ${chalk.blue("enmeshed Connector Manager TUI")}!`)
    console.log(`TUI Version: ${chalk.yellow(packageJson.version)}`)
    console.log("")
  }
}
