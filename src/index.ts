#!/usr/bin/env node

import pm2 from "pm2"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { CreateCommand } from "./commands/CreateCommand.js"

await yargs(hideBin(process.argv))
  .command(
    "init",
    "",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command("create", "", CreateCommand.builder, async (args) => await new CreateCommand().run(args))
  .command(
    "list",
    "",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "delete",
    "",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "start",
    "",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "stop",
    "",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "restart",
    "",
    (argv) => argv,
    () => {
      throw new Error("unimplemented")
    }
  )
  .command(
    "update",
    "",
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
