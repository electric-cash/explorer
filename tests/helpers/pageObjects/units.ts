import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class Units {
  private dropdown = this.page.locator('a#navbarDropdown > .settings-icon');
  private melcash = this.page.locator('[aria-labelledby] .dropdown-item:nth-child(3) span');
  private bits = this.page.locator('[aria-labelledby] .dropdown-item:nth-child(4) span');
  private sat = this.page.locator('[aria-labelledby] .dropdown-item:nth-child(5) span');
  private elcash = this.page.locator('[aria-labelledby] .dropdown-item:nth-child(2) span');
  private latestBlock = this.page.locator('tr:nth-of-type(1) > td:nth-of-type(1) > a');

  constructor(private page: Page) {}

  async melcashCheck() {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    await this.melcash.isVisible();
    await this.melcash.click();
    await this.latestBlock.click();
    const content = await this.page.textContent(
      '.card-body.px-2.px-lg-3 > div > div:nth-of-type(2) > div:nth-of-type(1) small',
    );
    expect(content).toContain('mELCASH');
  }

  async bitsCheck() {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    await this.bits.isVisible();
    await this.bits.click();
    await this.latestBlock.click();
    const content = await this.page.textContent(
      '.card-body.px-2.px-lg-3 > div > div:nth-of-type(2) > div:nth-of-type(1) small',
    );
    expect(content).toContain('bits');
  }

  async satCheck() {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    await this.sat.isVisible();
    await this.sat.click();
    await this.latestBlock.click();
    const content = await this.page.textContent(
      '.card-body.px-2.px-lg-3 > div > div:nth-of-type(2) > div:nth-of-type(1) small',
    );
    expect(content).toContain('sat');
  }

  async elcashCheck() {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    await this.elcash.isVisible();
    await this.elcash.click();
    await this.latestBlock.click();
    const content = await this.page.textContent(
      '.card-body.px-2.px-lg-3 > div > div:nth-of-type(2) > div:nth-of-type(1) small',
    );
    expect(content).toContain('ELCASH');
  }
}
