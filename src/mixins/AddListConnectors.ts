import { TUIBaseConstructor } from "../TUIBase.js"

export function AddListConnectors<TBase extends TUIBaseConstructor>(Base: TBase) {
  return class ListConnectors extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "List Connectors", value: this.listConnectors })
    }

    protected async listConnectors() {
      // TODO: implement listConnectors
    }
  }
}
