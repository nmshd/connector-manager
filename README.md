# Connector Manager

The purpose of this tool is to manage multiple enmeshed Connector instances on a single machine. It starts a separate Node.js process for each Connector. Each of the Node.js processes opens a new port, under which the Connector's REST API is available.

The tool is controlled via the command line.

## Prerequisites

In order to use this tool, the following prerequisites must be met:

- The latest version of [Node.js](https://nodejs.org/en/download) must be installed on the machine.
- There must be an existing MongoDB instance, which can be used by the Connectors. You can download the community edition of MongoDB from [here](https://www.mongodb.com/try/download/community).

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

### Available commands

A list of all available commands can be displayed by running the following command:

```bash
cman --help
```

It shows the following output:

```txt
cman <command>

Commands:
  cman init       Initialize the connector manager.
  cman create     Create a new connector instance
  cman list       List all connector instances
  cman delete     Delete a connector instance
  cman start      Start one or all connector instance(s)
  cman stop       Stop one or all connector instance(s)
  cman restart    Restart one or all connector instance(s)
  cman logs       Show logs for a connector instance
  cman update     Update one or all connector instance(s)
  cman dashboard  show the dashboard
  cman info       show information about the connector manager

Options:
  -h, --help  Show help                                                [boolean]
```

If you want to get more information about a specific command, you can use the `--help` option after that command. For example, to get more information about the `create` command, use the following command:

```bash
cman create --help
```

## Update the Connector Manager

To update the Connector Manager to the latest version, use the following command:

```bash
npm update -g @nmshd/connector-manager
```
