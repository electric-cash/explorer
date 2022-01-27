import { test } from '@playwright/test';
import app, { pageObjects } from './helpers/pageObjects';

let po: pageObjects;

test.describe('Footer tests', () => {
  test.beforeEach(async ({ page }) => {
    po = app(page);
    await page.goto('/');
  });

  test('Should assert visibility and url of Source', async () => {
    await po.footer.sourceUrl();
  });
});
