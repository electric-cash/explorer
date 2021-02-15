var fs = require('fs');
var crypto = require('crypto');
var url = require('url');

var coins = require("./coins.js");
var credentials = require("./credentials.js");

var currentCoin = process.env.BTCEXP_COIN || "BTC"; // BTC is the same as ELCASH

var rpcCred = credentials.rpc;

if (rpcCred.cookie && !rpcCred.username && !rpcCred.password && fs.existsSync(rpcCred.cookie)) {
	console.log(`Loading RPC cookie file: ${rpcCred.cookie}`);
	
	[ rpcCred.username, rpcCred.password ] = fs.readFileSync(rpcCred.cookie).toString().split(':', 2);
	
	if (!rpcCred.password) {
		throw new Error(`Cookie file ${rpcCred.cookie} in unexpected format`);
	}
}

var cookieSecret = process.env.BTCEXP_COOKIE_SECRET
 || (rpcCred.password && crypto.createHmac('sha256', JSON.stringify(rpcCred))
                               .update('-cookie-secret').digest('hex'))
 || "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";


var electrumXServerUriStrings = (process.env.BTCEXP_ELECTRUMX_SERVERS || "").split(',').filter(Boolean);
var electrumXServers = [];
for (var i = 0; i < electrumXServerUriStrings.length; i++) {
	var uri = url.parse(electrumXServerUriStrings[i]);
	
	electrumXServers.push({protocol:uri.protocol.substring(0, uri.protocol.length - 1), host:uri.hostname, port:parseInt(uri.port)});
}

["BTCEXP_DEMO", "BTCEXP_PRIVACY_MODE", "BTCEXP_NO_INMEMORY_RPC_CACHE"].forEach(function(item) {
	if (process.env[item] === undefined) {
		process.env[item] = "false";
	}
});

["BTCEXP_NO_RATES", "BTCEXP_UI_SHOW_TOOLS_SUBHEADER"].forEach(function(item) {
	if (process.env[item] === undefined) {
		process.env[item] = "true";
	}
});

module.exports = {
	coin: currentCoin,
	cookieSecret: cookieSecret,
	privacyMode: (process.env.BTCEXP_PRIVACY_MODE.toLowerCase() == "true"),
	demoSite: (process.env.BTCEXP_DEMO.toLowerCase() == "true"),
	queryExchangeRates: (process.env.BTCEXP_NO_RATES.toLowerCase() != "true"),
	noInmemoryRpcCache: (process.env.BTCEXP_NO_INMEMORY_RPC_CACHE.toLowerCase() == "true"),
	
	rpcConcurrency: (process.env.BTCEXP_RPC_CONCURRENCY || 10),

	rpcBlacklist:
	  process.env.BTCEXP_RPC_ALLOWALL  ? []
	: process.env.BTCEXP_RPC_BLACKLIST ? process.env.BTCEXP_RPC_BLACKLIST.split(',').filter(Boolean)
	: [
		"addnode",
		"backupwallet",
		"bumpfee",
		"clearbanned",
		"createmultisig",
		"createwallet",
		"disconnectnode",
		"dumpprivkey",
		"dumpwallet",
		"encryptwallet",
		"generate",
		"generatetoaddress",
		"getaccountaddrss",
		"getaddressesbyaccount",
		"getbalance",
		"getnewaddress",
		"getrawchangeaddress",
		"getreceivedbyaccount",
		"getreceivedbyaddress",
		"gettransaction",
		"getunconfirmedbalance",
		"getwalletinfo",
		"importaddress",
		"importmulti",
		"importprivkey",
		"importprunedfunds",
		"importpubkey",
		"importwallet",
		"keypoolrefill",
		"listaccounts",
		"listaddressgroupings",
		"listlockunspent",
		"listreceivedbyaccount",
		"listreceivedbyaddress",
		"listsinceblock",
		"listtransactions",
		"listunspent",
		"listwallets",
		"lockunspent",
		"logging",
		"move",
		"preciousblock",
		"pruneblockchain",
		"removeprunedfunds",
		"rescanblockchain",
		"savemempool",
		"sendfrom",
		"sendmany",
		"sendtoaddress",
		"sendrawtransaction",
		"setaccount",
		"setban",
		"setnetworkactive",
		"signmessage",
		"signmessagewithprivatekey",
		"signrawtransaction",
		"stop",
		"submitblock",
		"verifychain",
		"walletlock",
		"walletpassphrase",
		"walletpassphrasechange",
	],

	addressApi:process.env.BTCEXP_ADDRESS_API,
	electrumXServers:electrumXServers,

	redisUrl:process.env.BTCEXP_REDIS_URL,

	site: {
		blockTxPageSize:20,
		addressTxPageSize: 20,
		txMaxInput:15,
		browseBlocksPageSize:20,
		addressPage:{
			txOutputMaxDefaultDisplay:10
		},
		header:{
			showToolsSubheader:(process.env.BTCEXP_UI_SHOW_TOOLS_SUBHEADER == "true"),
			dropdowns:[]
		}
	},

	credentials: credentials,

	// TODO
	// EC-94 Adjustments after demo
	siteTools:[
		{name:"Node Status", url:"/node-status", desc:"Summary of this node: version, network, uptime, etc.", image:"node-status"},
		{name:"Peers", url:"/peers", desc:"Detailed info about the peers connected to this node.", image:"peers"},

		{name:"Browse Blocks", url:"/blocks", desc:"Browse all blocks in the blockchain.", image:"browse-blocks"},
		{name:"Transaction Stats", url:"/tx-stats", desc:"See graphs of total transaction volume and transaction rates.", image:"avg-tx"},

		{name:"Mempool Summary", url:"/mempool-summary", desc:"Detailed summary of the current mempool for this node.", image:"mempool-summary"},
		{name:"Unconfirmed Transactions", url:"/unconfirmed-tx", desc:"Browse unconfirmed/pending transactions.", image:"unlock"}

		// {name:"RPC Browser", url:"/rpc-browser", desc:"Browse the RPC functionality of this node. See docs and execute commands.", image:"rpc-browser"},
		// {name:"Hashrate distribution", url:"/mining-pools", desc:"Estimated hashrate of mining pools.", image:"hashrate-distribution"}
	],
	
	donations:{
		addresses:{
			coins:["BTC"],
			sites:{"BTC":"https://btc.chaintools.io"},

			"BTC":{address:"3NPGpNyLLmVKCEcuipBs7G4KpQJoJXjDGe"}
		},
		btcpayserver:{
			host:"https://btcpay.chaintools.io",
			storeId:"DUUExHMvKNAFukrJZHCShMhwZvfPq87QnkUhvE6h5kh2",
			notifyEmail:"chaintools.io@gmail.com"
		}
	}
};
