import { ProcessDescription } from "pm2"
import { TUIBaseConstructor } from "../TUIBase.js"

export function AddListConnectors<TBase extends TUIBaseConstructor>(Base: TBase) {
  return class ListConnectors extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "List Connectors", value: this.listConnectors })
    }

    protected async listConnectors() {
      await this._listConnectors()
    }

    private async _listConnectors() {
      await new Promise<ProcessDescription[]>((resolve, reject) =>
        this.pm2.list((err: any, list) => {
          if (err) return reject(err)

          resolve(list)
        })
      )
    }
  }
}
