var btc = require("./coins/btc.js");
var ltc = require("./coins/ltc.js");

module.exports = {
	"ELCASH": btc,
	"BTC": btc,
	"LTC": ltc,

	"coins":["ELCASH", "BTC", "LTC"]
};