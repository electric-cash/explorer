import { test } from '@playwright/test';
import app, { pageObjects } from './helpers/pageObjects';

let po: pageObjects;

test.describe('Search bar tests', () => {
  test.beforeEach(async ({ page }) => {
    po = app(page);
    await page.goto('/');
  });

  test('Should search latest block in the search bar', async () => {
    await po.search.searchLatestBlock();
  });

  test('Should search transactions in the search bar', async () => {
    await po.search.searchByTx();
  });

  test('Should search address in the search bar', async () => {
    await po.search.searchByAddress();
  });

  test('Should search hash in the search bar', async () => {
    await po.search.searchByHash();
  });
});
