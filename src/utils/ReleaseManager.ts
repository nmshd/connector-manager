import AdmZip from "adm-zip"
import chalk from "chalk"
import fs from "fs"
import { Octokit } from "octokit"
import { Readable } from "stream"
import { finished } from "stream/promises"
import { ReadableStream } from "stream/web"
import { $ } from "zx"
import { getAppDir } from "./getAppDir.js"

export class ReleaseManager {
  public async provideRelease(version: string): Promise<string> {
    const releasesDir = `${getAppDir()}/releases`
    const connectorDir = `${releasesDir}/connector-${version}`

    if (fs.existsSync(`${connectorDir}/dist`) && fs.existsSync(`${connectorDir}/node_modules`)) return connectorDir

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

      if (release.status !== 200) return undefined
      return release.data
    } catch (_) {
      return undefined
    }
  }

  private async downloadConnector(zipDir: string, version: string) {
    if (!fs.existsSync(zipDir)) fs.mkdirSync(zipDir, { recursive: true })

    const zipPath = `${zipDir}/connector-${version}.zip`
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
    if (fs.existsSync(`${connectorDir}/dist`)) return

    const zip = new AdmZip(zipPath)
    zip.extractAllTo(connectorDir)
  }

  private async npmInstallConnector(connectorDir: string) {
    if (fs.existsSync(`${connectorDir}/node_modules`)) return

    await $({ stdio: "ignore" })`npm install --prefix ${connectorDir} --production`
  }
}
