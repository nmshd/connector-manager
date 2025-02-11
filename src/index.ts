#!/usr/bin/env node

import pm2 from "pm2"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { CreateCommand } from "./commands/CreateCommand.js"
import { InitCommand } from "./commands/InitCommand.js"

await yargs(hideBin(process.argv))
  .command("init", "Initialized the connector manager.", InitCommand.builder, async (args) => await new InitCommand().run(args, false))
  .command("create", "Create a new connector instance", CreateCommand.builder, async (args) => await new CreateCommand().run(args))
  .command(
    "list",
    "List all connector instances",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "delete",
    "Delete a connector instance",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "start",
    "Start one or all connector instance(s)",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "stop",
    "Stop one or all connector instance(s)",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "restart",
    "Restart one or all connector instance(s)",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "update",
    "Update one or all connector instance(s)",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "dashboard",
    "show the dashboard",
    (argv) => argv,
    () => {
      new (pm2 as any).custom().dashboard()
    }
  )
  .demandCommand()
  .version(false)
  .scriptName("connector-manager")
  .help()
  .alias("help", "h").argv
