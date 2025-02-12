import AdmZip from "adm-zip"
import chalk from "chalk"
import { spawn } from "child_process"
import fs from "fs"
import { Octokit } from "octokit"
import path from "path"
import { Readable } from "stream"
import { finished } from "stream/promises"
import { ReadableStream } from "stream/web"
import { getAppDir } from "./getAppDir.js"

export class ReleaseManager {
  public async provideRelease(version: string): Promise<string> {
    const releasesDir = path.join(getAppDir(), "releases")
    const connectorDir = path.join(releasesDir, `connector-${version}`)

    if (fs.existsSync(path.join(connectorDir, "dist")) && fs.existsSync(path.join(connectorDir, "node_modules"))) return connectorDir

    const zipPath = await this.downloadConnector(releasesDir, version)

    if (!fs.existsSync(connectorDir)) fs.mkdirSync(connectorDir, { recursive: true })

    this.extractConnector(connectorDir, zipPath)

    await this.npmInstallConnector(connectorDir)

    return connectorDir
  }

  public async exists(version: string): Promise<string | undefined> {
    const release = await this.getGithubRelease(version)

    if (!release) return `The release ${chalk.red(version)} does not exist.`

    if (!release.assets.some((asset) => asset.name.endsWith(".zip") && asset.state === "uploaded")) {
      return `The release ${chalk.red(version)} is not supported. Only versions greater than 6.14.2 are supported.`
    }
  }

  private async getGithubRelease(version: string) {
    try {
      const octokit = new Octokit()

      const release = await octokit.rest.repos.getReleaseByTag({
        owner: "nmshd",
        repo: "connector",
        tag: version,
      })

      return release.data
    } catch (_) {
      return undefined
    }
  }

  private async downloadConnector(zipDir: string, version: string) {
    if (!fs.existsSync(zipDir)) fs.mkdirSync(zipDir, { recursive: true })

    const zipPath = path.join(zipDir, `connector-${version}.zip`)
    if (fs.existsSync(zipPath)) return zipPath

    const release = await this.getGithubRelease(version)
    if (!release?.assets) throw new Error("no release / assets found")

    const zipAsset = release.assets.find((asset) => asset.name.endsWith(".zip") && asset.state === "uploaded")
    if (!zipAsset) throw new Error("no zip asset found")

    const response = await fetch(zipAsset.browser_download_url)
    if (!response.ok) throw new Error("failed to download connector")

    const fileStream = fs.createWriteStream(zipPath, { flags: "wx" })
    await finished(Readable.fromWeb(response.body! as ReadableStream<any>).pipe(fileStream))

    return zipPath
  }

  private extractConnector(connectorDir: string, zipPath: string) {
    if (fs.existsSync(path.join(connectorDir, "dist"))) return

    const zip = new AdmZip(zipPath)
    zip.extractAllTo(connectorDir)
  }

  private async npmInstallConnector(connectorDir: string) {
    if (fs.existsSync(path.join(connectorDir, "node_modules"))) return

    await new Promise<void>((resolve, reject) => {
      const npmInstall = spawn("npm", ["install", "--prefix", connectorDir, "--production"], { stdio: "ignore" })

      npmInstall.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`npm install failed with exit code ${code}`))
          return
        }
        resolve()
      })
    })
  }
}
