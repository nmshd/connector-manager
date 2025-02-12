import fs from "fs"
import path from "path"

export function getAppDir(): string {
  const base = process.env.APPDATA ?? (process.platform === "darwin" ? path.join(process.env.HOME!, "Library", "Preferences") : path.join(process.env.HOME!, ".local", "share"))

  const appDir = path.join(base, "enmeshed-connector-manager")

  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true })
  }

  return appDir
}
