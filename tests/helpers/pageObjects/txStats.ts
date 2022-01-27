import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class TransactionsStats {
  private tools = this.page.locator('[data-test-id="tools"]');
  private txStats = this.page.locator('[data-test-id="Transaction Stats"]');
  private txStatsDaily = this.page.locator('canvas#graphDay');
  private txStatsWeekly = this.page.locator('canvas#graphWeek');
  private txStatsMonthly = this.page.locator('canvas#graphMonth');
  private txStatsAllTime = this.page.locator('canvas#graphAlltime');
  private txRateDaily = this.page.locator('canvas#graphRateDay');
  private txRateWeekly = this.page.locator('canvas#graphRateWeek');
  private txRateMonthly = this.page.locator('canvas#graphRateMonth');
  private txRateAllTime = this.page.locator('canvas#graphRateAlltime');

  constructor(private page: Page) {}

  async txStatsVisibility() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.txStats.isVisible();
    await this.txStats.click();
    await expect(this.txStatsDaily).toBeVisible();
    await expect(this.txStatsWeekly).toBeVisible();
    await expect(this.txStatsMonthly).toBeVisible();
    await expect(this.txStatsAllTime).toBeVisible();
  }

  async txRateVisibility() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.txStats.isVisible();
    await this.txStats.click();
    await expect(this.txRateDaily).toBeVisible();
    await expect(this.txRateWeekly).toBeVisible();
    await expect(this.txRateMonthly).toBeVisible();
    await expect(this.txRateAllTime).toBeVisible();
  }
}
