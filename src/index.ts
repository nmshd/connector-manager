#!/usr/bin/env node

import chalk from "chalk"
import { readFile } from "fs/promises"
import pm2 from "pm2"
import yargs, { Argv } from "yargs"
import { hideBin } from "yargs/helpers"
import { CreateCommand, DeleteCommand, InitCommand, ListCommand, LogsCommand, RestartCommand, ShowCommand, StartCommand, StopCommand, UpdateCommand } from "./commands/index.js"
import { getAppDir } from "./utils/getAppDir.js"

const noopBuilder = (argv: Argv) => argv

await yargs(hideBin(process.argv))
  .command("init", "Initialized the connector manager.", InitCommand.builder, async (args) => await new InitCommand().run(args, false))
  .command("create", "Create a new connector instance", CreateCommand.builder, async (args) => await new CreateCommand().run(args))
  .command("list", "List all connector instances", ListCommand.builder, async (args) => await new ListCommand().run(args))
  .command("show", "Show information for a specific connector instance", ShowCommand.builder, async (args) => await new ShowCommand().run(args))
  .command("delete", "Delete a connector instance", DeleteCommand.builder, async (args) => await new DeleteCommand().run(args))
  .command("start", "Start one or all connector instance(s)", StartCommand.builder, async (args) => await new StartCommand().run(args))
  .command("stop", "Stop one or all connector instance(s)", StopCommand.builder, async (args) => await new StopCommand().run(args))
  .command("restart", "Restart one or all connector instance(s)", RestartCommand.builder, async (args) => await new RestartCommand().run(args))
  .command("logs", "Show logs for a connector instance", LogsCommand.builder, async (args) => await new LogsCommand().run(args))
  .command("update", "Update one or all connector instance(s)", UpdateCommand.builder, async (args) => await new UpdateCommand().run(args))
  // .command("excel", "Offers commands to synchronize your connector instances with an Excel file.", ExcelBaseCommand.builder)
  .command("dashboard", "show the dashboard", noopBuilder, () => new (pm2 as any).custom().dashboard())
  .command("info", "show information about the connector manager", noopBuilder, async () => {
    const jsonString = (await readFile(new URL("../package.json", import.meta.url))).toString()
    const packageJson = JSON.parse(jsonString)

    console.log(`Welcome to the ${chalk.blue("enmeshed Connector Manager")}!`)
    console.log(`Manager Version: ${chalk.yellow(packageJson.version)}`)
    console.log(`Storing files in: ${chalk.yellow(getAppDir())}`)
  })
  .demandCommand()
  .recommendCommands()
  .strict()
  .version(false)
  .help()
  .alias("help", "h").argv
