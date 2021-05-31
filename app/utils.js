var debug = require("debug");

var debugLog = debug("btcexp:utils");
var debugErrorLog = debug("btcexp:error");

var Decimal = require("decimal.js");
var request = require("request");
var qrcode = require("qrcode");

var config = require("./config.js");
var coins = require("./coins.js");
var coinConfig = coins[config.coin];
var redisCache = require("./redisCache.js");


var exponentScales = [
	{val:1000000000000000000000000000000000, name:"?", abbreviation:"V", exponent:"33"},
	{val:1000000000000000000000000000000, name:"?", abbreviation:"W", exponent:"30"},
	{val:1000000000000000000000000000, name:"?", abbreviation:"X", exponent:"27"},
	{val:1000000000000000000000000, name:"yotta", abbreviation:"Y", exponent:"24"},
	{val:1000000000000000000000, name:"zetta", abbreviation:"Z", exponent:"21"},
	{val:1000000000000000000, name:"exa", abbreviation:"E", exponent:"18"},
	{val:1000000000000000, name:"peta", abbreviation:"P", exponent:"15"},
	{val:1000000000000, name:"tera", abbreviation:"T", exponent:"12"},
	{val:1000000000, name:"giga", abbreviation:"G", exponent:"9"},
	{val:1000000, name:"mega", abbreviation:"M", exponent:"6"},
	{val:1000, name:"kilo", abbreviation:"K", exponent:"3"}
];

var ipMemoryCache = {};
var ipRedisCache = null;
if (redisCache.active) {
	var onRedisCacheEvent = function(cacheType, eventType, cacheKey) {
		global.cacheStats.redis[eventType]++;
	}

	ipRedisCache = redisCache.createCache("v0", onRedisCacheEvent);
}
var ipCache = {
	get:function(key) {
		return new Promise(function(resolve, reject) {
			if (ipMemoryCache[key] != null) {
				resolve({key:key, value:ipMemoryCache[key]});

				return;
			}

			if (ipRedisCache != null) {
				ipRedisCache.get("ip-" + key).then(function(redisResult) {
					if (redisResult != null) {
						resolve({key:key, value:redisResult});

						return;
					}

					resolve({key:key, value:null});
				});

			} else {
				resolve({key:key, value:null});
			}
		});
	},
	set:function(key, value, expirationMillis) {
		ipMemoryCache[key] = value;

		if (ipRedisCache != null) {
			ipRedisCache.set("ip-" + key, value, expirationMillis);
		}
	}
};

var richestWalletsCache = {
	get:function() {
		return new Promise(function(resolve, reject) {

			if (redisCache.active) {
				redisCache.get("richestWallets").then(function(redisResult) {
					if (redisResult != null) {
						resolve(redisResult);

						return;
					}

					resolve(null);
				});

			} else {
				resolve(null);
			}
		});
	},
	set:function(value, expirationMillis) {
		if (redisCache.active) {
			redisCache.set("richestWallets", value, expirationMillis);
		}
	}
};


function redirectToConnectPageIfNeeded(req, res) {
	if (!req.session.host) {
		req.session.redirectUrl = req.originalUrl;
		
		res.redirect("/");
		res.end();
		
		return true;
	}
	
	return false;
}

function hex2ascii(hex) {
	var str = "";
	for (var i = 0; i < hex.length; i += 2) {
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}
	
	return str;
}

function splitArrayIntoChunks(array, chunkSize) {
	var j = array.length;
	var chunks = [];
	
	for (var i = 0; i < j; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}

	return chunks;
}

function getRandomString(length, chars) {
    var mask = '';
	
    if (chars.indexOf('a') > -1) {
		mask += 'abcdefghijklmnopqrstuvwxyz';
	}
	
    if (chars.indexOf('A') > -1) {
		mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	}
	
    if (chars.indexOf('#') > -1) {
		mask += '0123456789';
	}
    
	if (chars.indexOf('!') > -1) {
		mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
	}
	
    var result = '';
    for (var i = length; i > 0; --i) {
		result += mask[Math.floor(Math.random() * mask.length)];
	}
	
	return result;
}

var formatCurrencyCache = {};

