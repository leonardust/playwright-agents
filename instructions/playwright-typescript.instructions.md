---
description: 'Playwright test generation instructions with best practices and patterns.'
applyTo: '**'
title: Playwright TypeScript Test Generation Instructions
name: playwright-typescript-instructions
---

## Test Writing Guidelines

### Code Quality Standards

- **Locators**: Prioritize user-facing, role-based locators (`getByRole`, `getByLabel`, `getByText`, etc.) for resilience and accessibility.
- **Test Steps**: Use `test.step()` to group interactions and improve test readability and reporting.
- **Assertions**: Use auto-retrying web-first assertions. These assertions start with the `await` keyword (e.g., `await expect(locator).toHaveText()`). Avoid `expect(locator).toBeVisible()` unless specifically testing for visibility changes.
- **Timeouts**: Rely on Playwright's built-in auto-waiting mechanisms. Avoid hard-coded waits or increased default timeouts.
- **Clarity**: Use descriptive test and step titles that clearly state the intent. Add comments only to explain complex logic or non-obvious interactions.
- **Error Handling**: Use `try-catch` blocks only when necessary. Playwright's built-in error handling is usually sufficient.

### Test Structure (BDD-centric)

Unlike plain Playwright tests, you generally _do not_ hand‑write `test.describe`
blocks or individual spec files. Instead:

1. Define high‑level behavior in Gherkin feature files under `features/`.
2. Implement step logic in `steps/` using `createBdd()`;
3. Run `npx bddgen` to generate underlying Playwright tests, which include the
   usual imports (`test`, `expect`) and fixtures but are treated as derived
   artifacts.
4. Execute scenarios via `npx playwright test` (tags/grep still apply).

Use feature and scenario titles to control generated test names, and place
shared setup into fixtures or `Background` steps rather than manual hooks.

### Playwright BDD / Gherkin Support

