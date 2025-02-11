#!/usr/bin/env node

import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { TUI } from "./TUI.js"

const argv = await yargs(hideBin(process.argv))
  .option("dashboard", {
    description: "show the dashboard",
    type: "boolean",
    default: false,
  })
  .help()
  .alias("help", "h").argv

const tui = await TUI.create(argv)
await tui.run()
