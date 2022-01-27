import { test } from '@playwright/test';
import app, { pageObjects } from './helpers/pageObjects';

let po: pageObjects;

test.describe('TX stats', () => {
  test.beforeEach(async ({ page }) => {
    po = app(page);
    await page.goto('/');
  });

  test('Should assert visibility of tx stats', async () => {
    await po.transactionsStats.txStatsVisibility();
  });

  test('Should assert visibility of tx rate', async () => {
    await po.transactionsStats.txRateVisibility();
  });
});