This project uses [playwright-bdd](https://vitalets.github.io/playwright-bdd/#/) to write tests in Gherkin syntax. Follow these conventions:

- **Feature files** live under the `features/` directory and have a `.feature` extension.
  - Write standard Gherkin keywords: `Feature`, `Scenario`, `Given`, `When`, `Then`, `And`, `But`.
  - Use tags (`@smoke`, `@critical`, etc.) to filter scenarios when running tests.
- **Step definitions** are TypeScript modules placed in the `steps/` directory (or another configured path).
  - Import `createBdd` from `'playwright-bdd'` and destructure `Given`, `When`, `Then`, etc.
  - Steps receive the Playwright fixtures (`page`, `browser` etc.) via an argument object.
  - Use helper classes or the Page Object Model inside steps for clarity and reuse.
- **Configuration**: `playwright.config.ts` is set up to match feature files and load step definitions automatically. Example snippet:

  ```ts
  import { defineConfig } from '@playwright/test';
  import { playwrightBdd } from 'playwright-bdd/plugin';

  export default defineConfig({
    testMatch: 'features/**/*.feature',
    plugins: [playwrightBdd({ steps: 'steps/**/*.ts' })],
  });
  ```

- **Running scenarios**: Use the standard Playwright CLI (`npx playwright test`). Tags can be passed with `-g` or `--grep` when supported by the plugin.

> ✨ **Tip:** Feature files should read like documentation. Keep them concise and avoid implementation details; delegate the work to step definition functions.

The existing project already includes an example under `features/shopping.feature` and its corresponding step file `steps/shopping.steps.ts`.

### File Organization (BDD)

- **Features**: Keep Gherkin scenarios in `features/*.feature`.
- **Steps**: Place corresponding TypeScript step definitions under `steps/`.
- Generated test artifacts live in `tests/` or `.bddgen/` depending on
  configuration; treat them as derived files and avoid editing them by hand.
- **Scope**: One feature file per business capability; scenarios should be
  independent and atomic.

### Assertion Best Practices

- **UI Structure**: Use `toMatchAriaSnapshot` to verify the accessibility tree structure of a component. This provides a comprehensive and accessible snapshot.
- **Element Counts**: Use `toHaveCount` to assert the number of elements found by a locator.
- **Text Content**: Use `toHaveText` for exact text matches and `toContainText` for partial matches.
- **Navigation**: Use `toHaveURL` to verify the page URL after an action.

## Example BDD Workflow

Feature (`features/shopping.feature`):

```gherkin
Feature: Shopping Cart
  As a user
  I want to add products to my cart
  So that I can purchase them later

  @smoke @critical
  Scenario: Add product to cart
    Given I am logged in as "standard_user"
    When I click on "Add to cart" button for the first product
    Then I should see the cart counter increase
    And the product should appear in the cart
```

Step definitions (`steps/shopping.steps.ts`):

```ts
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

Given('I am logged in as {string}', async ({ page }, username: string) => {
  // implementation ...
});
```

Run the generator to create the underlying Playwright tests, and then
execute via `npx playwright test`.

## 🎭 Testing Patterns & Best Practices

Understanding and applying proven testing patterns helps create maintainable, readable, and reliable test automation.

Incorporate these industry-standard patterns:

### 🏗️ Arrange-Act-Assert (AAA) Pattern

The fundamental pattern for structuring logic inside a scenario or step
definition:

- **Arrange**: Set up test data, configure initial state, and prepare test
  environment
- **Act**: Execute the action or behavior being tested
- **Assert**: Verify the expected outcome and validate results

Usage may appear inside a generated test or directly within a step definition:

```typescript
// inside a step definition
When('I search for {string}', async ({ page }, term) => {
  // Arrange
  const searchInput = page.getByRole('textbox', { name: 'Search' });
  const searchButton = page.getByRole('button', { name: 'Search' });

  // Act
  await searchInput.fill(term);
  await searchButton.click();

  // Assert
  await expect(page.getByText('Search Results')).toBeVisible();
  await expect(page.getByRole('list')).toContainText(term);
});
```

_Use Page Object Model (POM) to encapsulate page interactions and reduce duplication._

### 🎯 Page Object Model (POM)

Encapsulate page interactions and locators in reusable classes.
Aggregate related actions and assertions to improve test readability and maintainability.
Try not to create methods for single actions.

```typescript
import { Locator, Page } from '@playwright/test';

class SearchPage {
  searchInput: Locator;
  searchButton: Locator;

  constructor(private page: Page) {
    this.searchInput = page.getByRole('textbox', { name: 'Search' });
    this.searchButton = page.getByRole('button', { name: 'Search' });
  }

  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }
}
```

### 🧩 BDD Best Practices

These guidelines apply when working with `playwright-bdd` feature files and steps:

- **Readable features**: Write scenarios in plain language from a business perspective. Avoid implementation details like selectors. Keep each scenario focused on a single outcome.
- **Atomic steps**: One step = one action or assertion. This makes them reusable and easier to maintain.
- **Reuse over rewrite**: Search the repository before adding a new step. Export commonly used functions if you need to share logic or expose them for AI to generate new steps.
- **Use tags strategically**: Tag `@smoke`, `@critical`, or custom tags to control execution, filtering, and parallelization. Tags can also influence `bddgen` behaviour (e.g. `@wip`).
- **Data tables for variations**: For scenarios that only differ by inputs/outputs, use Gherkin data tables instead of multiple scenarios.
- **Keep feature files synchronized**: Run `npx bddgen` after editing `.feature` files so generated tests stay up to date. Treat generated `.ts` files as derived artifacts.
- **Stable selectors in steps**: Implement locators in step definitions or page objects, not in feature text. This isolates changes when the UI evolves.
- **Scoped step definitions**: Take advantage of scoped definitions to avoid collisions when features use similar language but different contexts.
- **Leverage IDE snippets**: The project may have code snippets for step templates – use them to avoid typo bugs.
- **Debugging**: When a generated test fails, open the corresponding feature to understand the business intent before fixing the code; update steps if necessary.

Example of a reusable step with data table and `test.step()` inside:

```typescript
When('I add products to cart', async ({ page }, table) => {
  await test.step('iterate items', async () => {
    for (const { name, qty } of table.hashes()) {
      await page.getByText(name).locator('..').getByRole('button', { name: 'Add to cart' }).click();
    }
  });
});
```

> 💡 Remember: feature files act as living documentation. Keep them clean so non‑technical stakeholders can read them.

### DTO (Data Transfer Object) Pattern

Use DTOs to encapsulate data structures for test inputs and outputs. This helps maintain a clear contract for test data and reduces duplication.

```typescript
interface UserModel {
  name: string;
  email: string;
  role: string;
}

class RegistrationPage {
  async createUser(user: UserModel): Promise<void> {
    // Logic to create user
  }
}
```

### 🧱 Builder Pattern for Test Data

Create flexible test data with the builder pattern. Use this pattern with DTOs to construct complex objects step-by-step, allowing for easy customization and readability.

```typescript
class UserBuilder {
  private user: UserModel = { name: '', email: '', role: 'user' };

  withName(name: string): UserBuilder {
    this.user.name = name;
    return this;
  }
  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }
  withRole(role: string): UserBuilder {
    this.user.role = role;
    return this;
  }

  build(): UserModel {
    return { ...this.user };
  }
}

// Usage
const testUser = new UserBuilder()
  .withName('John Doe')
  .withEmail('john@example.com')
  .withRole('admin')
  .build();
```

### 🧱 Factory Pattern for Test Data

Create reusable test data factories to generate consistent test data:

```typescript
class UserFactory {
  static createUser(overrides?: Partial<UserModel> = {}) {
    const randomId = Date.now();

    const user: UserModel = {
      name: `Default User ${randomId}`,
      email: `default-${randomId}@example.com`,
      role: `user`,
    };

    return { ...user, ...overrides };
  }
}

// Usage
const testUser = UserFactory.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
});
```

### 🏃‍♂️ Test Steps Pattern

Use `test.step()` for better reporting and debugging:

```typescript
test('Complete user registration flow', async ({ page }) => {
  await test.step('Navigate to registration page', async () => {
    await page.goto('/register');
  });

  await test.step('Fill registration form', async () => {
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
  });

  await test.step('Submit and verify success', async () => {
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Registration successful')).toBeVisible();
  });
});
```

_Use Page Object Model (POM) to encapsulate page interactions and reduce duplication._

### 🎪 Fixture Pattern for Setup/Teardown

Use Playwright fixtures for consistent test setup:

```typescript
import { test as base } from '@playwright/test';

export const test = base.extend<{ loggedInUser: Page }>({
  loggedInUser: async ({ page }, use) => {
    // Setup: Login user
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();

    await use(page);

    // Teardown: Logout (if needed)
    await page.getByRole('button', { name: 'Logout' }).click();
  },
});
```

### 🎪 Fixture Pattern for Page Object initialization

Use fixtures to initialize page objects for tests:

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RegistrationPage } from '../pages/registration.page';

