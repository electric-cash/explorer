import { test } from '@playwright/test';
import app, { pageObjects } from './helpers/pageObjects';

let po: pageObjects;

test.describe('Units change check', () => {
  test.beforeEach(async ({ page }) => {
    po = app(page);
    await po.navigation.openApp();
  });

  test('Should change units to mELCASH', async () => {
    await po.units.melcashCheck();
  });

  test('Should change units to bits', async () => {
    await po.units.bitsCheck();
  });

  test('Should change units to sat', async () => {
    await po.units.satCheck();
  });

  test('Should change units to ELCASH', async () => {
    await po.units.elcashCheck();
  });
});
