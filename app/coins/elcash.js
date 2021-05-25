var Decimal = require("decimal.js");
var apiUrl = require('../consts/apiUrl');
Decimal8 = Decimal.clone({ precision:8, rounding:8 });

var currencyUnits = [
	{
		type:"native",
		name:"ELCASH",
		multiplier:1,
		default:true,
		values:["", "elcash", "ELCASH"],
		decimalPlaces:8
	},
	{
		type:"native",
		name:"mELCASH",
		multiplier:1000,
		values:["mELCASH"],
		decimalPlaces:5
	},
	{
		type:"native",
		name:"bits",
		multiplier:1000000,
		values:["bits"],
		decimalPlaces:2
	},
	{
		type:"native",
		name:"sat",
		multiplier:100000000,
		values:["sat", "satoshi"],
		decimalPlaces:0
	},
	// TODO
	// EC-94 Adjustments after demo
	// {
	// 	type:"exchanged",
	// 	name:"USD",
	// 	multiplier:"usd",
	// 	values:["usd"],
	// 	decimalPlaces:2,
	// 	symbol:"$"
	// },
	// {
	// 	type:"exchanged",
	// 	name:"EUR",
	// 	multiplier:"eur",
	// 	values:["eur"],
	// 	decimalPlaces:2,
	// 	symbol:"€"
	// },
];

module.exports = {
	name:"Electric Cash",
	ticker:"ELCASH",
	logoUrl:"/img/logo/electric_cash.svg",
	siteTitle: !!JSON.parse(`${process.env.BTCEXP_IS_TESTNET || "false"}`.toLowerCase()) ? "Electric Cash Testnet Explorer" : "Electric Cash Explorer",
	siteDescriptionHtml:"<b>Electric Cash Explorer</b> is <a href='https://github.com/electric-cash/explorer). If you run your own [Electric Cash Full Node](https://bitcoin.org/en/full-node), **ELCASH Explorer** can easily run alongside it, communicating via RPC calls. See the project [ReadMe](https://github.com/electric-cash/explorer) for a list of features and instructions for running.",
	nodeTitle:"Bitcoin Full Node",
	nodeUrl:"https://bitcoin.org/en/full-node",
	demoSiteUrl: "http://explorer.electriccash.global",
	miningPoolsConfigUrls:[
		"https://raw.githubusercontent.com/btccom/Blockchain-Known-Pools/master/pools.json",
		"https://raw.githubusercontent.com/blockchain/Blockchain-Known-Pools/master/pools.json"
	],
	maxBlockWeight: 4000000,
	targetBlockTimeSeconds: 600,
	currencyUnits:currencyUnits,
	currencyUnitsByName:{"ELCASH":currencyUnits[0], "mELCASH":currencyUnits[1], "bits":currencyUnits[2], "sat":currencyUnits[3]},
	baseCurrencyUnit:currencyUnits[3],
	defaultCurrencyUnit:currencyUnits[0],
	feeSatoshiPerByteBucketMaxima: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 50, 75, 100, 150],
	genesisBlockHash: process.env.BTCEXP_GENESIS_BLOCK_HASH,
	genesisCoinbaseTransactionId: process.env.BTCEXP_GENESIS_COINBASE_TRANSACTION_ID,
	genesisCoinbaseTransaction: JSON.parse(process.env.BTCEXP_GENESIS_COINBASE_TRANSACTION),
	genesisCoinbaseOutputAddressScripthash: process.env.BTCEXP_GENESIS_COINBASE_OUTPUT_ADDRESS_SCRIPTHASH,
	exchangeRateDataUSDT:{
		jsonUrl: apiUrl.EXCHANGE_RATE_USDT,
		responseBodySelectorFunction:function(responseBody) {
			if (responseBody.data && responseBody.data.last_price) {
				return responseBody.data.last_price;
			}
			return null;
		}
	},
	exchangeRateDataBTC:{
		jsonUrl: apiUrl.EXCHANGE_RATE_BTC,
		responseBodySelectorFunction:function(responseBody) {
			if (responseBody.data && responseBody.data.last_price) {
				return responseBody.data.last_price;
			}
			return null;
		}
	},
	exchangeRateDataUSDTUSD:{
		jsonUrl: apiUrl.EXCHANGE_RATE_USDT_USD,
		responseBodySelectorFunction: function(responseBody) {
			if (responseBody.last_price) {
				return responseBody.last_price;
			}
			return null;
		}
	},
	blockRewardFunction:function(blockHeight) {
		const blocksRewardHeight = 52500;
		const firstBlockRewardHeight = 4200;
		const rewardAmounts = [7500000000,
			7000000000,
			6500000000,
			5500000000,
			4000000000,
			2500000000,
			1500000000,
			750000000,
			375000000,
			187500000,
			93750000,
			46875000,
			23437500,
			11718750,
			5859375,
			2929688,
			1464844,
			732422,
			366210,
			183104,
			91552,
			45776,
			22888,
			11444,
			5722,
			2861,
			1430,
			715,
			358,
			179,
			90,
			45,
			23,
			12,
			6,
			3,
			2,
			1
		];
		
		if (blockHeight < firstBlockRewardHeight) {
			return new Decimal8(500);
		}

		for (let index = 0; index < rewardAmounts.length; index++) {
			if (blockHeight < (index + 1) * blocksRewardHeight + firstBlockRewardHeight) {
				return new Decimal8(rewardAmounts[index] * 1e-8);
			}
		}

		return new Decimal8(0);;
	}
};