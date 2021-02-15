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
	siteTitle: !!JSON.parse(`${process.env.BTCEXP_IS_TESTNET}`.toLowerCase()) ? "Electric Cash Testnet Explorer" : "Electric Cash Explorer",
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
	historicalData: [
		{
			type: "blockheight",
			date: "2009-01-03",
			blockHeight: 0,
			blockHash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
			summary: "The Bitcoin Genesis Block.",
			alertBodyHtml: "This is the first block in the Bitcoin blockchain, known as the 'Genesis Block'. This block was mined by Bitcoin's creator Satoshi Nakamoto. You can read more about <a href='https://en.bitcoin.it/wiki/Genesis_block'>the genesis block</a>.",
			referenceUrl: "https://en.bitcoin.it/wiki/Genesis_block"
		},
		{
			type: "tx",
			date: "2009-01-03",
			txid: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
			summary: "The coinbase transaction of the Genesis Block.",
			alertBodyHtml: "This transaction doesn't really exist! This is the coinbase transaction of the <a href='/block/000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'>Bitcoin Genesis Block</a>. For more background about this special-case transaction, you can read <a href='https://github.com/bitcoin/bitcoin/issues/3303'>this brief discussion</a> among some of the <a href='https://bitcoin.org'>Bitcoin</a> developers.",
			referenceUrl: "https://github.com/bitcoin/bitcoin/issues/3303"
		},
		{
			type: "tx",
			date: "2009-10-12",
			txid: "7dff938918f07619abd38e4510890396b1cef4fbeca154fb7aafba8843295ea2",
			summary: "First bitcoin traded for fiat currency.",
			alertBodyHtml: "In this first-known BTC-to-fiat transaction, 5,050 BTC were exchanged for 5.02 USD, at an effective exchange rate of ~0.001 USD/BTC.",
			referenceUrl: "https://twitter.com/marttimalmi/status/423455561703624704"
		},
		{
			type: "blockheight",
			date: "2017-08-24",
			blockHeight: 481824,
			blockHash: "0000000000000000001c8018d9cb3b742ef25114f27563e3fc4a1902167f9893",
			summary: "First SegWit block.",
			referenceUrl: "https://twitter.com/conio/status/900722226911219712"
		},
		{
			type: "tx",
			date: "2017-08-24",
			txid: "8f907925d2ebe48765103e6845C06f1f2bb77c6adc1cc002865865eb5cfd5c1c",
			summary: "First SegWit transaction.",
			referenceUrl: "https://twitter.com/KHS9NE/status/900553902923362304"
		},
		{
			type: "tx",
			date: "2014-06-16",
			txid: "143a3d7e7599557f9d63e7f224f34d33e9251b2c23c38f95631b3a54de53f024",
			summary: "Star Wars: A New Hope",
			referenceUrl: ""
		},
		{
			type: "tx",
			date: "2010-05-22",
			txid: "a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d",
			summary: "The 'Bitcoin Pizza' transaction.",
			alertBodyHtml: "This is the famous 'Bitcoin Pizza' transaction.",
			referenceUrl: "https://bitcointalk.org/index.php?topic=137.0"
		},
		{
			type: "tx",
			date: "2011-05-18",
			txid: "5d80a29be1609db91658b401f85921a86ab4755969729b65257651bb9fd2c10d",
			summary: "Destroyed bitcoin.",
			referenceUrl: "https://www.reddit.com/r/Bitcoin/comments/7mhoks/til_in_2011_a_user_running_a_modified_mining/"
		},
		{
			type: "blockheight",
			date: "2009-01-12",
			blockHeight: 170,
			blockHash: "00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee",
			summary: "First block containing a (non-coinbase) transaction.",
			alertBodyHtml: "This block comes 9 days after the genesis block and is the first to contain a transfer of bitcoin. Before this block all blocks contained only coinbase transactions which mint new bitcoin.",
			referenceUrl: "https://bitcointalk.org/index.php?topic=91806.msg1012234#msg1012234"
		},
		{
			type: "blockheight",
			date: "2017-08-25",
			blockHeight: 481947,
			blockHash: "00000000000000000139cb443e16442fcd07a4a0e0788dd045ee3cf268982016",
			summary: "First block mined that was greater than 1MB.",
			referenceUrl: "https://en.bit.news/bitfury-mined-first-segwit-block-size-1-mb/"
		},
		{
			type: "blockheight",
			date: "2018-01-20",
			blockHeight: 505225,
			blockHash: "0000000000000000001bbb529c64ddf55edec8f4ebc0a0ccf1d3bb21c278bfa7",
			summary: "First block mined that was greater than 2MB.",
			referenceUrl: "https://twitter.com/BitGo/status/954998877920247808"
		},
		{
			type: "tx",
			date: "2017-12-30",
			txid: "9bf8853b3a823bbfa1e54017ae11a9e1f4d08a854dcce9f24e08114f2c921182",
			summary: "Block reward lost",
			alertBodyHtml: "This coinbase transaction completely fails to collect the block's mining reward. 12.5 BTC were lost.",
			referenceUrl: "https://bitcoin.stackexchange.com/a/67012/3397"
		},
		{
			type:"address",
			date:"2011-12-03",
			address:"1JryTePceSiWVpoNBU8SbwiT7J4ghzijzW",
			summary:"Brainwallet address for 'Satoshi Nakamoto'",
			referenceUrl:"https://twitter.com/MrHodl/status/1041448002005741568",
			alertBodyHtml:"This address was generated from the SHA256 hash of 'Satoshi Nakamoto' as example of the 'brainwallet' concept."
		},
		{
			type: "tx",
			date: "2010-11-14",
			txid: "e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468",
			summary: "Duplicated coinbase transaction #1",
			referenceUrl: "https://bitcoin.stackexchange.com/questions/38994/will-there-be-21-million-bitcoins-eventually/38998#38998",
			alertBodyHtml: "This is one of 2 'duplicate coinbase' transactions. An early bitcoin bug (fixed by <a href='https://github.com/bitcoin/bips/blob/master/bip-0030.mediawiki'>BIP30</a>) allowed identical coinbase transactions - a newer duplicate would overwrite older copies. This transaction was the coinbase transaction for <a href='/block-height/91722'>Block #91,722</a> and, ~16 hours later, <a href='/block-height/91880'>Block #91,880</a>. The 50 BTC claimed as the coinbase for block 91,722 were also overwritten and lost."
		},
		{
			type: "tx",
			date: "2010-11-14",
			txid: "d5d27987d2a3dfc724e359870c6644b40e497bdc0589a033220fe15429d88599",
			summary: "Duplicated coinbase transaction #2",
			referenceUrl: "https://bitcoin.stackexchange.com/questions/38994/will-there-be-21-million-bitcoins-eventually/38998#38998",
			alertBodyHtml: "This is one of 2 'duplicate coinbase' transactions. An early bitcoin bug (fixed by <a href='https://github.com/bitcoin/bips/blob/master/bip-0030.mediawiki'>BIP30</a>) allowed identical coinbase transactions - a newer duplicate would overwrite older copies. This transaction was the coinbase transaction for <a href='/block-height/91812'>Block #91,812</a> and, ~3 hours later, <a href='/block-height/91842'>Block #91,842</a>. The 50 BTC claimed as the coinbase for block 91,812 were also overwritten and lost."
		}
	],
	exchangeRateDataUSDT:{
		jsonUrl: apiUrl.EXCHANGE_RATE_USDT,
		responseBodySelectorFunction:function(responseBody) {
<<<<<<< HEAD
<<<<<<< HEAD
			if (responseBody.data && responseBody.data.last_price) {
				return responseBody.data.last_price;
=======
			if (responseBody.last_price) {
				return responseBody.last_price;
>>>>>>> 60eec68... build(merge): from master
=======
			if (responseBody.data && responseBody.data.last_price) {
				return responseBody.data.last_price;
>>>>>>> cf7a163... build(merge): master
			}
			return null;
		}
	},
	exchangeRateDataBTC:{
		jsonUrl: apiUrl.EXCHANGE_RATE_BTC,
		responseBodySelectorFunction:function(responseBody) {
<<<<<<< HEAD
<<<<<<< HEAD
			if (responseBody.data && responseBody.data.last_price) {
				return responseBody.data.last_price;
=======
			if (responseBody.last_price) {
				return responseBody.last_price;
>>>>>>> 60eec68... build(merge): from master
=======
			if (responseBody.data && responseBody.data.last_price) {
				return responseBody.data.last_price;
>>>>>>> cf7a163... build(merge): master
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