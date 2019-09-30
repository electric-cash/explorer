var btc = require("./coins/btc.js");
var ltc = require("./coins/ltc.js");

module.exports = {
	"BTCR": btc,
	"BTC": btc,
	"LTC": ltc,

	"coins":["BTCR", "BTC", "LTC"]
};