function getCurrencyFormatInfo(formatType) {
	if (formatCurrencyCache[formatType] == null) {
		for (var x = 0; x < coins[config.coin].currencyUnits.length; x++) {
			var currencyUnit = coins[config.coin].currencyUnits[x];

			for (var y = 0; y < currencyUnit.values.length; y++) {
				var currencyUnitValue = currencyUnit.values[y];

				if (currencyUnitValue == formatType) {
					formatCurrencyCache[formatType] = currencyUnit;
				}
			}
		}
	}

	if (formatCurrencyCache[formatType] != null) {
		return formatCurrencyCache[formatType];
	}

	return null;
}

function formatCurrencyAmountWithForcedDecimalPlaces(amount, formatType, forcedDecimalPlaces) {
	var formatInfo = getCurrencyFormatInfo(formatType);
	if (formatInfo != null) {
		var dec = new Decimal(amount);
		var decimalPlaces = formatInfo.decimalPlaces;

		if (forcedDecimalPlaces >= 0) {
			decimalPlaces = forcedDecimalPlaces;
		}

		if (formatInfo.type == "native") {
			dec = dec.times(formatInfo.multiplier);

			return addThousandsSeparators(removeTrailingZeros(dec, decimalPlaces)) + " " + formatInfo.name;

		} else if (formatInfo.type == "exchanged") {
			if (global.exchangeRates != null && global.exchangeRates[formatInfo.multiplier] != null) {
				dec = dec.times(global.exchangeRates[formatInfo.multiplier]);

				return addThousandsSeparators(removeTrailingZeros(dec, decimalPlaces)) + " " + formatInfo.name;

			} else {
				return formatCurrencyAmountWithForcedDecimalPlaces(amount, coinConfig.defaultCurrencyUnit.name, forcedDecimalPlaces);
			}
		}
	}
	
	return amount;
}

function formatCurrencyAmount(amount, formatType) {
	return formatCurrencyAmountWithForcedDecimalPlaces(amount, formatType, -1);
}

function formatCurrencyAmountInSmallestUnits(amount, forcedDecimalPlaces) {
	return formatCurrencyAmountWithForcedDecimalPlaces(amount, coins[config.coin].baseCurrencyUnit.name, forcedDecimalPlaces);
}

// ref: https://stackoverflow.com/a/2901298/673828
function addThousandsSeparators(x) {
	var parts = x.toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

	return parts.join(".");
}

const removeTrailingZeros = (decimal, digits) => decimal.toFixed(digits).replace(/(\.[0-9]*[1-9])0+$|\.0*$/,'$1');

function formatExchangedCurrency(amount, exchangeType) {
	if (global.exchangeRates != null) {
		var dec = new Decimal(amount);
		if (exchangeType.toLowerCase() === 'usd' && global.exchangeRates['usdt'] != null && global.exchangeRates['usdtusd'] != null) {
			dec = dec.times(global.exchangeRates['usdt']).times(global.exchangeRates['usdtusd']);
			var exchangedAmt = parseFloat(dec).toFixed(4);
			return "$" + addThousandsSeparators(exchangedAmt);
		}
		if (exchangeType.toLowerCase() === 'btc' && global.exchangeRates['btc'] != null) {
			dec = dec.times(global.exchangeRates['btc'])
			var exchangedAmt = parseFloat(dec).toFixed(4);
			return exchangedAmt + " BTC";
		}
	}

	return "";
}

