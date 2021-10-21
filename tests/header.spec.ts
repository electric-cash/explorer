import { test } from '@playwright/test';
import app, { pageObjects } from './helpers/pageObjects';

let po: pageObjects;

test.describe('Header tests', () => {
  test.beforeEach(async ({ page }) => {
    po = app(page);
    await page.goto('/');
  });

  test('should open bitcoinvault global after clicking a logo', async () => {
    await po.header.explorerLogoRedirect();
  });

  test('Should assert node status url & visibility', async () => {
    await po.header.nodeStatusUrl();
  });

  test('Should assert peers url & visibility', async () => {
    await po.header.peersUrl();
  });

  test('Should assert Browse Blocks url & visibility', async () => {
    await po.header.browseBlocksUrl();
  });

  test('Should assert Transaction Stats url & visibility', async () => {
    await po.header.transactionStatsUrl();
  });

  test('Should assert Mempool Summary url & visibility', async () => {
    await po.header.mempoolSummaryUrl();
  });

  test('Should assert Unconfirmed Transactions url & visibility', async () => {
    await po.header.unconfirmedTransactionsUrl();
  });

  test('Should assert Richest Wallets url & visibility', async () => {
    await po.header.richestWalletsUrl();
  });

  test('Should assert Coin distribution url & visibility', async () => {
    await po.header.coinDistributionUrl();
  });
});
