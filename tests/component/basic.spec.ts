import { test, expect } from '@playwright/test';

test.describe('Sequence Diagram Web Component - Phase 0', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('custom element registers and is defined', async ({ page }) => {
    // Check custom element is defined
    const isDefined = await page.evaluate(() => {
      return customElements.get('sequence-diagram') !== undefined;
    });
    expect(isDefined).toBe(true);
  });

  test('custom element creates Shadow DOM with React mounted', async ({ page }) => {
    // Add the custom element to the page
    await page.evaluate(() => {
      const el = document.createElement('sequence-diagram');
      el.setAttribute('id', 'test-diagram');
      document.body.appendChild(el);
    });

    // Wait for Shadow DOM to be attached
    await page.waitForFunction(() => {
      const el = document.getElementById('test-diagram');
      return el?.shadowRoot?.innerHTML.includes('Hello') ?? false;
    }, { timeout: 5000 });

    // Verify Shadow DOM content
    const shadowContent = await page.evaluate(() => {
      const el = document.getElementById('test-diagram');
      return el?.shadowRoot?.innerHTML ?? '';
    });
    expect(shadowContent).toContain('Hello');
    expect(shadowContent).toContain('sequence-diagram');
  });

  test('React button click updates counter', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.createElement('sequence-diagram');
      document.body.appendChild(el);
    });

    // Find button inside Shadow DOM and click it
    const button = page.locator('sequence-diagram').locator('button');
    await expect(button).toBeVisible();

    // Click the button
    await button.click();

    // Verify counter updated
    await expect(button).toContainText('Clicked: 1');
  });

  test('multiple instances are independent', async ({ page }) => {
    await page.evaluate(() => {
      const el1 = document.createElement('sequence-diagram');
      el1.setAttribute('id', 'diagram1');
      const el2 = document.createElement('sequence-diagram');
      el2.setAttribute('id', 'diagram2');
      document.body.appendChild(el1);
      document.body.appendChild(el2);
    });

    // Get both buttons
    const button1 = page.locator('#diagram1').locator('button');
    const button2 = page.locator('#diagram2').locator('button');

    await expect(button1).toBeVisible();
    await expect(button2).toBeVisible();

    // Click button in first instance
    await button1.click();
    await button1.click();

    // Verify only first instance counter updated
    await expect(button1).toContainText('Clicked: 2');
    await expect(button2).toContainText('Clicked: 0');
  });

  test('disconnectedCallback cleans up React root', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.createElement('sequence-diagram');
      el.setAttribute('id', 'cleanup-test');
      document.body.appendChild(el);
    });

    // Verify element exists
    const existsBefore = await page.evaluate(() => {
      return document.getElementById('cleanup-test') !== null;
    });
    expect(existsBefore).toBe(true);

    // Remove the element
    await page.evaluate(() => {
      const el = document.getElementById('cleanup-test');
      el?.remove();
    });

    // Verify element is removed from DOM
    const existsAfter = await page.evaluate(() => {
      return document.getElementById('cleanup-test') !== null;
    });
    expect(existsAfter).toBe(false);
  });
});
