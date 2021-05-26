const express = require('express');
const csurf = require('csurf');
const router = express.Router();
const qrcode = require('qrcode');
const bitcoinjs = require('bitcoinjs-lib');
const sha256 = require("crypto-js/sha256");
const hexEnc = require("crypto-js/enc-hex");
const Decimal = require("decimal.js");
const d3ScaleChromatic = require("d3-scale-chromatic");

const utils = require('./../app/utils.js');
const coins = require("./../app/coins.js");
const config = require("./../app/config.js");
const coreApi = require("./../app/api/coreApi.js");
const addressApi = require("./../app/api/addressApi.js");
const helpers = require("./../app/helpers/colorGenerator.js");

const v8 = require('v8');

csurf({ ignoreMethods: [] });

router.get("/", (req, res, next) => {

	res.locals.homepage = true;

	let promises = [];

	promises.push(coreApi.getMempoolInfo());
	promises.push(coreApi.getMiningInfo());

	coreApi.getBlockchainInfo().then(getblockchaininfo => {
		let i;
		res.locals.getblockchaininfo = getblockchaininfo;

		if (getblockchaininfo.chain !== 'regtest') {
			let targetBlocksPerDay = 24 * 60 * 60 / global.coinConfig.targetBlockTimeSeconds;

			promises.push(coreApi.getTxCountStats(targetBlocksPerDay / 4, -targetBlocksPerDay, "latest"));

			let chainTxStatsIntervals = [targetBlocksPerDay, targetBlocksPerDay * 7, targetBlocksPerDay * 30, targetBlocksPerDay * 365]
				.filter(numBlocks => numBlocks <= getblockchaininfo.blocks);

			res.locals.chainTxStatsLabels = [ "24 hours", "1 week", "1 month", "1 year" ]
				.slice(0, chainTxStatsIntervals.length)
				.concat("All time");

			for (i = 0; i < chainTxStatsIntervals.length; i++) {
				promises.push(coreApi.getChainTxStats(chainTxStatsIntervals[i]));
			}
		}

		let blockHeights = [];
		if (getblockchaininfo.blocks) {
			for (i = 0; i < 10; i++) {
				blockHeights.push(getblockchaininfo.blocks - i);
			}
		}

		if (getblockchaininfo.chain !== 'regtest') {
			promises.push(coreApi.getChainTxStats(getblockchaininfo.blocks - 1));
		}

		coreApi.getBlocksByHeight(blockHeights).then(latestBlocks => {
			res.locals.latestBlocks = latestBlocks;

			Promise.all(promises).then(promiseResults => {
				res.locals.mempoolInfo = promiseResults[0];
				res.locals.miningInfo = promiseResults[1];

				if (getblockchaininfo.chain !== 'regtest') {
					res.locals.txStats = promiseResults[2];

					var chainTxStats = [];
					for (var i = 0; i < res.locals.chainTxStatsLabels.length; i++) {
						chainTxStats.push(promiseResults[i + 3]);
					}

					res.locals.chainTxStats = chainTxStats;
				}

				res.render("index");
			});
		});
	}).catch(err => {
		res.locals.userMessage = "Error loading recent blocks: " + err;

		res.render("index");

		next();
	});
});

router.get("/node-status", (req, res, next) => {
	coreApi.getBlockchainInfo().then(getblockchaininfo => {
		res.locals.getblockchaininfo = getblockchaininfo;

		coreApi.getNetworkInfo().then(getnetworkinfo => {
			res.locals.getnetworkinfo = getnetworkinfo;

			coreApi.getUptimeSeconds().then(uptimeSeconds => {
				res.locals.uptimeSeconds = uptimeSeconds;

				coreApi.getNetTotals().then(getnettotals => {
					res.locals.getnettotals = getnettotals;

					res.render("node-status");
				}).catch(err => {
					res.locals.userMessage = "Error getting node status: (id=0), err=" + err;

					res.render("node-status");

					next();
				});
			}).catch(err => {
				res.locals.userMessage = "Error getting node status: (id=1), err=" + err;

				res.render("node-status");

				next();
			});
		}).catch(err => {
			res.locals.userMessage = "Error getting node status: (id=2), err=" + err;
			res.render("node-status");
		});
	}).catch(err => {
		res.locals.userMessage = "Error getting node status: (id=3), err=" + err;

		res.render("node-status");

		next();
	});
});

