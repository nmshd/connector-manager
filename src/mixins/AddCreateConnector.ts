import { TUIBaseConstructor } from "../TUIBase.js"

export function AddCreateConnector<TBase extends TUIBaseConstructor>(Base: TBase) {
  return class CreateConnector extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Create Connector", value: this.createConnector })
    }

    protected async createConnector() {
      console.log("Creating connector...")

      const installable = await this.getInstallableReleases()

      console.log(installable.map((release) => release.name).join("\n"))
    }

    private async getInstallableReleases() {
      const releases = await this.octokit.rest.repos.listReleases({
        owner: "nmshd",
        repo: "connector",
        per_page: 100,
      })

      return releases.data.filter((release) => release.assets.length > 0 && release.assets.some((asset) => asset.name.endsWith(".zip")))
    }
  }
}
