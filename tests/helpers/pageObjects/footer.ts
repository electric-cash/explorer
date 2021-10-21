import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class Footer {
  private source = this.page.locator('.footer.page-footer > .container a');

  constructor(private page: Page) {}

  async sourceUrl() {
    await this.source.isVisible();
    await this.source.click();
    await expect(this.page.url()).toMatch('https://github.com/electric-cash/explorer');
  }
}
