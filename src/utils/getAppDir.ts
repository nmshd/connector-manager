import fs from "fs"

export function getAppDir(): string {
  const base = process.env.APPDATA ?? (process.platform === "darwin" ? `${process.env.HOME}/Library/Preferences` : `${process.env.HOME}/.local/share`)

  const appDir = `${base}/enmeshed-connector-manager`

  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true })
  }

  return appDir
}