router.get("/mempool-summary", (req, res, next) => {
	coreApi.getMempoolInfo().then(getmempoolinfo => {
		res.locals.getmempoolinfo = getmempoolinfo;

		coreApi.getMempoolStats().then(mempoolstats => {
			res.locals.mempoolstats = mempoolstats;

			res.render("mempool-summary");
		});
	}).catch(err => {
		res.locals.userMessage = "Error: " + err;

		res.render("mempool-summary");

		next();
	});
});

router.get("/peers", (req, res, next) => {
	coreApi.getPeerSummary().then(peerSummary => {
		res.locals.peerSummary = peerSummary;

		var peerIps = [];
		for (var i = 0; i < peerSummary.getpeerinfo.length; i++) {
			var ipWithPort = peerSummary.getpeerinfo[i].addr;
			if (ipWithPort.lastIndexOf(":") >= 0) {
				var ip = ipWithPort.substring(0, ipWithPort.lastIndexOf(":"));
				if (ip.trim().length > 0) {
					peerIps.push(ip.trim());
				}
			}
		}

		if (peerIps.length > 0) {
			utils.geoLocateIpAddresses(peerIps).then(results => {
				res.locals.peerIpSummary = results;
				
				res.render("peers");

				next();
			});
		} else {
			res.render("peers");
		}
	}).catch(err => {
		res.locals.userMessage = "Error: " + err;

		res.render("peers");

		next();
	});
});

router.get("/changeSetting", (req, res) => {
	if (req.query.name) {
		req.session[req.query.name] = req.query.value;

		res.cookie('user-setting-' + req.query.name, req.query.value);
	}

	res.redirect(req.headers.referer);
});

