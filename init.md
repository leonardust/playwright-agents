# Projekt automatyzacji testów z Playwright, playwright-bdd oraz @playwright/ai-assistant

Stwórz projekt automatyzacji testów oparty na Playwright, playwright-bdd oraz @playwright/ai-assistant, zoptymalizowany pod lokalne uruchamianie z Ollama.

---

## 📋 Spis treści

### [🚀 WERYFIKACJA I URUCHOMIENIE ISTNIEJĄCEGO PROJEKTU](#-weryfikacja-i-uruchomienie-istniejącego-projektu-1)

- [KROK A: Weryfikacja Projektu](#krok-a-weryfikacja-projektu)
- [KROK B: Konfiguracja Ollama](#krok-b-konfiguracja-ollama)
- [KROK C: Uruchomienie Testów](#krok-c-uruchomienie-testów)
- [KROK D: Monitorowanie i Debug](#krok-d-monitorowanie-i-debug)
- [KROK E: Czyszczenie](#krok-e-czyszczenie)

### [📝 TWORZENIE NOWEGO PROJEKTU OD ZERA](#-tworzenie-nowego-projektu-od-zera-1)

- [KROK 1: Inicjalizacja projektu](#krok-1-inicjalizacja-projektu)
- [KROK 2: Diagnostyka i Optymalizacja Ollama](#krok-2-diagnostyka-i-optymalizacja-ollama)
- [KROK 3: Struktura Katalogów](#krok-3-struktura-katalogów)
- [KROK 4: Konfiguracja TypeScript](#krok-4-konfiguracja-typescript)
- [KROK 5: Konfiguracja Prettier](#krok-5-konfiguracja-prettier)
- [KROK 6: Konfiguracja ESLint](#krok-6-konfiguracja-eslint)
- [KROK 7: Konfiguracja Playwright](#krok-7-konfiguracja-playwright)
- [KROK 8: Plik środowiskowy .env](#krok-8-plik-środowiskowy-env)
- [KROK 9: Konfiguracja VSCode](#krok-9-konfiguracja-vscode)
- [KROK 10: AI Helper](#krok-10-ai-helper---mechanizm-logowania-i-obsługi-błędów)
- [KROK 11: Przykładowy test BDD](#krok-11-przykładowy-test-bdd)
- [KROK 12: Aktualizuj package.json](#krok-12-aktualizuj-packagejson)
- [KROK 13: Konfiguracja Git Hooks (Husky)](#krok-13-konfiguracja-git-hooks-husky)
- [KROK 14: Konfiguracja GitHub Actions](#krok-14-konfiguracja-github-actions-opcjonalne)
- [KROK 15: Finalizacja](#krok-15-finalizacja)

---

## 🚀 WERYFIKACJA I URUCHOMIENIE ISTNIEJĄCEGO PROJEKTU

Jeśli projekt już istnieje, użyj poniższych kroków do weryfikacji i uruchomienia.

## KROK A: Weryfikacja Projektu

### 1. Sprawdź strukturę projektu

```bash
# Upewnij się, że wszystkie katalogi istnieją
ls -la features/ steps/ utils/ scripts/ .vscode/
```

**Wymagane komponenty:**

- `features/` - pliki .feature z testami BDD
- `steps/` - implementacja kroków testowych
- `utils/` - narzędzia pomocnicze (AIHelper)
- `scripts/` - skrypty diagnostyczne
- `.vscode/` - konfiguracja IDE

### 2. Weryfikuj konfigurację

```bash
# Sprawdź czy pliki konfiguracyjne są obecne
cat package.json | grep -E "playwright|bdd|typescript"
cat tsconfig.json | grep -E "module|target"
cat playwright.config.ts
cat .env
```

**Wymagane pliki konfiguracyjne:**

- ✅ `package.json` - z zależnościami: playwright, playwright-bdd, openai, dotenv
- ✅ `tsconfig.json` - module: ESNext, target: ES2022, moduleResolution: bundler
- ✅ `playwright.config.ts` - timeout: 90s, playwright-bdd integration
- ✅ `eslint.config.ts` - nowoczesna konfiguracja ESLint
- ✅ `.prettierrc` - zasady formatowania
- ✅ `.env` - konfiguracja Ollama

### 3. Sprawdź zależności

```bash
# Zainstaluj/zaktualizuj zależności
npm install

# Weryfikuj instalację
npx playwright --version
npx bddgen --version
```

### 4. Uruchom diagnostykę Ollama

```bash
npm run diagnose
```

**Ten skrypt sprawdzi:**

- Czy Ollama jest uruchomiona
- Dostępne modele AI
- Zasoby systemowe (RAM/CPU)
- Zasugeruje odpowiedni model

### 5. Sprawdź Git Hooks (Husky)

```bash
# Sprawdź czy hooki są zainstalowane
ls -la .husky/

# Wymagane hooki:
# - pre-commit (lint-staged)
# - commit-msg (conventional commits)
```

**Git hooks zapewniają:**

- ✅ Automatyczne formatowanie kodu przed commitem
- ✅ Weryfikację ESLint dla TypeScript/JavaScript
- ✅ Conventional Commits format dla wiadomości
- ✅ Spójność kodu w zespole

**Jeśli brakuje hooków:**

```bash
npm install
```

### 6. Sprawdź GitHub Actions

```bash
# Sprawdź czy workflows są obecne
ls -la .github/workflows/

# Dostępne workflows:
# - playwright-tests.yml (GitHub-hosted runner)
# - self-hosted-tests.yml (Self-hosted runner)
```

**GitHub Actions pozwala:**

- ✅ Automatyczne uruchamianie testów przy push/PR
- ✅ Integrację z Ollama (lokalny runner) lub małymi modelami (GitHub runner)
- ✅ Generowanie raportów testowych w CI/CD

Szczegóły: zobacz `GITHUB_ACTIONS.md`

## KROK B: Konfiguracja Ollama

### 1. Upewnij się że Ollama działa

```bash
# Sprawdź status (Windows)
curl http://localhost:11434/api/tags

# Jeśli nie działa, uruchom (osobne okno terminala):
ollama serve
```

### 2. Pobierz i skonfiguruj model

```bash
# Sprawdź zainstalowane modele
ollama list

# Pobierz zalecany model (jeśli brak)
ollama pull llama3.2-vision:latest

# LUB mniejszy model dla słabszych maszyn:
ollama pull llama3.2:3b
```

### 3. Utwórz zoptymalizowany model

```bash
# Modelfile został wygenerowany przez 'npm run diagnose'
ollama create playwright-model -f Modelfile

# Sprawdź czy model został utworzony
ollama list | grep playwright
```

### 4. Zaktualizuj plik .env

```bash
# Edytuj .env i ustaw:
# OLLAMA_MODEL=playwright-model
# lub użyj bazowego modelu:
# OLLAMA_MODEL=llama3.2-vision:latest
```

## KROK C: Uruchomienie Testów

### 1. Weryfikacja przed uruchomieniem

```bash
# Sprawdź typowanie TypeScript
npm run typecheck

# Sprawdź formatowanie
npm run format:check

# Sprawdź linting
npm run lint

# (Opcjonalnie) Przetestuj git hooks
git add .
git commit -m "test(init): verify husky setup" --dry-run
```

**💡 Tip:** Git hooks (Husky) automatycznie uruchomią ESLint i Prettier przy każdym commicie, więc możesz pominąć ręczne sprawdzanie przed commitem.

### 2. Wygeneruj kod testowy z BDD

```bash
npm run bddgen
```

### 3. Uruchom testy

```bash
# Testy w trybie headless
npm test

# Testy z widoczną przeglądarką
npm run test:headed

# Debugowanie testów
npm run test:debug

# Uruchom testy i automatycznie otwórz raport
npm run test:report

# Uruchom testy z konkretnym tagiem
npm run test:tag @smoke
npm run test:tag @critical

# Uruchom tylko testy smoke (szybki test podstawowej funkcjonalności)
npm run test:smoke
```

**📌 Używanie tagów w testach:**

Tagi pozwalają grupować i selektywnie uruchamiać testy. W plikach `.feature` dodaj tagi przed scenariuszem:

```gherkin
@smoke @critical
Scenario: Add product to cart
  Given I am logged in as "standard_user"
  ...
```

Popularne tagi:

- `@smoke` - podstawowe testy funkcjonalności (szybkie)
- `@critical` - testy krytycznej funkcjonalności
- `@regression` - testy regresyjne
- `@wip` - work in progress (testy w trakcie tworzenia)
- `@skip` - testy do pominięcia

### 4. Zobacz raport testowy

```bash
npm run report
```

**Raport HTML zawiera:**

- Przegląd wszystkich testów (passed/failed)
- Szczegóły każdego kroku testu
- Zrzuty ekranu (tylko przy błędach)
- Nagrania wideo (tylko przy błędach)
- Trace viewer (tylko przy retry)
- Czasomierze dla każdej akcji

**Raport otwiera się automatycznie w przeglądarce** pod adresem `http://localhost:9323`

Aby zamknąć serwer raportu, naciśnij `Ctrl+C` w terminalu.

**💡 Tip:** Użyj `npm run test:report` aby w jednym kroku uruchomić testy i od razu zobaczyć raport!

## KROK D: Monitorowanie i Debug

### 1. Logi AI

Wszystkie interakcje z AI są logowane w katalogu `logs/`:

```bash
# Zobacz najnowszy log
ls -lt logs/ | head -n 1
cat logs/ai-prompts-*.log
```

### 2. Debug w czasie rzeczywistym

```bash
# Uruchom test z debuggerem Playwright
npm run test:debug
```

### 3. Problemy z Ollama?

```bash
# Ponowna diagnostyka
npm run diagnose

# Sprawdź logi Ollama (w oknie gdzie uruchomiono 'ollama serve')

# Test połączenia z Ollama
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "llama3.2-vision:latest",
  "prompt": "Test",
  "stream": false
}'
```

## KROK E: Czyszczenie

```bash
# Wyczyść wszystkie artefakty testów
npm run clean

# Wyczyść tylko logi AI
npm run clean:logs

# Pełne czyszczenie (tylko jeśli chcesz zacząć od nowa)
rm -rf node_modules package-lock.json
npm install
```

**Co usuwa `npm run clean`:**

- `dist/` - skompilowane pliki TypeScript (jeśli używasz `build`)
- `test-results/` - wyniki testów Playwright
- `playwright-report/` - raporty HTML
- `.features-gen/` - wygenerowane pliki testowe z BDD

**Co usuwa `npm run clean:logs`:**

- `logs/*.log` - wszystkie logi AI z poprzednich uruchomień testów

---

## 📝 TWORZENIE NOWEGO PROJEKTU OD ZERA

Jeśli tworzysz projekt po raz pierwszy, użyj poniższych kroków:

## KROK 1: Inicjalizacja projektu

### 1. Utwórz katalog projektu

```bash
mkdir playwright-agents
cd playwright-agents
```

### 2. Inicjalizuj projekt Node.js

```bash
npm init -y
```

### 3. Ustaw typ modułu w package.json

```json
{
  "type": "module"
}
```

### 4. Zainstaluj zależności

```bash
# Playwright i BDD
npm install -D @playwright/test playwright playwright-bdd @cucumber/cucumber

# TypeScript
npm install -D typescript @types/node

# ESLint i Prettier
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-prettier eslint-config-prettier prettier

# Narzędzia pomocnicze
npm install -D jiti rimraf globals @types/eslint

# Zależności projektu
npm install dotenv openai

# Git Hooks (Husky) i lint-staged
npm install -D husky lint-staged
```

**💡 Tip:** Husky zostanie automatycznie skonfigurowany przez skrypt `prepare` w późniejszym kroku.

## KROK 2: Diagnostyka i Optymalizacja Ollama

### 1. Utwórz katalog dla skryptów

```bash
mkdir scripts
```

### 2. Utwórz skrypt diagnostyczny

Stwórz plik `scripts/diagnose-ollama.py`:

```python
#!/usr/bin/env python3
"""
Diagnostyka i optymalizacja Ollama dla testów Playwright
"""

import requests
import json
import sys
import psutil

def check_ollama_status():
    """Sprawdź czy Ollama jest uruchomiona"""
    print("🔍 Sprawdzanie statusu Ollama...")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama jest uruchomiona")
            models = response.json().get('models', [])
            if models:
                print(f"\n📋 Dostępne modele ({len(models)}):")
                for model in models:
                    print(f"  - {model.get('name', 'unknown')}")
                return True, models
            else:
                print("⚠️  Ollama działa, ale brak zainstalowanych modeli")
                return True, []
        else:
            print(f"❌ Ollama odpowiada z kodem: {response.status_code}")
            return False, []
    except requests.exceptions.ConnectionError:
        print("❌ Nie można połączyć się z Ollama (http://localhost:11434)")
        print("   Uruchom: ollama serve")
        return False, []
    except Exception as e:
        print(f"❌ Błąd: {e}")
        return False, []

def check_system_resources():
    """Sprawdź dostępne zasoby systemowe"""
    print("\n💾 Sprawdzanie zasobów systemowych...")

    ram = psutil.virtual_memory()
    ram_total_gb = ram.total / (1024**3)
    ram_available_gb = ram.available / (1024**3)

    print(f"  RAM: {ram_available_gb:.1f}GB dostępne / {ram_total_gb:.1f}GB łącznie")

    cpu_count = psutil.cpu_count()
    print(f"  CPU: {cpu_count} rdzeni")

    return ram_total_gb, ram_available_gb

def suggest_model(ram_total_gb):
    """Zasugeruj model na podstawie dostępnej pamięci"""
    print("\n🤖 Rekomendacje modelu:")

    if ram_total_gb >= 16:
        print("  ✅ Zalecany model: llama3.2-vision:latest lub llama3.1:8b")
        print("     Instalacja: ollama pull llama3.2-vision:latest")
        return "llama3.2-vision:latest"
    elif ram_total_gb >= 8:
        print("  ⚠️  Zalecany model: llama3.2:3b")
        print("     Instalacja: ollama pull llama3.2:3b")
        return "llama3.2:3b"
    else:
        print("  ⚠️  Zalecany model: phi3:mini")
        print("     Instalacja: ollama pull phi3:mini")
        return "phi3:mini"

def configure_model(model_name):
    """Skonfiguruj parametry modelu dla stabilności testów"""
    print(f"\n⚙️  Konfiguracja modelu {model_name}...")

    modelfile_content = f"""FROM {model_name}

# Parametry dla stabilności testów
PARAMETER temperature 0
PARAMETER num_ctx 8192
PARAMETER top_k 10
PARAMETER top_p 0.9

SYSTEM You are a precise web automation assistant. Your task is to identify UI elements on web pages with high accuracy. Always provide specific, unambiguous selectors.
"""

    with open('Modelfile', 'w') as f:
        f.write(modelfile_content)
    print("\n✅ Plik 'Modelfile' został utworzony")

    print("\nNastępnie uruchom:")
    print(f"  ollama create playwright-model -f Modelfile")

    return modelfile_content

def main():
    print("=" * 60)
    print("🚀 Diagnostyka Ollama dla Playwright AI Tests")
    print("=" * 60)

    is_running, models = check_ollama_status()

    if not is_running:
        print("\n❌ Ollama nie działa. Uruchom ją przed kontynuowaniem.")
        sys.exit(1)

    ram_total, ram_available = check_system_resources()
    suggested_model = suggest_model(ram_total)

    model_names = [m.get('name', '') for m in models]
    if any(suggested_model in name for name in model_names):
        print(f"\n✅ Model {suggested_model} jest już zainstalowany")
    else:
        print(f"\n⚠️  Model {suggested_model} nie jest zainstalowany")
        print(f"   Uruchom: ollama pull {suggested_model}")

    configure_model(suggested_model)

    print("\n" + "=" * 60)
    print("✅ Diagnostyka zakończona pomyślnie!")
    print("=" * 60)

    print("\n📋 Następne kroki:")
    print("  1. ollama create playwright-model -f Modelfile")
    print("  2. Zaktualizuj .env z nowym modelem")
    print("  3. npm test")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Przerwano przez użytkownika")
        sys.exit(0)
```

### 3. Dodaj skrypt do package.json

```json
{
  "scripts": {
    "diagnose": "python scripts/diagnose-ollama.py"
  }
}
```

### 4. Uruchom diagnostykę

```bash
npm run diagnose
```

## KROK 3: Struktura Katalogów

Utwórz strukturę projektu:

```bash
mkdir -p features steps utils logs .vscode
```

## KROK 4: Konfiguracja TypeScript

Stwórz `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": ["node", "@playwright/test"],
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "features/**/*.ts",
    "steps/**/*.ts",
    "scripts/**/*.ts",
    "utils/**/*.ts",
    "*.config.ts"
  ],
  "exclude": ["node_modules", "dist", "test-results", "playwright-report", ".playwright"]
}
```

## KROK 5: Konfiguracja Prettier

### 1. Stwórz `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 2. Stwórz `.prettierignore`

```.prettierignore
node_modules
dist
test-results
playwright-report
.playwright
*.log
package-lock.json
```

## KROK 6: Konfiguracja ESLint

Stwórz `eslint.config.ts`:

```typescript
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'test-results/**',
      'playwright-report/**',
      '.playwright/**',
      '*.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
    },
  },
];
```

## KROK 7: Konfiguracja Playwright

Stwórz `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';

dotenv.config();

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
});

export default defineConfig({
  testDir,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',

  timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '90000'),

  expect: {
    timeout: parseInt(process.env.PLAYWRIGHT_EXPECT_TIMEOUT || '30000'),
  },

  use: {
    baseURL: 'https://demo.playwright.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Konfiguracja dla wolniejszych lokalnych LLM
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

## KROK 8: Plik środowiskowy .env

Stwórz `.env`:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_API_KEY=ollama
OLLAMA_MODEL=llama3.2-vision:latest

# Model Parameters
OLLAMA_TEMPERATURE=0
OLLAMA_NUM_CTX=8192

# Playwright Configuration
PLAYWRIGHT_TIMEOUT=90000
PLAYWRIGHT_EXPECT_TIMEOUT=30000

# Test User Credentials
TEST_PASSWORD=secret_sauce
```

## KROK 9: Konfiguracja VSCode

### 1. Stwórz `.vscode/settings.json`

```json
{
  "cucumber.features": ["features/**/*.feature"],
  "cucumber.glue": ["steps/**/*.ts"],
  "editor.quickSuggestions": {
    "comments": false,
    "strings": true,
    "other": true
  },
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "playwright.reuseBrowser": true,
  "playwright.showTrace": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[feature]": {
    "editor.defaultFormatter": "cucumberopen.cucumber-official"
  },
  "files.associations": {
    "*.feature": "cucumber"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.playwright": true,
    "**/test-results": true,
    "**/playwright-report": true
  }
}
```

### 2. Stwórz `.vscode/cucumber.json`

```json
{
  "features": ["features/**/*.feature"],
  "glue": ["steps/**/*.ts"],
  "language": "en"
}
```

### 3. Stwórz `.vscode/extensions.json`

```json
{
  "recommendations": [
    "cucumberopen.cucumber-official",
    "ms-playwright.playwright",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

**Uwaga:** Używamy oficjalnego rozszerzenia `cucumberopen.cucumber-official` zamiast przestarzałego `alexkrechik.cucumberautocomplete`. Oficjalne rozszerzenie zapewnia:

- Lepsze podświetlanie składni Gherkin
- Rozpoznawanie definicji kroków (Go to Definition)
- Autocomplete dla kroków
- Walidację kroków w czasie rzeczywistym

Po instalacji rozszerzeń przeładuj VSCode (`Ctrl+Shift+P` → "Reload Window").

## KROK 10: AI Helper - Mechanizm logowania i obsługi błędów

Stwórz `utils/ai-helper.ts` - kompletny wrapper dla Ollama z logowaniem, fallback strategies i obsługą błędów.

_(Pełny kod znajduje się w aktualnym projekcie w pliku `utils/ai-helper.ts` - ~320 linii)_

Kluczowe funkcje:

- `click(description)` - znajdź i kliknij element używając AI
- `fill(description, value)` - wypełnij pole formularza
- `verify(description)` - sprawdź obecność elementu
- `logPrompt()` - loguje wszystkie interakcje do `logs/ai-prompts-*.log`
- Fallback strategies gdy AI nie znajdzie selektora
- Upraszczanie HTML dla oszczędności tokenów

## KROK 11: Przykładowy test BDD

### 1. Stwórz `features/shopping.feature`

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

**📌 Tagi w Cucumber:**

- `@smoke` - testy podstawowej funkcjonalności (szybkie)
- `@critical` - testy krytycznych funkcji
- `@regression` - pełne testy regresyjne
- Możesz uruchomić tylko testy z konkretnym tagiem: `npm run test:tag @smoke`

### 2. Stwórz `steps/shopping.steps.ts`

```typescript
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { AIHelper } from '../utils/ai-helper';

const { Given, When, Then } = createBdd();

let aiHelper: AIHelper;

Given('I am logged in as {string}', async ({ page }, username: string) => {
  aiHelper = new AIHelper(page);
  await page.goto('https://www.saucedemo.com/');

  const password = process.env.TEST_PASSWORD || 'secret_sauce';

  await aiHelper.fill('username field', username);
  await aiHelper.fill('password field', password);
  await aiHelper.click('login button');

  await page.waitForLoadState('networkidle');
  aiHelper.logPrompt(`Logged in as ${username}`);
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
```

## KROK 12: Aktualizuj package.json

Dodaj wszystkie potrzebne skrypty i konfigurację:

```json
{
  "scripts": {
    "test": "bddgen && playwright test",
    "test:headed": "bddgen && playwright test --headed",
    "test:debug": "bddgen && playwright test --debug",
    "test:report": "npm test && npm run report",
    "test:tag": "bddgen && playwright test --grep",
    "test:smoke": "bddgen && playwright test --grep @smoke",
    "bddgen": "bddgen",
    "diagnose": "python scripts/diagnose-ollama.py",
    "report": "playwright show-report",
    "lint": "eslint . --ext .ts,.js",
    "lint:fix": "eslint . --ext .ts,.js --fix",
    "format": "prettier --write \"**/*.{ts,js,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md}\"",
    "typecheck": "tsc --noEmit",
    "build": "tsc",
    "clean": "rimraf dist test-results playwright-report .features-gen",
    "clean:logs": "rimraf logs/*.log",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "prettier --write"],
    "*.{json,md,feature}": ["prettier --write"]
  }
}
```

**Dostępne skrypty:**

- `test` - uruchom wszystkie testy w trybie headless
- `test:headed` - uruchom testy z widoczną przeglądarką
- `test:debug` - debuguj testy interaktywnie
- `test:report` - uruchom testy i automatycznie otwórz raport
- `test:tag` - uruchom testy z konkretnym tagiem (np. `npm run test:tag @smoke`)
- `test:smoke` - uruchom tylko testy smoke (szybka weryfikacja)
- `bddgen` - wygeneruj kod testowy z plików .feature
- `diagnose` - sprawdź status Ollama i zasoby systemowe
- `report` - otwórz raport HTML ostatniego uruchomienia
- `lint` / `lint:fix` - sprawdź/napraw kod ESLintem
- `format` / `format:check` - formatuj/sprawdź kod Prettierem
- `typecheck` - sprawdź typy TypeScript
- `clean` - usuń artefakty testów
- `clean:logs` - usuń logi AI
- `prepare` - instaluje Husky hooks (uruchamia się automatycznie przy `npm install`)

## KROK 13: Konfiguracja Git Hooks (Husky)

### 1. Inicjalizuj Husky

```bash
npx husky init
```

### 2. Utwórz pre-commit hook

**Dla Linux/macOS/Git Bash** - `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
npx lint-staged
```

**Dla Windows PowerShell** - `.husky/pre-commit.ps1`:

```powershell
#!/usr/bin/env pwsh
npx lint-staged
```

Nadaj uprawnienia (Linux/macOS):

```bash
chmod +x .husky/pre-commit
```

### 3. Utwórz commit-msg hook

**Dla Linux/macOS/Git Bash** - `.husky/commit-msg`:

```bash
#!/usr/bin/env sh

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Conventional Commits format: type(scope): message
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,}"; then
  echo "❌ Commit message format error!"
  echo ""
  echo "Format: type(scope): message"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
  echo ""
  echo "Example: feat(tests): add shopping cart test"
  echo "Example: fix(ai-helper): improve selector fallback"
  exit 1
fi
```

**Dla Windows PowerShell** - `.husky/commit-msg.ps1`:

```powershell
#!/usr/bin/env pwsh
param($CommitMsgFile)

$commitMsg = Get-Content $CommitMsgFile -Raw

if ($commitMsg -notmatch "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,}") {
    Write-Host "❌ Commit message format error!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Format: type(scope): message"
    Write-Host ""
    Write-Host "Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
    Write-Host ""
    Write-Host "Example: feat(tests): add shopping cart test"
    Write-Host "Example: fix(ai-helper): improve selector fallback"
    exit 1
}
```

Nadaj uprawnienia (Linux/macOS):

```bash
chmod +x .husky/commit-msg
```

### 4. Przetestuj hooki

```bash
# Test pre-commit (automatyczne formatowanie)
echo "const test = 'hello'" > test.ts
git add test.ts
git commit -m "test(hooks): verify pre-commit"
# ✅ Prettier automatycznie sformatuje test.ts

# Test commit-msg (weryfikacja formatu)
git commit --allow-empty -m "add test"
# ❌ Błąd: zły format

git commit --allow-empty -m "test(hooks): verify commit-msg"
# ✅ OK
```

**📖 Więcej informacji:** Zobacz `HUSKY.md` dla pełnej dokumentacji Git Hooks.

---

## KROK 14: Konfiguracja GitHub Actions (Opcjonalne)

### 1. Utwórz katalog dla workflows

```bash
mkdir -p .github/workflows
```

### 2. Wybierz strategię CI/CD

### Opcja A: Self-Hosted Runner (Zalecane)

Stwórz `.github/workflows/self-hosted-tests.yml`:

```yaml
name: Playwright Tests (Self-Hosted)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Verify Ollama is running
        run: curl -f http://localhost:11434/api/tags || exit 1

      - name: Run BDD generation
        run: npm run bddgen

      - name: Run Playwright tests
        run: npm test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**Konfiguracja self-hosted runner:**

1. Settings → Actions → Runners → New self-hosted runner
2. Zainstaluj runner na swoim komputerze
3. Upewnij się że Ollama działa: `ollama serve`

### Opcja B: GitHub-Hosted Runner (dla smoke testów)

Stwórz `.github/workflows/playwright-tests.yml`:

```yaml
name: Playwright Tests (GitHub-Hosted)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Ollama
        run: |
          curl -fsSL https://ollama.com/install.sh | sh
          ollama serve &
          sleep 5

      - name: Pull small model
        run: ollama pull phi3:mini

      - name: Update .env for CI
        run: |
          echo "OLLAMA_BASE_URL=http://localhost:11434/v1" > .env
          echo "OLLAMA_API_KEY=ollama" >> .env
          echo "OLLAMA_MODEL=phi3:mini" >> .env
          echo "PLAYWRIGHT_TIMEOUT=180000" >> .env

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Run smoke tests only
        run: npm run test:smoke

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**⚠️ Uwaga:** GitHub-hosted runner ma ograniczone zasoby (2 CPU, 7GB RAM) - używaj tylko dla małych modeli i smoke testów.

**📖 Więcej informacji:** Zobacz `GITHUB_ACTIONS.md` dla wszystkich opcji CI/CD (tunel, OpenAI fallback, etc.).

---

## KROK 15: Finalizacja

### 1. Zainstaluj przeglądarki Playwright

```bash
npx playwright install chromium
```

### 2. Uruchom diagnostykę Ollama

```bash
npm run diagnose
```

### 3. Pobierz i skonfiguruj model

```bash
ollama pull llama3.2-vision:latest
ollama create playwright-model -f Modelfile
```

### 4. Zaktualizuj .env z modelem

```bash
# W pliku .env ustaw:
OLLAMA_MODEL=playwright-model
```

### 5. Przetestuj Git Hooks

```bash
# Utwórz testowy commit
git add .
git commit -m "chore: setup project structure"
# ✅ Pre-commit uruchomi lint-staged
# ✅ Commit-msg sprawdzi format wiadomości
```

### 6. Uruchom testy

```bash
npm test
```

---

## 🎉 Gotowe

Projekt jest skonfigurowany i gotowy do użycia!

**✅ Skonfigurowane:**

- Playwright + BDD (playwright-bdd + Cucumber)
- Ollama AI (lokalne LLM dla testów)
- TypeScript + ESLint + Prettier
- Git Hooks (Husky) - automatyczne formatowanie i weryfikacja commitów
- GitHub Actions (opcjonalnie) - CI/CD dla testów
- VSCode - autocomplete dla Gherkin i TypeScript

**📚 Dodatkowe zasoby:**

- `HUSKY.md` - pełna dokumentacja Git Hooks
- `GITHUB_ACTIONS.md` - wszystkie opcje CI/CD (self-hosted, GitHub-hosted, tunele, OpenAI)
- `logs/` - logi AI z poprzednich uruchomień testów
- `npm run report` - raport HTML ostatnich testów

**🚀 Następne kroki:**

1. Napisz swój pierwszy test w `features/`
2. Zaimplementuj kroki w `steps/`
3. Uruchom: `npm test`
4. Commituj zmiany - Husky automatycznie sprawdzi kod!
5. (Opcjonalnie) Skonfiguruj GitHub Actions dla CI/CD

Happy testing! 🎉
