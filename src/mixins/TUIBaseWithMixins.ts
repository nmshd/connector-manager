import { TUIBase } from "../TUIBase.js"
import { AddCreateConnector } from "./AddCreateConnector.js"
import { AddListConnectors } from "./AddListConnectors.js"
import { AddStartConnectors } from "./AddStartConnectors.js"

export class TUIBaseWithMixins extends AddStartConnectors(AddListConnectors(AddCreateConnector(TUIBase))) {}
