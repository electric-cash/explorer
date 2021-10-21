import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class Header {
  private logo = this.page.locator('[data-test-id="logo"]');
  private tools = this.page.locator('[data-test-id="tools"]');
  private nodeStatus = this.page.locator('[data-test-id="Node Status"]');
  private peers = this.page.locator('[data-test-id="Peers"]');
  private browseBlocks = this.page.locator('[data-test-id="Browse Blocks"]');
  private transactionStats = this.page.locator('[data-test-id="Transaction Stats"]');
  private mempoolSummary = this.page.locator('[data-test-id="Mempool Summary"]');
  private unconfirmedTransactions = this.page.locator('[data-test-id="Unconfirmed Transactions"]');
  private richestWallets = this.page.locator('[data-test-id="Richest Wallets"]');
  private coinDistribution = this.page.locator('[data-test-id="Coin Distribution"]');

  constructor(private page: Page) {}

  async explorerLogoRedirect() {
    await this.logo.isVisible();
    await this.logo.click();
    await expect(this.page.url()).toMatch('/');
  }

  async nodeStatusUrl() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.nodeStatus.isVisible();
    await this.nodeStatus.click();
    await expect(this.page.url()).toContain('/node-status');
  }

  async peersUrl() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.peers.isVisible();
    await this.peers.click();
    await expect(this.page.url()).toContain('/peers');
  }

  async browseBlocksUrl() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.browseBlocks.isVisible();
    await this.browseBlocks.click();
    await expect(this.page.url()).toContain('/blocks');
  }

  async transactionStatsUrl() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.transactionStats.isVisible();
    await this.transactionStats.click();
    await expect(this.page.url()).toContain('/tx-stats');
  }

  async mempoolSummaryUrl() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.mempoolSummary.isVisible;
    await this.mempoolSummary.click();
    await expect(this.page.url()).toContain('/mempool-summary');
  }

  async unconfirmedTransactionsUrl() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.unconfirmedTransactions.isVisible;
    await this.unconfirmedTransactions.click();
    await expect(this.page.url()).toContain('/unconfirmed-tx');
  }

  async richestWalletsUrl() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.richestWallets.isVisible;
    await this.richestWallets.click();
    await expect(this.page.url()).toContain('/richest-wallets');
  }

  async coinDistributionUrl() {
    await this.tools.isVisible();
    await this.tools.click();
    await this.coinDistribution.isVisible;
    await this.coinDistribution.click();
    await expect(this.page.url()).toContain('/coin-distribution');
  }
}
