# Connector Management TUI

## Installation

If you want to execute this TUI as a package you can install it using `npm i -g @nmshd/connector-manager` and run `connector-manager` or simply run `npx @nmshd/connector-manager`.

## Run Local / Dev Time

1. (only for the first time) `npm install`.
2. `npm start`

## Available commands

```txt
connector-manager <command>

Commands:
  connector-manager init       Initialized the connector manager.
  connector-manager create     Create a new connector instance
  connector-manager list       List all connector instances
  connector-manager delete     Delete a connector instance
  connector-manager start      Start one or all connector instance(s)
  connector-manager stop       Stop one or all connector instance(s)
  connector-manager restart    Restart one or all connector instance(s)
  connector-manager logs       Show logs for a connector instance
  connector-manager update     Update one or all connector instance(s)
  connector-manager dashboard  show the dashboard
  connector-manager info       show information about the connector manager

Options:
  -h, --help  Show help                                                [boolean]
```
