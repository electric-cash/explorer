import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class Search {
  private searchBar = this.page.locator('[data-test-id="searchBar"]');
  private searchButton = this.page.locator('[data-test-id="searchButton"]');
  private latestBlock = this.page.innerText('[data-test-id="block0"]');
  private latestBlockButton = this.page.locator('[data-test-id="block0"]');
  private richestWallets = this.page.locator('[data-test-id="Richest Wallets"]');
  private tools = this.page.locator('[data-test-id="tools"]');
  private blockHash = this.page.innerText('[data-test-id="blockHash0"]');
  private tx = this.page.innerText('[data-test-id="tx0"]');
  private txAddress = this.page.innerText('[data-test-id="txAddress"]');

  constructor(private page: Page) {}

  async searchLatestBlock() {
    await this.searchBar.isVisible();
    await this.searchBar.fill((await this.latestBlock).replace(',', ''));
    await this.searchButton.isVisible();
    await this.searchButton.click();
    await expect(this.page.url()).toContain('/block-height/');
  }

  async searchByTx() {
    await this.latestBlockButton.click();
    await this.searchBar.fill(await this.tx);
    await this.searchButton.click();
    await expect(this.page.url()).toContain('/tx/');
  }

  async searchByAddress() {
    await this.tools.click();
    await this.richestWallets.click();
    await this.searchBar.fill(await this.txAddress);
    await this.searchButton.click();
    await expect(this.page.url()).toContain('/address/');
  }

  async searchByHash() {
    await this.latestBlockButton.click();
    await this.searchBar.fill(await this.blockHash);
    await this.searchButton.click();
    await expect(this.page.url()).toContain('/block/');
  }
}
