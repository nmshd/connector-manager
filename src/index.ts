#!/usr/bin/env node

import dotenv from "dotenv"
import path from "path"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { TUI } from "./TUI.js"

const argv = await yargs(hideBin(process.argv))
  .option("env", {
    alias: "e",
    description: "location of the env file relative to cwd",
    type: "string",
    default: ".env",
  })
  .help()
  .alias("help", "h").argv

dotenv.config({ path: path.resolve(process.cwd(), argv.env) })

const tui = new TUI()
await tui.run()