export const test = base.extend<{
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
});
```

Usage in tests:

```typescript
test('User can register', async ({ registrationPage }) => {
  await registrationPage.registerUser({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  });

  // Verify registration success
  await expect(registrationPage.successMessage).toBeVisible();
});
```

## Test Execution Strategy (BDD)

1. **Generate**: Run `npx bddgen` whenever feature files or step definitions
   change. Generated files can be inspected but not edited directly.
2. **Execute**: Use `npx playwright test` (optionally with `-g`/`--grep` to
   filter tags).
3. **Debug Failures**: Trace failing tests back to the feature scenario or
   step definition, update accordingly, then rerun the generator.
4. **Iterate**: Improve feature wording, add tags, or share new steps as
   needed.
5. **Report**: Include feature names in reports; the HTML reporter shows steps
   for easy collaboration with non‑technical stakeholders.

## Quality Checklist

Before finalizing features and steps, ensure:

- [ ] Feature scenarios are concise, business‑focused, and tagged appropriately
- [ ] Steps are reusable and atomic; avoid duplicating logic across definitions
- [ ] Locators used inside steps are accessible and specific; avoid strict mode
      violations
- [ ] Assertions reflect user expectations and use auto‑retrying web‑first
      patterns
- [ ] Names across features and steps are consistent and descriptive
- [ ] Code is properly formatted and commented where non‑obvious logic
      appears
- [ ] No hard‑coded waits or timeouts are used in step definitions
- [ ] Patterns like AAA, POM, and Builder are applied inside steps or helpers

```

```
