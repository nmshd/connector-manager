import AdmZip from "adm-zip"
import fs from "fs"
import { Readable } from "stream"
import { finished } from "stream/promises"
import { ReadableStream } from "stream/web"
import { $ } from "zx"

export async function installConnector(appDir: string, downloadUrl: string, version: string) {
  const zipPath = await downloadConnector(downloadUrl, `${appDir}/connectors`, version)

  const outPath = `${appDir}/connectors/connector-${version}`
  fs.mkdirSync(outPath, { recursive: true })

  const zip = new AdmZip(zipPath)
  zip.extractAllTo(outPath)

  await $({ stdio: "ignore" })`npm install --prefix ${outPath} --production`

  return outPath
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