router.get("/blocks", (req, res, next) => {
	var limit = config.site.browseBlocksPageSize;
	var offset = 0;
	var sort = "desc";

	if (req.query.limit) {
		var tmpLimit = parseInt(req.query.limit);
		limit = tmpLimit > 100 ? 100 : tmpLimit;
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	if (req.query.sort) {
		sort = req.query.sort;
	}

	res.locals.limit = limit > 50 ? 20 : limit;
	res.locals.offset = offset;
	res.locals.sort = sort;
	res.locals.paginationBaseUrl = "/blocks";

	coreApi.getBlockchainInfo().then(getblockchaininfo => {
		res.locals.blockCount = getblockchaininfo.blocks;
		res.locals.blockOffset = offset;

		let blockHeights = [];
		if (sort === 'desc') {
			for (let i = (getblockchaininfo.blocks - offset); i > (getblockchaininfo.blocks - offset - limit); i--) {
				if (i >= 0) {
					blockHeights.push(i);
				}
			}
		} else {
			const offsetWithLimit = offset + limit;
			const limitTo = offsetWithLimit > getblockchaininfo.blocks ? getblockchaininfo.blocks + 1 : offsetWithLimit;
			for (let i = offset; i < limitTo; i++) {
				if (i >= 0) {
					blockHeights.push(i);
				}
			}
		}
		coreApi.getBlocksByHeight(blockHeights).then(blocks => {
			res.locals.blocks = blocks;

			res.render("blocks");
		}).catch(err => {
			res.locals.userMessage = "Error: " + err;
	
			res.render("blocks");
	
			next();
		});
	}).catch(err => {
		res.locals.userMessage = "Error: " + err;

		res.render("blocks");

		next();
	});
});

router.get("/search", (req, res) => {
	if (!req.body.query) {
		req.session.userMessage = "Enter a block height, block hash, or transaction id.";
		req.session.userMessageType = "primary";

		res.render("search");
	}
});

router.post("/search", (req, res, next) => {
	if (!req.body.query) {
		req.session.userMessage = "Enter a block height, block hash, or transaction id.";

		return res.redirect("/");
	}

	let query = escape(req.body.query.toLowerCase().trim());
	let rawCaseQuery = escape(req.body.query.trim());

	req.session.query = escape(req.body.query);

	if (query.length === 64) {
		coreApi.getRawTransaction(query).then(tx => {
			if (tx) {
				res.redirect("/tx/" + query);

				return;
			}

			coreApi.getBlockByHash(query).then(blockByHash => {
				if (blockByHash) {
					res.redirect("/block/" + query);

					return;
				}

				coreApi.getAddress(rawCaseQuery).then(validateaddress => {
					if (validateaddress && validateaddress.isvalid) {
						res.redirect("/address/" + rawCaseQuery);
					}
				});

				req.session.userMessage = "No results found for query: " + query;

				res.redirect("/");

			}).catch(err => {
				req.session.userMessage = "No results found for query: " + query;

				res.redirect("/");
			});

		}).catch(err => {
			coreApi.getBlockByHash(query).then(blockByHash => {
				if (blockByHash) {
					res.redirect("/block/" + query);

					return;
				}

				req.session.userMessage = "No results found for query: " + query;

				res.redirect("/");

			}).catch(err => {
				req.session.userMessage = "No results found for query: " + query;

				res.redirect("/");
			});
		});

	} else if (!isNaN(query)) {
		coreApi.getBlockByHeight(parseInt(query)).then(blockByHeight => {
			if (blockByHeight) {
				res.redirect("/block-height/" + query);

				return;
			}

			req.session.userMessage = "No results found for query: " + query;

			res.redirect("/");
		});
	} else {
		coreApi.getAddress(rawCaseQuery).then(validateaddress => {
			if (validateaddress && validateaddress.isvalid) {
				res.redirect("/address/" + rawCaseQuery);

				return;
			}

			req.session.userMessage = "No results found for query: " + rawCaseQuery;

			res.redirect("/");
		});
	}
});

router.get("/block-height/:blockHeight", (req, res) => {
	var blockHeight = parseInt(req.params.blockHeight);

	res.locals.blockHeight = blockHeight;

	res.locals.result = {};

	var limit = config.site.blockTxPageSize;
	var offset = 0;

	if (req.query.limit) {
		var tmpLimit = parseInt(req.query.limit);
		limit = tmpLimit > 100 ? 100 : tmpLimit;
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.paginationBaseUrl = "/block-height/" + blockHeight;

	coreApi.getBlockByHeight(blockHeight).then(result => {
		res.locals.result.getblockbyheight = result;

		coreApi.getBlockByHashWithTransactions(result.hash, limit, offset).then(result => {
			res.locals.result.getblock = result.getblock;
			res.locals.result.transactions = result.transactions;
			res.locals.result.txInputsByTransaction = result.txInputsByTransaction;

			res.render("block");
		});
	});
});

router.get("/block/:blockHash", (req, res, next) => {
	var blockHash = req.params.blockHash;

	res.locals.blockHash = blockHash;

	res.locals.result = {};

	var limit = config.site.blockTxPageSize;
	var offset = 0;

	if (req.query.limit) {
		var tmpLimit = parseInt(req.query.limit);
		limit = tmpLimit > 100 ? 100 : tmpLimit;

		// for demo sites, limit page sizes
		if (config.demoSite && limit > config.site.blockTxPageSize) {
			limit = config.site.blockTxPageSize;

			res.locals.userMessage = "Transaction page size limited to " + config.site.blockTxPageSize + ". If this is your site, you can change or disable this limit in the site config.";
		}
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.paginationBaseUrl = "/block/" + blockHash;
	
	coreApi.getBlockByHashWithTransactions(blockHash, limit, offset).then(result => {
		res.locals.result.getblock = result.getblock;
		res.locals.result.transactions = result.transactions;
		res.locals.result.txInputsByTransaction = result.txInputsByTransaction;

		res.render("block");
	}).catch(err => {
		res.locals.userMessage = "Error getting block data";

		res.render("block");

		next();
	});
});

router.get("/tx/:transactionId", (req, res, next) => {
	var txid = req.params.transactionId;

	var output = -1;
	if (req.query.output) {
		output = parseInt(req.query.output);
	}

	res.locals.txid = txid;
	res.locals.output = output;

	res.locals.result = {};

	coreApi.getRawTransaction(txid).then(rawTxResult => {
		res.locals.result.getrawtransaction = rawTxResult;

		var promises = [];

		promises.push(new Promise((resolve, reject) => {
			coreApi.getTxUtxos(rawTxResult).then(utxos => {
				res.locals.utxos = utxos;
				
				resolve();

			}).catch(err => {
				res.locals.pageErrors.push(utils.logError("3208yhdsghssr", err));

				reject(err);
			});
		}));

		if (rawTxResult.confirmations == null) {
			promises.push(new Promise((resolve, reject) => {
				coreApi.getMempoolTxDetails(txid).then(mempoolDetails => {
					res.locals.mempoolDetails = mempoolDetails;
					
					resolve();

				}).catch(err => {
					res.locals.pageErrors.push(utils.logError("0q83hreuwgd", err));

					reject(err);
				});
			}));
		}

		promises.push(new Promise((resolve, reject) => {
			client.command('getblock', rawTxResult.blockhash, (err3, result3, resHeaders3) => {
				res.locals.result.getblock = result3;

				var txids = [];
				for (var i = 0; i < rawTxResult.vin.length; i++) {
					if (!rawTxResult.vin[i].coinbase) {
						txids.push(rawTxResult.vin[i].txid);
					}
				}

				coreApi.getRawTransactions(txids).then(txInputs => {
					res.locals.result.txInputs = txInputs;

					resolve();
				});
			});
		}));

		Promise.all(promises).then(() => {
			res.render("transaction");
		}).catch(err => {
			res.locals.pageErrors.push(utils.logError("1237y4ewssgt", err));

			res.render("transaction");

			next();
		});
	}).catch(err => {
		res.locals.userMessage = "Failed to load transaction with txid=" + txid + ": " + err;

		res.render("transaction");

		next();
	});
});

router.get("/address/:address", (req, res, next) => {
	var limit = config.site.addressTxPageSize;
	var offset = 0;
	var sort = "desc";

	
	if (req.query.limit) {
		var tmpLimit = parseInt(req.query.limit);
		limit = tmpLimit > 100 ? 100 : tmpLimit;
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	if (req.query.sort) {
		sort = req.query.sort;
	}


	var address = req.params.address;

	res.locals.address = address;
	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.sort = sort;
	res.locals.paginationBaseUrl = `/address/${address}?sort=${sort}`;
	res.locals.transactions = [];
	res.locals.addressApiSupport = addressApi.getCurrentAddressApiFeatureSupport();
	
	res.locals.result = {};

	try {
		res.locals.addressObj = bitcoinjs.address.fromBase58Check(address);

	} catch (err) {
		if (!err.toString().startsWith("Error: Non-base58 character")) {
			res.locals.pageErrors.push(utils.logError("u3gr02gwef", err));
		}

		try {
			res.locals.addressObj = bitcoinjs.address.fromBech32(address);

		} catch (err2) {
			res.locals.pageErrors.push(utils.logError("u02qg02yqge", err));
		}
	}

	if (global.miningPoolsConfigs) {
		for (var i = 0; i < global.miningPoolsConfigs.length; i++) {
			if (global.miningPoolsConfigs[i].payout_addresses[address]) {
				res.locals.payoutAddressForMiner = global.miningPoolsConfigs[i].payout_addresses[address];
			}
		}
	}

	coreApi.getAddress(address).then(validateaddressResult => {
		res.locals.result.validateaddress = validateaddressResult;

		var promises = [];
		if (!res.locals.crawlerBot) {
			var addrScripthash = hexEnc.stringify(sha256(hexEnc.parse(validateaddressResult.scriptPubKey)));
			addrScripthash = addrScripthash.match(/.{2}/g).reverse().join("");

			res.locals.electrumScripthash = addrScripthash;

			promises.push(new Promise((resolve, reject) => {
				addressApi.getAddressDetails(address, validateaddressResult.scriptPubKey, sort, limit, offset).then(addressDetailsResult => {
					var addressDetails = addressDetailsResult.addressDetails;

					if (addressDetailsResult.errors) {
						res.locals.addressDetailsErrors = addressDetailsResult.errors;
					}

					if (addressDetails) {
						res.locals.addressDetails = addressDetails;

						if (addressDetails.balanceSat === 0) {
							// make sure zero balances pass the falsey check in the UI
							addressDetails.balanceSat = "0";
						}

						if (addressDetails.txCount === 0) {
							// make sure txCount=0 pass the falsey check in the UI
							addressDetails.txCount = "0";
						}

						if (addressDetails.txids) {
							var txids = addressDetails.txids;

							// if the active addressApi gives us blockHeightsByTxid, it saves us work, so try to use it
							var blockHeightsByTxid = {};
							if (addressDetails.blockHeightsByTxid) {
								blockHeightsByTxid = addressDetails.blockHeightsByTxid;
							}

							res.locals.txids = txids;
							
							coreApi.getRawTransactionsWithInputs(txids).then(rawTxResult => {
								res.locals.transactions = rawTxResult.transactions;
								res.locals.txInputsByTransaction = rawTxResult.txInputsByTransaction;

								// for coinbase txs, we need the block height in order to calculate subsidy to display
								var coinbaseTxs = [];
								for (var i = 0; i < rawTxResult.transactions.length; i++) {
									var tx = rawTxResult.transactions[i];

									for (var j = 0; j < tx.vin.length; j++) {
										if (tx.vin[j].coinbase) {
											// addressApi sometimes has blockHeightByTxid already available, otherwise we need to query for it
											if (!blockHeightsByTxid[tx.txid]) {
												coinbaseTxs.push(tx);
											}
										}
									}
								}


								var coinbaseTxBlockHashes = [];
								var blockHashesByTxid = {};
								coinbaseTxs.forEach(tx => {
									coinbaseTxBlockHashes.push(tx.blockhash);
									blockHashesByTxid[tx.txid] = tx.blockhash;
								});

								var blockHeightsPromises = [];
								if (coinbaseTxs.length > 0) {
									// we need to query some blockHeights by hash for some coinbase txs
									blockHeightsPromises.push(new Promise((resolve2, reject2) => {
										coreApi.getBlocksByHash(coinbaseTxBlockHashes).then(blocksByHashResult => {
											for (var txid in blockHashesByTxid) {
												if (blockHashesByTxid.hasOwnProperty(txid)) {
													blockHeightsByTxid[txid] = blocksByHashResult[blockHashesByTxid[txid]].height;
												}
											}

											resolve2();

										}).catch(err => {
											res.locals.pageErrors.push(utils.logError("78ewrgwetg3", err));

											reject2(err);
										});
									}));
								}

								Promise.all(blockHeightsPromises).then(() => {
									var addrGainsByTx = {};
									var addrLossesByTx = {};

									res.locals.addrGainsByTx = addrGainsByTx;
									res.locals.addrLossesByTx = addrLossesByTx;

									var handledTxids = [];

									for (var i = 0; i < rawTxResult.transactions.length; i++) {
										var tx = rawTxResult.transactions[i];
										var txInputs = rawTxResult.txInputsByTransaction[tx.txid];
										
										if (handledTxids.includes(tx.txid)) {
											continue;
										}

										handledTxids.push(tx.txid);

										for (var j = 0; j < tx.vout.length; j++) {
											if (tx.vout[j].value > 0 && tx.vout[j].scriptPubKey && tx.vout[j].scriptPubKey.addresses && tx.vout[j].scriptPubKey.addresses.includes(address)) {
												if (addrGainsByTx[tx.txid] == null) {
													addrGainsByTx[tx.txid] = new Decimal(0);
												}

												addrGainsByTx[tx.txid] = addrGainsByTx[tx.txid].plus(new Decimal(tx.vout[j].value));
											}
										}

										for (var j = 0; j < tx.vin.length; j++) {
											var txInput = txInputs[j];
											var vinJ = tx.vin[j];

											if (txInput != null) {
												if (txInput.vout[vinJ.vout] && txInput.vout[vinJ.vout].scriptPubKey && txInput.vout[vinJ.vout].scriptPubKey.addresses && txInput.vout[vinJ.vout].scriptPubKey.addresses.includes(address)) {
													if (addrLossesByTx[tx.txid] == null) {
														addrLossesByTx[tx.txid] = new Decimal(0);
													}

													addrLossesByTx[tx.txid] = addrLossesByTx[tx.txid].plus(new Decimal(txInput.vout[vinJ.vout].value));
												}
											}
										}
									}

									res.locals.blockHeightsByTxid = blockHeightsByTxid;

									resolve();

								}).catch(err => {
									res.locals.pageErrors.push(utils.logError("230wefrhg0egt3", err));

									reject(err);
								});

							}).catch(err => {
								res.locals.pageErrors.push(utils.logError("asdgf07uh23", err));

								reject(err);
							});

						} else {
							// no addressDetails.txids available
							resolve();
						}
					} else {
						// no addressDetails available
						resolve();
					}
				}).catch(err => {
					res.locals.pageErrors.push(utils.logError("23t07ug2wghefud", err));

					res.locals.addressApiError = err;

					reject(err);
				});
			}));

			promises.push(new Promise((resolve, reject) => {
				coreApi.getBlockchainInfo().then(getblockchaininfo => {
					res.locals.getblockchaininfo = getblockchaininfo;

					resolve();

				}).catch(err => {
					res.locals.pageErrors.push(utils.logError("132r80h32rh", err));

					reject(err);
				});
			}));
		}

		promises.push(new Promise((resolve, reject) => {
			qrcode.toDataURL(address, (err, url) => {
				if (err) {
					res.locals.pageErrors.push(utils.logError("93ygfew0ygf2gf2", err));
				}

				res.locals.addressQrCodeUrl = url;

				resolve();
			});
		}));

		Promise.all(promises.map(utils.reflectPromise)).then(() => {
			res.render("address");

		}).catch(err => {
			res.locals.pageErrors.push(utils.logError("32197rgh327g2", err));

			res.render("address");

			next();
		});
		
	}).catch(err => {
		res.locals.pageErrors.push(utils.logError("2108hs0gsdfe", err, {address:address}));

		res.locals.userMessage = "Failed to load address " + address + " (" + err + ")";

		res.render("address");

		next();
	});
});

router.get("/unconfirmed-tx", (req, res, next) => {
	var limit = config.site.browseBlocksPageSize;
	var offset = 0;
	let sort = "desc";

	if (req.query.limit) {
		limit = parseInt(req.query.limit);
		limit = limit > 100 ? 100 : limit;
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	if (req.query.sort) {
		sort = req.query.sort;
	}

	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.sort = sort;
	res.locals.paginationBaseUrl = "/unconfirmed-tx";

	coreApi.getMempoolDetails(offset, limit).then(mempoolDetails => {
		res.locals.mempoolDetails = mempoolDetails;

		res.render("unconfirmed-transactions");
	}).catch(err => {
		res.locals.userMessage = "Error: " + err;

		res.render("unconfirmed-transactions");

		next();
	});
})

router.get("/tx-stats", (req, res) => {
	let dataPoints = 100;

	if (req.query.dataPoints) {
		dataPoints = req.query.dataPoints;
	}

	if (dataPoints > 250) {
		dataPoints = 250;
	}

	let targetBlocksPerDay = 24 * 60 * 60 / global.coinConfig.targetBlockTimeSeconds;

	coreApi.getTxCountStats(dataPoints, 0, "latest").then(result => {
		res.locals.getblockchaininfo = result.getblockchaininfo;
		res.locals.txStats = result.txCountStats;

		coreApi.getTxCountStats(targetBlocksPerDay / 4, -144, "latest").then(result2 => {
			res.locals.txStatsDay = result2.txCountStats;

			coreApi.getTxCountStats(targetBlocksPerDay / 4, -144 * 7, "latest").then(result3 => {
				res.locals.txStatsWeek = result3.txCountStats;

				coreApi.getTxCountStats(targetBlocksPerDay / 4, -144 * 30, "latest").then(result4 => {
					res.locals.txStatsMonth = result4.txCountStats;

					res.render("tx-stats");
				});
			});
		});
	});
});

router.get("/about", (req, res) => {
	res.render("about");
});

router.get("/mining-pools", (req, res) => {
	let miningPools = {
		addresses: [],
		counts: [],
	};
	let uiTheme = req.cookies['user-setting-uiTheme'];
	res.locals.fontColor = '#212529';

	if (uiTheme === 'dark') {
		res.locals.fontColor = '#f8f9fa';
	}

	if (global.miningPools) {
		global.miningPools.forEach(miningPool => {
			let addressName = utils.getNameFromAddress(miningPool.address);
			if (addressName === null) {
				addressName = miningPool.address;
			}
			miningPools.addresses.push(addressName);
			miningPools.counts.push(miningPool.count);
		});
	}
	let colorScale = d3ScaleChromatic.interpolateBlues;
	let colorRangeInfo = {
		colorStart: 0.2,
		colorEnd: 1,
		useEndAsStart: false,
	};
	let colors = helpers.generateColors(miningPools.addresses.length, colorScale, colorRangeInfo);
	
	miningPools.addresses = JSON.stringify(miningPools.addresses);
	res.locals.miningPools = miningPools;
	res.locals.colors = JSON.stringify(colors);

	res.render("mining-pools");
});

router.get("/stats", (req, res) => {
	res.locals.appStartTime = global.appStartTime;
	res.locals.memstats = v8.getHeapStatistics();
	res.locals.rpcStats = global.rpcStats;
	res.locals.cacheStats = global.cacheStats;
	res.locals.errorStats = global.errorStats;

	res.locals.appConfig = {
		privacyMode: config.privacyMode,
		rpcConcurrency: config.rpcConcurrency,
		addressApi: config.addressApi,
		ipStackComApiAccessKey: !!config.credentials.ipStackComApiAccessKey,
		redisCache: !!config.redisUrl,
		noInmemoryRpcCache: config.noInmemoryRpcCache
	};

	res.render("stats");
});

module.exports = router;
