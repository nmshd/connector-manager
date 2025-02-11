import prompts from "prompts"
import { TUIBaseConstructor } from "../TUIBase.js"
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

      const selected = await prompts({
        type: "select",
        name: "release",
        message: "Select a connector to install",
        choices: installable.map((release) => ({
          title: release.name!,
          value: {
            version: release.tag_name,
            downloadUrl: release.assets.find((asset) => asset.name.endsWith(".zip"))!.browser_download_url,
          },
        })),
      })

      if (!selected.release) return

      await installConnector(this.appDir, selected.release.downloadUrl, selected.release.version)
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
