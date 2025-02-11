import fs from "fs"
import prompts from "prompts"
import { TUIBaseConstructor } from "../TUIBase.js"
import { getAppDir } from "../utils/getAppDir.js"
import { installConnector } from "../utils/installConnector.js"

export function AddCreateConnector<TBase extends TUIBaseConstructor>(Base: TBase) {
  return class CreateConnector extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Create Connector", value: this.createConnector })
    }

    protected async createConnector() {
      console.log("Creating connector...")

      const installable = await this.getInstallableReleases()

      if (installable.length === 0) {
        console.log("No installable connectors found")
        return
      }

      const selected = await prompts([
        {
          type: "select",
          name: "version",
          message: "Select a version to install",
          choices: installable.map((release) => ({
            title: release.name!,
            value: {
              version: release.tag_name,
              downloadUrl: release.assets.find((asset) => asset.name.endsWith(".zip"))!.browser_download_url,
            },
          })),
        },
        {
          type: "text",
          name: "name",
          message: "Enter a name for the connector",
          validate: (name: string) => {
            if (name.length === 0) return "Name cannot be empty"
            if (name.includes(" ")) return "Name cannot contain spaces"
            if (name !== name.toLowerCase()) return "Name must be lowercase"
            if (this.config.connectors.some((c) => c.name === name)) return "Name already in use"

            return true
          },
        },
      ])

      if (!selected.version) return

      const connectorPath = await installConnector(getAppDir(), selected.version.downloadUrl, selected.version.version)

      this.config.connectors.push({ name: selected.name, version: selected.version.version })
      await this.config.save()

      const connectorsDir = `${getAppDir()}/connectors`
      if (!fs.existsSync(connectorsDir)) fs.mkdirSync(connectorsDir, { recursive: true })
      const configDir = `${connectorsDir}/${selected.name}.json`

      fs.writeFileSync(
        configDir,
        JSON.stringify(
          {
            database: {
              connectionString: this.config.dbConnectionString,
              dbName: selected.name,
            },
            transportLibrary: {
              baseUrl: this.config.platformBaseUrl,
              platformClientId: this.config.platformClientId,
              platformClientSecret: this.config.platformClientSecret,
            },
            logging: {
              categories: {
                default: {
                  appenders: ["console"],
                },
              },
            },
            infrastructure: {
              httpServer: {
                // TODO: generate random port
                apiKey: "OD3fMLcBGyQ2eCpI9JdTYRozltF",
                port: 8080 + this.config.connectors.length - 1,
              },
            },
          },
          null,
          2
        )
      )

      await new Promise<void>((resolve, reject) => {
        this.pm2.start(
          {
            name: selected.name,
            script: `${connectorPath}/dist/index.js`,
            args: ["start", "-c", configDir],
          },
          (err: any) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }

    private async getInstallableReleases() {
      const releases = await this.octokit.rest.repos.listReleases({
        owner: "nmshd",
        repo: "connector",
        per_page: 100,
      })

      return releases.data.filter((release) => release.assets.length > 0 && release.assets.some((asset) => asset.name.endsWith(".zip") && asset.state === "uploaded"))
    }
  }
}