function seededRandom(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function seededRandomIntBetween(seed, min, max) {
	var rand = seededRandom(seed);
	return (min + (max - min) * rand);
}

function ellipsize(str, length) {
	if (str.length <= length) {
		return str;

	} else {
		return str.substring(0, length - 3) + "...";
	}
}

function logMemoryUsage() {
	var mbUsed = process.memoryUsage().heapUsed / 1024 / 1024;
	mbUsed = Math.round(mbUsed * 100) / 100;

	var mbTotal = process.memoryUsage().heapTotal / 1024 / 1024;
	mbTotal = Math.round(mbTotal * 100) / 100;
}

function getMinerFromCoinbaseTx(tx) {
	if (tx == null || tx.vin == null || tx.vin.length == 0) {
		return null;
	}
	
	if (global.miningPoolsConfigs) {
		for (var i = 0; i < global.miningPoolsConfigs.length; i++) {
			var miningPoolsConfig = global.miningPoolsConfigs[i];

			for (var payoutAddress in miningPoolsConfig.payout_addresses) {
				if (miningPoolsConfig.payout_addresses.hasOwnProperty(payoutAddress)) {
					if (tx.vout && tx.vout.length > 0 && tx.vout[0].scriptPubKey && tx.vout[0].scriptPubKey.addresses && tx.vout[0].scriptPubKey.addresses.length > 0) {
						if (tx.vout[0].scriptPubKey.addresses[0] == payoutAddress) {
							var minerInfo = miningPoolsConfig.payout_addresses[payoutAddress];
							minerInfo.identifiedBy = "payout address " + payoutAddress;

							return minerInfo;
						}
					}
				}
			}

			for (var coinbaseTag in miningPoolsConfig.coinbase_tags) {
				if (miningPoolsConfig.coinbase_tags.hasOwnProperty(coinbaseTag)) {
					if (hex2ascii(tx.vin[0].coinbase).indexOf(coinbaseTag) != -1) {
						var minerInfo = miningPoolsConfig.coinbase_tags[coinbaseTag];
						minerInfo.identifiedBy = "coinbase tag '" + coinbaseTag + "'";

						return minerInfo;
					}
				}
			}
		}
	}

	return null;
}

function getNameFromAddress(address) {
	if (global.miningPoolsConfigs) {
		for (var i = 0; i < global.miningPoolsConfigs.length; i++) {
			var miningPoolsConfig = global.miningPoolsConfigs[i];
			for (var payoutAddress in miningPoolsConfig.payout_addresses) {
				if (miningPoolsConfig.payout_addresses.hasOwnProperty(payoutAddress)) {
					if (payoutAddress === address) {
						var findedAddress = miningPoolsConfig.payout_addresses[payoutAddress];
						if (findedAddress && findedAddress.name) {
							return findedAddress.name;
						}
					}
				}
			}
		}
	}
	return null;
}


function getTxTotalInputOutputValues(tx, txInputs, blockHeight) {
	var totalInputValue = new Decimal(0);
	var totalOutputValue = new Decimal(0);

	try {
		for (var i = 0; i < tx.vin.length; i++) {
			if (tx.vin[i].coinbase) {
				totalInputValue = totalInputValue.plus(new Decimal(coinConfig.blockRewardFunction(blockHeight)));

			} else {
				var txInput = txInputs[i];

				if (txInput) {
					try {
						var vout = txInput.vout[tx.vin[i].vout];
						if (vout.value) {
							totalInputValue = totalInputValue.plus(new Decimal(vout.value));
						}
					} catch (err) {
						logError("2397gs0gsse", err, {txid:tx.txid, vinIndex:i});
					}
				}
			}
		}
		
		for (var i = 0; i < tx.vout.length; i++) {
			totalOutputValue = totalOutputValue.plus(new Decimal(tx.vout[i].value));
		}
	} catch (err) {
		logError("2308sh0sg44", err, {tx:tx, txInputs:txInputs, blockHeight:blockHeight});
	}

	return {input:totalInputValue, output:totalOutputValue};
}

function getBlockTotalFeesFromCoinbaseTxAndBlockHeight(coinbaseTx, blockHeight) {
	if (coinbaseTx == null) {
		return 0;
	}

	var blockReward = coinConfig.blockRewardFunction(blockHeight);

	var totalOutput = new Decimal(0);
	for (var i = 0; i < coinbaseTx.vout.length; i++) {
		var outputValue = coinbaseTx.vout[i].value;
		if (outputValue > 0) {
			totalOutput = totalOutput.plus(new Decimal(outputValue));
		}
	}

	return totalOutput.minus(new Decimal(blockReward));
}

function refreshExchangeRates() {
	if (!config.queryExchangeRates || config.privacyMode) {
		return;
	}

	if (coins[config.coin].exchangeRateDataUSDT) {
		request(coins[config.coin].exchangeRateDataUSDT.jsonUrl, function(error, response, body) {
			if (error == null && response && response.statusCode && response.statusCode == 200) {
				var responseBody = JSON.parse(body);
				var exchangeRate = coins[config.coin].exchangeRateDataUSDT.responseBodySelectorFunction(responseBody);
				if (exchangeRate != null) {
					if (global.exchangeRates === undefined) global.exchangeRates = {};
					global.exchangeRates["usdt"] = exchangeRate;
					global.exchangeRatesUpdateTime = new Date();

					debugLog("Using exchange rates: " + JSON.stringify(global.exchangeRates) + " starting at " + global.exchangeRatesUpdateTime);

				} else {
					debugLog("Unable to get exchange rate data");
				}
			} else {
				logError("39r7h2390fgewfgds", {error:error, response:response, body:body});
			}
		});
	}

	if (coins[config.coin].exchangeRateDataUSDTUSD) {
		request(coins[config.coin].exchangeRateDataUSDTUSD.jsonUrl, function(error, response, body) {
			if (error == null && response && response.statusCode && response.statusCode == 200) {
				var responseBody = JSON.parse(body);
				var exchangeRate = coins[config.coin].exchangeRateDataUSDTUSD.responseBodySelectorFunction(responseBody);
				if (exchangeRate != null) {
					if (global.exchangeRates === undefined) global.exchangeRates = {};
					global.exchangeRates['usdtusd'] = exchangeRate;
					global.exchangeRatesUpdateTime = new Date();

					debugLog("Using exchange rates: " + JSON.stringify(global.exchangeRates) + " starting at " + global.exchangeRatesUpdateTime);

				} else {
					debugLog("Unable to get exchange rate data");
				}
			} else {
				logError("3825isdgij", {error:error, response:response, body:body});
			}
		});
	}

	if (coins[config.coin].exchangeRateDataBTC) {
		request(coins[config.coin].exchangeRateDataBTC.jsonUrl, function(error, response, body) {
			if (error == null && response && response.statusCode && response.statusCode == 200) {
				var responseBody = JSON.parse(body);
				var exchangeRate = coins[config.coin].exchangeRateDataBTC.responseBodySelectorFunction(responseBody);
				if (exchangeRate != null) {
					if (global.exchangeRates === undefined) global.exchangeRates = {};
					global.exchangeRates['btc'] = exchangeRate;
					global.exchangeRatesUpdateTime = new Date();

					debugLog("Using exchange rates: " + JSON.stringify(global.exchangeRates) + " starting at " + global.exchangeRatesUpdateTime);
				} else {
					debugLog("Unable to get exchange rate data");
				}
			} else {
				logError("39r7h2390fgewfgds", {error:error, response:response, body:body});
			}
		});
	}
}

function refreshCoinSupply() {
		request(process.env.BTCEXP_API_URL + "/status", function(error, response, body) {
			if (error == null && response && response.statusCode && response.statusCode == 200) {
				var responseBody = JSON.parse(body);
				var coinsupply = null;
				if (responseBody.total_coin_supply) {
					coinsupply = responseBody.total_coin_supply;
				}
				if (responseBody.total_coin_supply) {
					global.totalCoinSupply = responseBody.total_coin_supply;
					global.totalCoinSupplyUpdateTime = new Date();

					debugLog("Got total coin supply: " + global.totalCoinSupply);

				} else {
					debugLog("Unable to get total coin supply");
				}
			} else {
				logError("39r7h2390fgewfgds", {error:error, response:response, body:body});
			}
		});
}

function refreshWalletsNumber() {
	request(process.env.BTCEXP_API_URL + "/nonemptywalletsnumber", function(error, response, body) {
		if (error == null && response && response.statusCode && response.statusCode == 200) {
			var responseBody = JSON.parse(body);
			if (responseBody) {
				global.totalWalletsNumber = responseBody;
				global.totalWalletsNumberUpdateTime = new Date();

				debugLog("Got total wallets number: " + global.totalWalletsNumber);

			} else {
				debugLog("Unable to get total wallets number");
			}
		} else {
			logError("35tsdgdfu4567ehbn", {error:error, response:response, body:body});
		}
	});
}

function refreshTxVolume() {
	request(process.env.BTCEXP_API_URL + "/transactionvolume?period=month", function(error, response, body) {
		if (error == null && response && response.statusCode && response.statusCode == 200) {
			var responseBody = JSON.parse(body);
			if (responseBody[responseBody.length - 1].avg) {
				global.txAvgVolume24h = responseBody[responseBody.length - 1].avg;
				global.txAvgVolume24hUpdateTime = new Date();
				debugLog("Got 24h avg tx volume: " + global.txAvgVolume24h);
			} else {
				debugLog("Unable to get 24h avg tx volume.");
			}
		} else {
			logError("35tsdgdfu4567ehbn", {error:error, response:response, body:body});
		}
	});
}

function refreshMiningPoolsData() {
	request(process.env.BTCEXP_API_URL + "/piechartdata", function(error, response, body) {
		if (error == null && response && response.statusCode && response.statusCode == 200) {
			var responseBody = JSON.parse(body);
				global.miningPools = responseBody;
				debugLog("Got mining pools data: " + global.miningPools);
		} else {
			logError("39r7h2390fgewfgds", {error:error, response:response, body:body});
		}
	});
}

// Uses ipstack.com API
function geoLocateIpAddresses(ipAddresses, provider) {
	return new Promise(function(resolve, reject) {
		if (config.privacyMode) {
			resolve({});

			return;
		}

		var ipDetails = {ips:ipAddresses, detailsByIp:{}};

		var promises = [];
		for (var i = 0; i < ipAddresses.length; i++) {
			var ipStr = ipAddresses[i];
			
			promises.push(new Promise(function(resolve2, reject2) {
				ipCache.get(ipStr).then(function(result) {
					if (result.value == null) {
						var apiUrl = "http://api.ipstack.com/" + result.key + "?access_key=" + config.credentials.ipStackComApiAccessKey;
						
						debugLog("Requesting IP-geo: " + apiUrl);

						request(apiUrl, function(error, response, body) {
							if (error) {
								reject2(error);

							} else {
								resolve2({needToProcess:true, response:response});
							}
						});

					} else {
						ipDetails.detailsByIp[result.key] = result.value;

						resolve2({needToProcess:false});
					}
				});
			}));
		}

		Promise.all(promises).then(function(results) {
			for (var i = 0; i < results.length; i++) {
				if (results[i].needToProcess) {
					var res = results[i].response;
					if (res != null && res["statusCode"] == 200) {
						var resBody = JSON.parse(res["body"]);
						var ip = resBody["ip"];

						ipDetails.detailsByIp[ip] = resBody;

						ipCache.set(ip, resBody, 1000 * 60 * 60 * 24 * 365);
					}
				}
			}

			resolve(ipDetails);

		}).catch(function(err) {
			logError("80342hrf78wgehdf07gds", err);

			reject(err);
		});
	});
}

function parseExponentStringDouble(val) {
	var [lead,decimal,pow] = val.toString().split(/e|\./);
	return +pow <= 0 
		? "0." + "0".repeat(Math.abs(pow)-1) + lead + decimal
		: lead + ( +pow >= decimal.length ? (decimal + "0".repeat(+pow-decimal.length)) : (decimal.slice(0,+pow)+"."+decimal.slice(+pow)));
}

function formatLargeNumber(n, decimalPlaces) {
	for (var i = 0; i < exponentScales.length; i++) {
		var item = exponentScales[i];

		var fraction = new Decimal(n / item.val);
		if (fraction >= 1) {
			return [fraction.toDecimalPlaces(decimalPlaces), item];
		}
	}

	return [new Decimal(n).toDecimalPlaces(decimalPlaces), {}];
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {h:h, s:s, l:l};
}

function colorHexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function colorHexToHsl(hex) {
	var rgb = colorHexToRgb(hex);
	return rgbToHsl(rgb.r, rgb.g, rgb.b);
}


// https://stackoverflow.com/a/31424853/673828
const reflectPromise = p => p.then(v => ({v, status: "resolved" }),
                            e => ({e, status: "rejected" }));

global.errorStats = {};

function logError(errorId, err, optionalUserData = null) {
	if (!global.errorLog) {
		global.errorLog = [];
	}

	if (!global.errorStats[errorId]) {
		global.errorStats[errorId] = {
			count: 0,
			firstSeen: new Date().getTime()
		};
	}

	global.errorStats[errorId].count++;
	global.errorStats[errorId].lastSeen = new Date().getTime();

	global.errorLog.push({errorId:errorId, error:err, userData:optionalUserData, date:new Date()});
	while (global.errorLog.length > 100) {
		global.errorLog.splice(0, 1);
	}

	debugErrorLog("Error " + errorId + ": " + err + ", json: " + JSON.stringify(err) + (optionalUserData != null ? (", userData: " + optionalUserData + " (json: " + JSON.stringify(optionalUserData) + ")") : ""));
	
	if (err && err.stack) {
		debugErrorLog("Stack: " + err.stack);
	}

	var returnVal = {errorId:errorId, error:err};
	if (optionalUserData) {
		returnVal.userData = optionalUserData;
	}

	return returnVal;
}

function buildQrCodeUrls(strings) {
	return new Promise(function(resolve, reject) {
		var promises = [];
		var qrcodeUrls = {};

		for (var i = 0; i < strings.length; i++) {
			promises.push(new Promise(function(resolve2, reject2) {
				buildQrCodeUrl(strings[i], qrcodeUrls).then(function() {
					resolve2();

				}).catch(function(err) {
					reject2(err);
				});
			}));
		}

		Promise.all(promises).then(function(results) {
			resolve(qrcodeUrls);

		}).catch(function(err) {
			reject(err);
		});
	});
}

function buildQrCodeUrl(str, results) {
	return new Promise(function(resolve, reject) {
		qrcode.toDataURL(str, function(err, url) {
			if (err) {
				logError("2q3ur8fhudshfs", err, str);

				reject(err);

				return;
			}

			results[str] = url;

			resolve();
		});
	});
}

function getRichestWallets() {
	const REDIS_EXPIRATION_INTERVAL = 1000 * 60;
	return new Promise(function(resolve, reject) {
		richestWalletsCache.get().then(function(result) {
			if (result == null) {
				request.get(process.env.BTCEXP_API_URL + "/richestwallets?limit=100", function(error, response, body) {
					if (error == null && response && response.statusCode && response.statusCode == 200) {
						var responseBody = JSON.parse(body);
						richestWalletsCache.set(JSON.stringify(responseBody), REDIS_EXPIRATION_INTERVAL);
						resolve(responseBody);
					} else {
						logError("rich wallets error", {error:error, response:response, body:body});
						reject(error);
					}
				});
			} else {
				richestWalletsCache.get().then((result) => resolve(JSON.parse(result)))
			}
		}).catch(error => reject(error));
	})
}


module.exports = {
	reflectPromise: reflectPromise,
	redirectToConnectPageIfNeeded: redirectToConnectPageIfNeeded,
	hex2ascii: hex2ascii,
	splitArrayIntoChunks: splitArrayIntoChunks,
	getRandomString: getRandomString,
	getCurrencyFormatInfo: getCurrencyFormatInfo,
	formatCurrencyAmount: formatCurrencyAmount,
	formatCurrencyAmountWithForcedDecimalPlaces: formatCurrencyAmountWithForcedDecimalPlaces,
	formatExchangedCurrency: formatExchangedCurrency,
	addThousandsSeparators: addThousandsSeparators,
	formatCurrencyAmountInSmallestUnits: formatCurrencyAmountInSmallestUnits,
	seededRandom: seededRandom,
	seededRandomIntBetween: seededRandomIntBetween,
	logMemoryUsage: logMemoryUsage,
	getMinerFromCoinbaseTx: getMinerFromCoinbaseTx,
	getBlockTotalFeesFromCoinbaseTxAndBlockHeight: getBlockTotalFeesFromCoinbaseTxAndBlockHeight,
	refreshExchangeRates: refreshExchangeRates,
	refreshCoinSupply: refreshCoinSupply,
	refreshWalletsNumber: refreshWalletsNumber,
	refreshTxVolume: refreshTxVolume,
	parseExponentStringDouble: parseExponentStringDouble,
	formatLargeNumber: formatLargeNumber,
	geoLocateIpAddresses: geoLocateIpAddresses,
	getTxTotalInputOutputValues: getTxTotalInputOutputValues,
	rgbToHsl: rgbToHsl,
	colorHexToRgb: colorHexToRgb,
	colorHexToHsl: colorHexToHsl,
	logError: logError,
	buildQrCodeUrls: buildQrCodeUrls,
	ellipsize: ellipsize,
	refreshMiningPoolsData,
	getNameFromAddress,
  getRichestWallets: getRichestWallets
};
