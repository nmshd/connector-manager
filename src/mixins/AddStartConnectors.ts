import { TUIBaseConstructor } from "../TUIBase.js"

export function AddStartConnectors<TBase extends TUIBaseConstructor>(Base: TBase) {
  return class StartConnectors extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Start Connectors", value: this.startConnectors })
    }

    protected async startConnectors() {
      // TODO: implement startConnectors
    }
  }
}
