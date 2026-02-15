# Playwright AI Agents - Test Automation

Projekt automatyzacji testów wykorzystujący:

- **Playwright** - framework do testów E2E
- **Playwright BDD** - wsparcie dla Gherkin/Cucumber
- **Ollama** - lokalne uruchamianie LLM
- **OpenAI SDK** - komunikacja z lokalnym LLM

## 📋 Spis treści

- [🚀 Quick Start](#-quick-start)
  - [1. Instalacja zależności](#1-instalacja-zależności)
  - [2. Konfiguracja Ollama](#2-konfiguracja-ollama)
  - [3. Instalacja modelu](#3-instalacja-modelu)
  - [4. Konfiguracja parametrów modelu](#4-konfiguracja-parametrów-modelu)
  - [5. Aktualizacja .env](#5-aktualizacja-env)
  - [6. Uruchomienie testów](#6-uruchomienie-testów)
- [📁 Struktura Projektu](#-struktura-projektu)
- [🧪 Przykładowy Test](#-przykładowy-test)
- [🤖 AIHelper API](#-aihelper-api)
- [⚙️ Konfiguracja](#️-konfiguracja)
  - [Zmienne środowiskowe (.env)](#zmienne-środowiskowe-env)
  - [Parametry modelu](#parametry-modelu)
- [🐛 Debugging](#-debugging)
  - [Logi AI](#logi-ai)
  - [Uruchomienie w trybie debug](#uruchomienie-w-trybie-debug)
  - [Uruchomienie z widoczną przeglądarką](#uruchomienie-z-widoczną-przeglądarką)
- [📊 Raport testów](#-raport-testów)
- [🔧 Optymalizacja wydajności](#-optymalizacja-wydajności)
- [📚 Dodatkowe informacje](#-dodatkowe-informacje)
- [🪝 Git Hooks](#-git-hooks)
- [🔄 CI/CD](#-cicd)
  - [Szybki start z CI](#szybki-start-z-ci)
- [🛠️ Troubleshooting](#️-troubleshooting)

---

## 🚀 Quick Start

### 1. Instalacja zależności

```bash
npm install
```

### 2. Konfiguracja Ollama

Przed uruchomieniem testów, sprawdź konfigurację Ollama:

```bash
npm run diagnose
```

Skrypt diagnostyczny sprawdzi:

- Czy Ollama jest uruchomiona
- Dostępne modele
- Zasoby systemowe
- Wygeneruje optymalną konfigurację modelu

### 3. Instalacja modelu

Zainstaluj zalecany model (np. llama3.1:8b):

```bash
ollama pull llama3.1:8b
```

### 4. Konfiguracja parametrów modelu

Skrypt diagnostyczny utworzy plik `Modelfile`. Utwórz zoptymalizowany model:

```bash
ollama create playwright-model -f Modelfile
```

### 5. Aktualizacja .env

Zaktualizuj plik `.env` z nazwą utworzonego modelu:

```env
OLLAMA_MODEL=playwright-model
```

### 6. Uruchomienie testów

```bash
npm test
```

## 📁 Struktura Projektu

```
playwright-agents/
├── features/           # Pliki .feature (Gherkin)
│   └── shopping.feature
├── steps/              # Implementacje kroków BDD
│   └── shopping.steps.ts
├── utils/              # Pomocnicze utility
│   └── ai-helper.ts    # Wrapper dla Ollama AI
├── scripts/            # Skrypty pomocnicze
│   ├── diagnose-ollama.py
│   └── diagnose-ollama.sh
├── logs/               # Logi promptów AI (auto-generated)
├── playwright.config.ts
├── .env
└── package.json
```

## 🧪 Przykładowy Test

```gherkin
Feature: Shopping Cart
  Scenario: Add product to cart
    Given I am on the products page
    When  I click on "Add to cart" button for the first product
    Then  I should see the cart counter increase
    And   the product should appear in the cart
```

## 🤖 AIHelper API

Klasa `AIHelper` dostarcza metody do interakcji z UI używając lokalnego LLM:

```typescript
const aiHelper = new AIHelper(page);

// Kliknij element
await aiHelper.click('login button');

// Wypełnij pole
await aiHelper.fill('username field', 'testuser');

// Zweryfikuj obecność elementu
const isVisible = await aiHelper.verify('success message');
```

Wszystkie interakcje są logowane do `logs/ai-prompts-*.log` dla debugowania.

## ⚙️ Konfiguracja

### Zmienne środowiskowe (.env)

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_API_KEY=ollama
OLLAMA_MODEL=llama3.1:8b

# Model Parameters
OLLAMA_TEMPERATURE=0         # Deterministyczne odpowiedzi
OLLAMA_NUM_CTX=8192         # Większy kontekst dla DOM

# Playwright Configuration
PLAYWRIGHT_TIMEOUT=90000     # 90s timeout
PLAYWRIGHT_EXPECT_TIMEOUT=30000
```

### Parametry modelu

- **temperature=0**: Eliminuje losowość, zapewnia deterministyczne selektory
- **num_ctx=8192**: Większy kontekst aby pomieścić strukturę DOM strony
- **top_k=10**: Ogranicza wybór tokenów do najbardziej prawdopodobnych

## 🐛 Debugging

### Logi AI

Wszystkie prompty wysyłane do AI są logowane w katalogu `logs/`:

```bash
cat logs/ai-prompts-*.log
```

### Uruchomienie w trybie debug

```bash
npm run test:debug
```

### Uruchomienie z widoczną przeglądarką

```bash
npm run test:headed
```

## 📊 Raport testów

Po wykonaniu testów, wygeneruj raport HTML:

```bash
npm run report
```

## 🔧 Optymalizacja wydajności

1. **Wybór modelu**: Dla 8GB+ RAM użyj `llama3.1:8b`, dla mniejszych zasobów `llama3.2:3b` lub `phi3:mini`
2. **Timeouty**: Lokalne LLM są wolniejsze - timeouty są zwiększone do 60-90s
3. **Kontekst**: HTML jest uproszczany przed wysłaniem do LLM aby zmniejszyć liczbę tokenów
4. **Równoległość**: Testy uruchamiane sekwencyjnie (`workers: 1`) aby nie przeciążyć GPU/CPU

## 📚 Dodatkowe informacje

- [Playwright Documentation](https://playwright.dev)
- [Playwright BDD](https://github.com/vitalets/playwright-bdd)
- [Ollama Documentation](https://ollama.ai/docs)
- [OpenAI SDK](https://github.com/openai/openai-node)
- **[GitHub Actions z Ollama](GITHUB_ACTIONS.md)** - Przewodnik po uruchamianiu testów w CI/CD
- **[Husky + Git Hooks](HUSKY.md)** - Automatyczna weryfikacja kodu przed commitem

## 🪝 Git Hooks

Projekt używa **Husky** do automatycznej weryfikacji kodu:

- **Pre-commit**: ESLint + Prettier sprawdzają i formatują kod
- **Commit-msg**: Wymusza Conventional Commits format

```bash
# Poprawny format commit message:
git commit -m "feat(tests): add new shopping test"
git commit -m "fix(ai-helper): improve selector fallback"
git commit -m "docs(readme): update installation guide"
```

Zobacz szczegóły: **[HUSKY.md](HUSKY.md)**

## 🔄 CI/CD

Projekt zawiera 2 workflows z automatycznym deploymentem raportów do GitHub Pages:

- **Playwright - Self-Hosted** - `.github/workflows/playwright-self-hosted.yml`
  - Uruchamia się przy push do `main`
  - Używa modelu `llama3.2-vision:latest`
  - Automatyczny deployment raportu
  - ~115s execution time
- **Playwright - GitHub-Hosted** - `.github/workflows/playwright-github-hosted.yml`
  - Uruchamia się przy push/PR
  - Używa Groq API `llama-3.1-8b-instant` (ultra-fast)
  - Automatyczny deployment raportu
  - ~37s execution time

**📊 Raporty testów dostępne na GitHub Pages:**

Wszystkie raporty są automatycznie publikowane na:

- **Strona główna:** https://leonardust.github.io/playwright-agents/
- **Self-hosted latest:** https://leonardust.github.io/playwright-agents/self-hosted/latest/
- **GitHub-hosted latest:** https://leonardust.github.io/playwright-agents/github-hosted/latest/

Strona główna zawiera:

- Przyciski do najnowszych raportów
- Historię ostatnich 20 raportów dla każdego typu
- Automatycznie aktualizowane timestamps

Zobacz szczegółowy przewodnik: **[GITHUB_ACTIONS.md](GITHUB_ACTIONS.md)**

### Szybki start z CI:

```bash
# Opcja 1: Self-hosted runner (zalecane)
# 1. Zainstaluj runner na swoim komputerze (jako serwis Windows)
# 2. Uruchom Ollama lokalnie
# 3. Push do repo - testy uruchomią się automatycznie
# 4. Raport pojawi się w workflow summary i na GitHub Pages

# Opcja 2: GitHub-hosted runner
# 1. Workflow automatycznie instaluje Ollama i phi3:mini
# 2. Uruchom tylko smoke tests (@smoke tag)
# 3. Raport automatycznie na GitHub Pages
```

## 🛠️ Troubleshooting

### Ollama nie odpowiada

```bash
# Sprawdź czy Ollama działa
curl http://localhost:11434/api/tags

# Jeśli nie, uruchom:
ollama serve
```

### Testy timeout'ują

Zwiększ timeouty w `.env`:

```env
PLAYWRIGHT_TIMEOUT=120000
PLAYWRIGHT_EXPECT_TIMEOUT=45000
```

### AI zwraca niepoprawne selektory

1. Sprawdź logi: `logs/ai-prompts-*.log`
2. Upewnij się że `temperature=0`
3. Rozważ użycie większego modelu
