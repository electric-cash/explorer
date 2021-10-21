import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class Units {
  private dropdown = this.page.locator('[data-test-id="unitsDropdown"]');
  private melcash = this.page.locator('[data-test-id="mELCASH"]');
  private bits = this.page.locator('[data-test-id="bits"]');
  private sat = this.page.locator('[data-test-id="sat"]');
  private elcash = this.page.locator('[data-test-id="ELCASH"]');
  private latestBlock = this.page.locator('[data-test-id="block0"]');
  private displayedUnit = this.page.innerText('displayedUnit')

  constructor(private page: Page) {}

  async melcashCheck() {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    await this.melcash.isVisible();
    await this.melcash.click();
    await this.latestBlock.click();
    const content = await this.page.textContent(await this.displayedUnit);
    expect(content).toContain('mELCASH');
  }

  async bitsCheck() {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    await this.bits.isVisible();
    await this.bits.click();
    await this.latestBlock.click();
    const content = await this.page.textContent(await this.displayedUnit);
    expect(content).toContain('bits');
  }

  async satCheck() {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    await this.sat.isVisible();
    await this.sat.click();
    await this.latestBlock.click();
    const content = await this.page.textContent(await this.displayedUnit);
    expect(content).toContain('sat');
  }

  async elcashCheck() {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    await this.elcash.isVisible();
    await this.elcash.click();
    await this.latestBlock.click();
    const content = await this.page.textContent(await this.displayedUnit);
    expect(content).toContain('ELCASH');
  }
}
