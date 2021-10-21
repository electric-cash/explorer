import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class Search {
  private searchBar = this.page.locator("input[name='query']");
  private searchButton = this.page.locator('.search-icon');
  private latestBlock = this.page.innerText('tr:nth-of-type(1) > td:nth-of-type(1) > a');
  private latestBlockButton = this.page.locator('tr:nth-of-type(1) > td:nth-of-type(1) > a');
  private richestWallets = this.page.locator('a:nth-of-type(8) > span');
  private tools = this.page.locator('a[role="button"]:has-text("TOOLS")');

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
    const txID = this.page.textContent('.card-header > .blue-link');
    await this.searchBar.fill(await txID);
    await this.searchButton.click();
    await expect(this.page.url()).toContain('/tx/');
  }

  async searchByAddress() {
    await this.tools.click();
    await this.richestWallets.click();
    const address = this.page.textContent('tr:nth-of-type(9) > td:nth-of-type(1) > a');
    await this.searchBar.fill(await address);
    await this.searchButton.click();
    await expect(this.page.url()).toContain('/address/');
  }

  async searchByHash() {
    await this.latestBlockButton.click();
    const hash = this.page.textContent('h1 > span:nth-of-type(2)');
    await this.searchBar.fill(await hash);
    await this.searchButton.click();
    await expect(this.page.url()).toContain('/block/');
  }
}
