import AdmZip from "adm-zip"
import fs from "fs"
import { Readable } from "stream"
import { finished } from "stream/promises"
import { ReadableStream } from "stream/web"
import { $ } from "zx"

export async function installConnector(appDir: string, downloadUrl: string, version: string) {
  const zipPath = await downloadConnector(downloadUrl, `${appDir}/connectors`, version)

  const connectorDir = `${appDir}/connectors/connector-${version}`
  if (!fs.existsSync(connectorDir)) fs.mkdirSync(connectorDir, { recursive: true })

  extractConnector(connectorDir, zipPath)

  await npmInstallConnector(connectorDir)

  return connectorDir
}

async function downloadConnector(downloadUrl: string, zipDir: string, version: string) {
  if (!fs.existsSync(zipDir)) fs.mkdirSync(zipDir, { recursive: true })

  const zipPath = `${zipDir}/connector-${version}.zip`

  if (fs.existsSync(zipPath)) return zipPath

  const response = await fetch(downloadUrl)
  if (!response.ok) throw new Error("failed to download connector")

  const fileStream = fs.createWriteStream(zipPath, { flags: "wx" })
  await finished(Readable.fromWeb(response.body! as ReadableStream<any>).pipe(fileStream))

  return zipPath
}

function extractConnector(connectorDir: string, zipPath: string) {
  if (fs.existsSync(`${connectorDir}/dist`)) return

  const zip = new AdmZip(zipPath)
  zip.extractAllTo(connectorDir)
}

async function npmInstallConnector(connectorDir: string) {
  if (fs.existsSync(`${connectorDir}/node_modules`)) return

  await $`npm install --prefix ${connectorDir} --production`
}
