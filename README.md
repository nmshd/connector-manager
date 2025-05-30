# Connector Manager

This is a command line tool with the purpose of managing multiple enmeshed Connector instances on a single machine. It starts a separate Node.js process for each Connector. Each of the Node.js processes opens a new port, under which the Connector's REST API is available.

## Prerequisites

In order to use this tool, the following prerequisites must be met:

- The latest version of [Node.js](https://nodejs.org/en/download) must be installed on the machine.
- There must be an existing MongoDB instance accessible by the Connector instances. You can for example [start MongoDB as a Docker container](https://hub.docker.com/_/mongo/) and expose its port, or install the community edition of MongoDB, which you can find [here](https://www.mongodb.com/try/download/community).

## Installation

Use `npm install` to install the Connector Manager on your machine (the `npm` command is included in the Node.js installation).

```bash
npm install -g @nmshd/connector-manager
```

After the installation, you can use the `connector-manager` or the shorter `cman` command to manage the Connector instances.

## Usage

Before you can create your first Connector, you need to initialize the Connector Manager. This is done by running the following command:

```text
cman init --db-connection-string <connection_string> --base-url <base_url> --client-id <client_id> --client-secret <client_secret>
```

It requires the following parameters:

- `db-connection-string`: The connection string to your existing MongoDB instance. This connection string will be used as a default for all the Connectors you create.
  You can find the syntax of a connection string in the [official MongoDB documentation](https://www.mongodb.com/docs/manual/reference/connection-string/#srv-connection-format).
- `base-url`: The base URL of the Backbone the Connector should connect to. You can obtain this URL from the operator of the Backbone.
- `client-id`: The client ID of the OAuth2 client that should be used to authenticate the Connector on the Backbone. You can obtain it from the operator of the Backbone.
- `client-secret`: The client secret of the OAuth2 client that should be used to authenticate the Connector on the Backbone. You can obtain it from the operator of the Backbone.

Each of these values represents the default value for the Connectors you create. You can override them when creating a new Connector.

If you want to fetch the connector from a different repository, you can use the `--repository` parameter. If omitted the default value is `nmshd/connector`. This repository can only be changed during the initialization process and not on a per-connector basis.

### Available commands

A list of all available commands can be displayed by running the following command:

```bash
cman --help
```

It shows the following output:

```txt
cman <command>

Commands:
  cman init        Initialize the connector manager.
  cman create      Create a new connector instance
  cman list        List all connector instances
  cman show        Show information for a specific connector instance
  cman delete      Delete a connector instance
  cman start       Start one or all connector instance(s)
  cman stop        Stop one or all connector instance(s)
  cman restart     Restart one or all connector instance(s)
  cman logs        Show logs for a connector instance
  cman update      Update one or all connector instance(s)
  cman excel       Commands to synchronize your connector instances with an Excel file.
  cman dashboard   Show the dashboard
  cman tui         Start the Connector Terminal UI (TUI) for the connector with the given id.
  cman info        Show information about the connector manager
  cman completion  generate completion script

Options:
  -h, --help  Show help                                                [boolean]
```

If you want to get more information about a specific command, you can use the `--help` option after that command. For example, to get more information about the `create` command, use the following command:

```bash
cman create --help
```

### Provide additional configuration

The Connector Manager automatically generates a configuration file for each created Connector instance, filled with the default values you provided during the initialization process.

If you want to extend this generated configuration file with additional values, you can do so by providing the flag `additional-configuration` in the create command.

This flag can be used to configure the connector (e.g. enable / disable modules). If you want to disable the coreHttpApi module, you can use the following command:

```bash
cman create --id 1 --additional-configuration 'modules__coreHttpApi__enabled=false' --additional-configuration 'debug=true'
```

When running the above command the cman generated config is extended with the following json:

```jsonc
{
  // other fields generated by cman
  "debug": true,
  "modules": {
    "coreHttpApi": {
      "enabled": "false",
    },
  },
}
```

To achieve the same result with the excel sync just add the following line to the excel sheet:

| id        | ... | modules\_\_coreHttpApi\_\_enabled | debug |
| --------- | --- | --------------------------------- | ----- |
| {your-id} | ... | false                             | true  |

## Update the Connector Manager

To update the Connector Manager to the latest version, use the following command:

```bash
npm update -g @nmshd/connector-manager
```
