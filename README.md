# Electric Cash RPC Explorer

This is a fork of [BTC RPC Explorer](https://github.com/janoside/btc-rpc-explorer) with minor modifications to adapt it to Electric Cash.

---

Simple, database-free Electric Cash blockchain explorer, via RPC. Built with Node.js, express, bootstrap-v4.

This tool is intended to be a simple, self-hosted explorer for the Electric Cash blockchain, driven by RPC calls to your own `elcashd` node. This tool is easy to run but currently lacks features compared to database-backed explorers.

Whatever reasons one might have for running a full node (trustlessness, technical curiosity, supporting the network, etc) it's helpful to appreciate the "fullness" of your node. With this explorer, you can not only explore the blockchain (in the traditional sense of the term "explorer"), but also explore the functional capabilities of your own node.

Live demo available at: [https://explorer.electriccash.global](https://explorer.electriccash.global) and [https://explorer.testnet.electriccash.global](https://explorer.testnet.electriccash.global)

# Features

* Browse blocks
* View block details
* View transaction details, with navigation "backward" via spent transaction outputs
* View JSON content used to generate most pages
* Search by transaction ID, block hash/height, and address
* Optional transaction history for addresses by querying from ElectrumX
* Mempool summary, with fee, size, and age breakdowns

# Getting started

The below instructions are geared toward Electric Cash.

## Prerequisites

1. Install and run a full, archiving [node](https://github.com/electric-cash/electric-cash/blob/master/INSTALL.md). Ensure that your bitcoin node has full transaction indexing enabled (`txindex=1`) and the RPC server enabled (`server=1`).
1. Synchronize your node with the Electric Cash network.
1. "Recent" version of Node.js (16+ recommended).

## Instructions

```shell
apt-get install node npm 
git clone https://github.com/electric-cash/explorer
cd explorer
npm install
./bin/cli.js
```

If you're running on mainnet with the default datadir and port, this Should Just Work.
Open [http://127.0.0.1:3002/](http://127.0.0.1:3002/) to view the explorer.

You may set configuration options in a `.env` file or using CLI args.
See [configuration](#configuration) for details.

### Configuration

Configuration options may be passed as environment variables
or by creating an env file at `~/.config/elcash-rpc-explorer.env`
or at `.env` in the working directory.
See [.env-sample](.env-sample) for a list of the options and details for formatting `.env`.

In simple cases, you may use the following configuration:

```
BTCEXP_HOST=0.0.0.0
BTCEXP_PORT=80
BTCEXP_PRIVACY_MODE=true
BTCEXP_NO_RATES=true
BTCEXP_UI_SHOW_TOOLS_SUBHEADER=false
BTCEXP_API_URL=<URL to your api>
BTCEXP_IS_TESTNET=<true if testnet>
```

Additional required env's.

| Name | Mainnet | Testnet | Notes |
| --- | --- | --- | --- |
| BTCEXP_GENESIS_BLOCK_HASH | `00000000a9811adc411f15a9c525d667ca467d83dc5461e2d7fc791d1d3926de` | `00000000d491a4c437cab521a329bb967c3a2bcb849a83a2c53f7f3c50179ab6` | Required |
| BTCEXP_GENESIS_COINBASE_TRANSACTION_ID | `d3133f9c8d4261f44fbd2a8029c56d5d97106adfef11c652d971796cc75dd967` | `d3133f9c8d4261f44fbd2a8029c56d5d97106adfef11c652d971796cc75dd967` | Required |
| BTCEXP_GENESIS_COINBASE_TRANSACTION | <pre lang="json">{<br>"in_active_chain": true,<br>"txid": <br>"d3133f9c8d4261f44fbd2a8029c56d5d97106adfef11c652d971796cc75dd967",<br>  "hash": <br>"d3133f9c8d4261f44fbd2a8029c56d5d97106adfef11c652d971796cc75dd967",<br>  "version": 1,<br>  "size": 189,<br>  "vsize": 189,<br>  "weight": 756,<br>  "locktime": 0,<br>  "vin": [<br>    {<br>      "coinbase": "04ffff001d4c575765276c6c2061696d20746f206d616b652063727970746f207472616e736665727320736f2063686561702028262066617374292074686174206f6e6c792074686520726963682077696c6c207573652062616e6b732e",<br>      "sequence": 4294967295<br>    }<br>  ],<br>  "vout": [<br>    {<br>      "value": 500.00000000,<br>      "n": 0,<br>      "scriptPubKey": {<br>    "reqSigs": 1,<br>   "addresses": [<br>  "elcash1qkzcr9rak0gx539guzc3wlxuuw9ycjyr2n7nmu3"<br>    ],<br>    "asm": "021eeacfd38a03fa3eceea46694a2673f933348fa41a4633b5dffd7799154e26d9 OP_CHECKSIG",<br>        "hex": "21021eeacfd38a03fa3eceea46694a2673f933348fa41a4633b5dffd7799154e26d9ac",<br>        "type": "pubkey"<br>      }<br>    }<br>  ],<br>  "hex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff5e04ffff001d4c575765276c6c2061696d20746f206d616b652063727970746f207472616e736665727320736f2063686561702028262066617374292074686174206f6e6c792074686520726963682077696c6c207573652062616e6b732effffffff0100743ba40b0000002321021eeacfd38a03fa3eceea46694a2673f933348fa41a4633b5dffd7799154e26d9ac00000000",<br>  "blockhash": "00000000a9811adc411f15a9c525d667ca467d83dc5461e2d7fc791d1d3926de",<br>  "confirmations": 1,<br>  "time": 1608451200,<br>  "blocktime": 1608451200<br>}</pre> | <pre lang="json">{<br>  "in_active_chain": true,<br>  "txid": "d3133f9c8d4261f44fbd2a8029c56d5d97106adfef11c652d971796cc75dd967",<br>  "hash": "d3133f9c8d4261f44fbd2a8029c56d5d97106adfef11c652d971796cc75dd967",<br><br>  "version": 1,<br>  "size": 189,<br>  "vsize": 189,<br>  "weight": 756,<br>  "locktime": 0,<br>  "vin": [<br>    {<br>      "coinbase": "04ffff001d4c575765276c6c2061696d20746f206d616b652063727970746f207472616e736665727320736f2063686561702028262066617374292074686174206f6e6c792074686520726963682077696c6c207573652062616e6b732e",<br>      "sequence": 4294967295<br>    }<br>  ],<br>  "vout": [<br>    {<br>      "value": 500.00000000,<br>      "n": 0,<br>      "scriptPubKey": {<br>  "reqSigs": 1,<br>    "addresses": [<br> "telcash1qkzcr9rak0gx539guzc3wlxuuw9ycjyr2rt76mt"<br>    ],      "asm": "021eeacfd38a03fa3eceea46694a2673f933348fa41a4633b5dffd7799154e26d9 OP_CHECKSIG",<br>        "hex": "21021eeacfd38a03fa3eceea46694a2673f933348fa41a4633b5dffd7799154e26d9ac",<br>        "type": "pubkey"<br>      }<br>    }<br>  ],<br>  "hex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff5e04ffff001d4c575765276c6c2061696d20746f206d616b652063727970746f207472616e736665727320736f2063686561702028262066617374292074686174206f6e6c792074686520726963682077696c6c207573652062616e6b732effffffff0100743ba40b0000002321021eeacfd38a03fa3eceea46694a2673f933348fa41a4633b5dffd7799154e26d9ac00000000",<br>  "blockhash": "00000000d491a4c437cab521a329bb967c3a2bcb849a83a2c53f7f3c50179ab6",<br>  "confirmations": 2540,<br>  "time": 1600000200,<br>  "blocktime": 1600000200 <br>}</pre> | Required |
| BTCEXP_GENESIS_COINBASE_OUTPUT_ADDRESS_SCRIPTHASH | `cKFiFYWNGfo3heuLY8eSDzHtcRCnn7WVqk` | `eKwjB5zopa7RnpbmfEK2ecepkwVWM7nLCp` | Required |


You may also pass options as CLI arguments, for example:

```bash
./bin/cli.js --port 8080 --bitcoind-port 18443 --bitcoind-cookie ~/.elcash/regtest/.cookie
```

See `./bin/cli.js --help` for the full list of CLI options.

## Run via Docker

1. `docker build -t elcash-rpc-explorer .`
1. `docker run -p 3002:3002 -it elcash-rpc-explorer`

## Local dev environment via docker-compose

1. Prepare `.env` file. If you want setup testnet environment, just copy: `.env-sample` 
1. `docker-compose up -d`

# Support

Support the original developer of BTC RPC Explorer by donating BTC to:

* [3NPGpNyLLmVKCEcuipBs7G4KpQJoJXjDGe](bitcoin:3NPGpNyLLmVKCEcuipBs7G4KpQJoJXjDGe)

