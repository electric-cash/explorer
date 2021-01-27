#!/usr/bin/env node

'use strict';

var os = require('os');
var path = require('path');
var dotenv = require("dotenv");
var fs = require('fs');

var configPaths = [ path.join(os.homedir(), '.config', 'elcash-rpc-explorer.env'), path.join(process.cwd(), '.env') ];
configPaths.filter(fs.existsSync).forEach(path => {
	console.log('Loading env file:', path);
	dotenv.config({ path });
});

// debug module is already loaded by the time we do dotenv.config
// so refresh the status of DEBUG env var
var debug = require("debug");
debug.enable(process.env.DEBUG || "btcexp:app,btcexp:error");

var debugLog = debug("btcexp:app");
var debugPerfLog = debug("btcexp:actionPerformace");

var express = require('express');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require("express-session");
var csurf = require("csurf");
var config = require("./app/config.js");
var simpleGit = require('simple-git');
var utils = require("./app/utils.js");
var moment = require("moment");
var Decimal = require('decimal.js');
var bitcoinCore = require("bitcoin-core");
var pug = require("pug");
var momentDurationFormat = require("moment-duration-format");
var coreApi = require("./app/api/coreApi.js");
var coins = require("./app/coins.js");
var request = require("request");
var qrcode = require("qrcode");
var addressApi = require("./app/api/addressApi.js");
var electrumAddressApi = require("./app/api/electrumAddressApi.js");
var coreApi = require("./app/api/coreApi.js");
var auth = require('./app/auth.js');

