import chalk from "chalk"
import { readFile } from "fs/promises"
import prompts from "prompts"
import { TUIBaseWithMixins } from "./mixins/TUIBaseWithMixins.js"

export class TUI extends TUIBaseWithMixins {
  public constructor(private readonly settings: { dashboard: boolean }) {
    super()
  }

  public async run() {
    await this.showStartupMessage()

    await this.connectToPM2()
    this.scheduleKillTask()

    if (this.settings.dashboard) {
      ;(this.pm2 as any).dashboard()
      return
    }

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

    this.pm2.disconnect()
    process.exit(0)
  }

  private async showStartupMessage() {
    const jsonString = (await readFile(new URL("../package.json", import.meta.url))).toString()
    const packageJson = JSON.parse(jsonString)

    console.log(`Welcome to the ${chalk.blue("enmeshed Connector Manager TUI")}!`)
    console.log(`TUI Version: ${chalk.yellow(packageJson.version)}`)
    console.log("")
  }

  private async connectToPM2() {
    console.log("Connecting to process manager...")

    const promise = new Promise<void>((resolve, reject) =>
      this.pm2.connect(false, (err: any) => {
        if (err) return reject(err)

        resolve()
      })
    )

    const timeout = new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Connection to PM2 timed out")), 1000))

    await Promise.race([promise, timeout])
  }

  private scheduleKillTask() {
    const signals = ["SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT", "SIGBUS", "SIGFPE", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGTERM"]

    for (const signal of signals) {
      process.on(signal, () => this.pm2.disconnect())
    }
  }
}
