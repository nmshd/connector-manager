import { TUIBaseConstructor } from "../TUIBase.js"

export function AddCreateConnector<TBase extends TUIBaseConstructor>(Base: TBase) {
  return class CreateConnector extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Create Connector", value: this.createConnector })
    }

    protected async createConnector() {
      // TODO: implement createConnector
    }
  }
}