var crawlerBotUserAgentStrings = [ "Googlebot", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider", "YandexBot", "Sogou", "Exabot", "facebot", "ia_archiver" ];

var baseActionsRouter = require('./routes/baseActionsRouter');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// ref: https://blog.stigok.com/post/disable-pug-debug-output-with-expressjs-web-app
app.engine('pug', (path, options, fn) => {
	options.debug = false;
	return pug.__express.call(null, path, options, fn);
});

app.set('view engine', 'pug');

// basic http authentication
if (process.env.BTCEXP_BASIC_AUTH_PASSWORD) {
	app.disable('x-powered-by');
	app.use(auth(process.env.BTCEXP_BASIC_AUTH_PASSWORD));
}

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.png'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
	secret: config.cookieSecret,
	resave: false,
	saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

process.on("unhandledRejection", (reason, p) => {
	debugLog("Unhandled Rejection at: Promise", p, "reason:", reason, "stack:", (reason != null ? reason.stack : "null"));
});

function loadMiningPoolConfigs() {
	global.miningPoolsConfigs = [];

	var miningPoolsConfigDir = path.join(__dirname, "public", "txt", "mining-pools-configs", global.coinConfig.ticker);

	fs.readdir(miningPoolsConfigDir, function(err, files) {
		if (err) {
			utils.logError("3ufhwehe", err, {configDir:miningPoolsConfigDir, desc:"Unable to scan directory"});

			return;
		}

		files.forEach(function(file) {
			var filepath = path.join(miningPoolsConfigDir, file);

			var contents = fs.readFileSync(filepath, 'utf8');

			global.miningPoolsConfigs.push(JSON.parse(contents));
		});
	});

	for (var i = 0; i < global.miningPoolsConfigs.length; i++) {
		for (var x in global.miningPoolsConfigs[i].payout_addresses) {
			if (global.miningPoolsConfigs[i].payout_addresses.hasOwnProperty(x)) {
				global.specialAddresses[x] = {type:"minerPayout", minerInfo:global.miningPoolsConfigs[i].payout_addresses[x]};
			}
		}
	}
}

function getSourcecodeProjectMetadata() {
	var options = {
		url: "https://api.github.com/repos/electric-cash/explorer",
		headers: {
			'User-Agent': 'request'
		}
	};

	request(options, function(error, response, body) {
		if (error == null && response && response.statusCode && response.statusCode == 200) {
			var responseBody = JSON.parse(body);

			global.sourcecodeProjectMetadata = responseBody;

		} else {
			utils.logError("3208fh3ew7eghfg", {error:error, response:response, body:body});
		}
	});
}


app.runOnStartup = function() {
	global.config = config;
	global.coinConfig = coins[config.coin];
	global.coinConfigs = coins;

	debugLog(`Running RPC Explorer for ${global.coinConfig.name}`);

	var rpcCred = config.credentials.rpc;
	debugLog(`Connecting via RPC to node at ${rpcCred.host}:${rpcCred.port}`);

	var rpcClientProperties = {
		host: rpcCred.host,
		port: rpcCred.port,
		username: rpcCred.username,
		password: rpcCred.password,
		timeout: rpcCred.timeout
	};

	global.client = new bitcoinCore(rpcClientProperties);

	coreApi.getNetworkInfo().then(function(getnetworkinfo) {
		debugLog(`Connected via RPC to node. Basic info: version=${getnetworkinfo.version}, subversion=${getnetworkinfo.subversion}, protocolversion=${getnetworkinfo.protocolversion}, services=${getnetworkinfo.localservices}`);

	}).catch(function(err) {
		utils.logError("32ugegdfsde", err);
	});

	if (config.donations.addresses) {
		var getDonationAddressQrCode = function(coinId) {
			qrcode.toDataURL(config.donations.addresses[coinId].address, function(err, url) {
				global.donationAddressQrCodeUrls[coinId] = url;
			});
		};

		global.donationAddressQrCodeUrls = {};

		config.donations.addresses.coins.forEach(function(item) {
			getDonationAddressQrCode(item);
		});
	}

	global.specialTransactions = {};
	global.specialBlocks = {};
	global.specialAddresses = {};

	if (config.donations.addresses && config.donations.addresses[coinConfig.ticker]) {
		global.specialAddresses[config.donations.addresses[coinConfig.ticker].address] = {type:"donation"};
	}

	if (global.coinConfig.historicalData) {
		global.coinConfig.historicalData.forEach(function(item) {
			if (item.type == "blockheight") {
				global.specialBlocks[item.blockHash] = item;

			} else if (item.type == "tx") {
				global.specialTransactions[item.txid] = item;

			} else if (item.type == "address") {
				global.specialAddresses[item.address] = {type:"fun", addressInfo:item};
			}
		});
	}

	if (config.addressApi) {
		var supportedAddressApis = addressApi.getSupportedAddressApis();
		if (!supportedAddressApis.includes(config.addressApi)) {
			utils.logError("32907ghsd0ge", `Unrecognized value for BTCEXP_ADDRESS_API: '${config.addressApi}'. Valid options are: ${supportedAddressApis}`);
		}

		if (config.addressApi == "electrumx") {
			if (config.electrumXServers && config.electrumXServers.length > 0) {
				electrumAddressApi.connectToServers().then(function() {
					global.electrumAddressApi = electrumAddressApi;
					
				}).catch(function(err) {
					utils.logError("31207ugf4e0fed", err, {electrumXServers:config.electrumXServers});
				});
			} else {
				utils.logError("327hs0gde", "You must set the 'BTCEXP_ELECTRUMX_SERVERS' environment variable when BTCEXP_ADDRESS_API=electrumx.");
			}
		}
	}


	loadMiningPoolConfigs();

	if (global.sourcecodeVersion == null && fs.existsSync('.git')) {
		simpleGit(".").log(["-n 1"], function(err, log) {
			if (err) {
				utils.logError("3fehge9ee", err, {desc:"Error accessing git repo"});

				return;
			}
			
			global.sourcecodeVersion = log.all[0].hash.substring(0, 10);
			global.sourcecodeDate = log.all[0].date.substring(0, "0000-00-00".length);
		});
	}

	if (config.demoSite) {
		getSourcecodeProjectMetadata();
		setInterval(getSourcecodeProjectMetadata, 3600000);
	}

	if (!global.exchangeRates) {
		utils.refreshExchangeRates();
	}

	if (!global.totalCoinSupply) {
		utils.refreshCoinSupply();
	}

	if (!global.totalWalletsNumber) {
		utils.refreshWalletsNumber();
	}

	if (!global.txAvgVolume24h) {
		utils.refreshTxVolume();
	}

	if (!global.miningPools) {
		utils.refreshMiningPoolsData();
	}

	// refresh exchange rate periodically
	setInterval(utils.refreshExchangeRates, 1800000);
	setInterval(utils.refreshCoinSupply, 60000);
	setInterval(utils.refreshWalletsNumber, 60000);
	setInterval(utils.refreshTxVolume, 60000);
	setInterval(utils.refreshMiningPoolsData, 60000);

	utils.logMemoryUsage();
	setInterval(utils.logMemoryUsage, 5000);
};

app.use(function(req, res, next) {
	req.startTime = Date.now();
	req.startMem = process.memoryUsage().heapUsed;

	next();
});

app.use(function(req, res, next) {
	// make session available in templates
	res.locals.session = req.session;

	if (config.credentials.rpc && req.session.host == null) {
		req.session.host = config.credentials.rpc.host;
		req.session.port = config.credentials.rpc.port;
		req.session.username = config.credentials.rpc.username;
	}

	var userAgent = req.headers['user-agent'];
	for (var i = 0; i < crawlerBotUserAgentStrings.length; i++) {
		if (userAgent.indexOf(crawlerBotUserAgentStrings[i]) != -1) {
			res.locals.crawlerBot = true;
		}
	}

	res.locals.config = global.config;
	res.locals.coinConfig = global.coinConfig;
	
	res.locals.host = req.session.host;
	res.locals.port = req.session.port;

	res.locals.genesisBlockHash = coreApi.getGenesisBlockHash();
	res.locals.genesisCoinbaseTransactionId = coreApi.getGenesisCoinbaseTransactionId();

	res.locals.pageErrors = [];


	// currency format type
	if (!req.session.currencyFormatType) {
		var cookieValue = req.cookies['user-setting-currencyFormatType'];

		if (cookieValue) {
			req.session.currencyFormatType = cookieValue;

		} else {
			req.session.currencyFormatType = "";
		}
	}

	// theme
	if (!req.session.uiTheme) {
		var cookieValue = req.cookies['user-setting-uiTheme'];

		if (cookieValue) {
			req.session.uiTheme = cookieValue;

		} else {
			req.session.uiTheme = "";
		}
	}

	// homepage banner
	if (!req.session.hideHomepageBanner) {
		var cookieValue = req.cookies['user-setting-hideHomepageBanner'];

		if (cookieValue) {
			req.session.hideHomepageBanner = cookieValue;

		} else {
			req.session.hideHomepageBanner = "false";
		}
	}

	res.locals.currencyFormatType = req.session.currencyFormatType;


	if (!["/", "/connect"].includes(req.originalUrl)) {
		if (utils.redirectToConnectPageIfNeeded(req, res)) {
			return;
		}
	}

	if (req.session.userMessage) {
		res.locals.userMessage = req.session.userMessage;
		
		if (req.session.userMessageType) {
			res.locals.userMessageType = req.session.userMessageType;
			
		} else {
			res.locals.userMessageType = "warning";
		}

		req.session.userMessage = null;
		req.session.userMessageType = null;
	}

	if (req.session.query) {
		res.locals.query = req.session.query;

		req.session.query = null;
	}

	// make some var available to all request
	// ex: req.cheeseStr = "cheese";

	next();
});

app.use(csurf(), (req, res, next) => {
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use('/', baseActionsRouter);

app.use(function(req, res, next) {
	var time = Date.now() - req.startTime;
	var memdiff = process.memoryUsage().heapUsed - req.startMem;

	debugPerfLog("Finished action '%s' in %d ms", req.path, time);
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

app.locals.moment = moment;
app.locals.Decimal = Decimal;
app.locals.utils = utils;



module.exports = app;
