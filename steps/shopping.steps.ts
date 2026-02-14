import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { AIHelper } from '../utils/ai-helper';

const { Given, When, Then } = createBdd();

let aiHelper: AIHelper;

Given('I am logged in as {string}', async ({ page }, username: string) => {
  aiHelper = new AIHelper(page);
  await page.goto('https://www.saucedemo.com/');

  const password = process.env.TEST_PASSWORD || 'secret_sauce';

  // Login z użyciem AI
  await aiHelper.fill('username field', username);
  await aiHelper.fill('password field', password);
  await aiHelper.click('login button');

  await page.waitForLoadState('networkidle');
  aiHelper.logPrompt(`Logged in as ${username} and navigated to products page`);
});

When('I click on "Add to cart" button for the first product', async () => {
  await aiHelper.click('first add to cart button');
  aiHelper.logPrompt('Clicked add to cart for first product');
});

Then('I should see the cart counter increase', async ({ page }) => {
  const cartBadge = page.locator('.shopping_cart_badge');
  await expect(cartBadge).toBeVisible({ timeout: 10000 });

  const count = await cartBadge.textContent();
  aiHelper.logPrompt(`Cart counter shows: ${count}`);

  expect(parseInt(count || '0')).toBeGreaterThan(0);
});

Then('the product should appear in the cart', async ({ page }) => {
  await aiHelper.click('shopping cart icon');

  await page.waitForLoadState('networkidle');

  const cartItems = page.locator('.cart_item');
  await expect(cartItems).toHaveCount(1, { timeout: 10000 });

  aiHelper.logPrompt('Verified product appears in cart');
});
