# Husky + Git Hooks - Konfiguracja

## 📋 Spis treści

- [📦 Zainstalowane pakiety](#-zainstalowane-pakiety)
- [🪝 Skonfigurowane Git Hooks](#-skonfigurowane-git-hooks)
  - [1. Pre-commit Hook](#1-pre-commit-hook)
  - [2. Commit-msg Hook](#2-commit-msg-hook)
- [🔄 Workflow](#-workflow)
  - [Typowy commit z Husky](#typowy-commit-z-husky)
  - [Jeśli commit zawiera błędy](#jeśli-commit-zawiera-błędy)
- [🚫 Co jest ignorowane w .gitignore](#-co-jest-ignorowane-w-gitignore)
- [🛠️ Jak to działa](#️-jak-to-działa)
  - [Pre-commit proces](#pre-commit-proces)
  - [Commit-msg proces](#commit-msg-proces)
- [🎯 Korzyści](#-korzyści)
  - [Dla zespołu](#dla-zespołu)
  - [Dla CI/CD](#dla-cicd)
- [🔧 Dodatkowe komendy](#-dodatkowe-komendy)
- [📝 Customizacja](#-customizacja)
- [🚀 Gotowe](#-gotowe)

---

## 📦 Zainstalowane pakiety

```bash
npm install -D husky lint-staged
```

## 🪝 Skonfigurowane Git Hooks

### 1. Pre-commit Hook

**Lokalizacja:** `.husky/pre-commit`

**Co robi:**

- Automatycznie uruchamia `lint-staged` przed każdym commitem
- Sprawdza i naprawia staged files

**Konfiguracja lint-staged (w package.json):**

```json
"lint-staged": {
  "*.{ts,js}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,feature}": [
    "prettier --write"
  ]
}
```

**Efekt:**

- ESLint sprawdza i naprawia błędy w plikach TypeScript/JavaScript
- Prettier formatuje wszystkie pliki (kod, JSON, Markdown, .feature)
- Naprawione pliki są automatycznie dodawane do commita

### 2. Commit-msg Hook

**Lokalizacja:**

- `.husky/commit-msg` (Linux/macOS/Git Bash)
- `.husky/commit-msg.ps1` (Windows PowerShell)

**Co robi:**

- Weryfikuje format wiadomości commitów
- Wymusza Conventional Commits standard

**Format wymagany:**

```
type(scope): message

Przykłady:
✅ feat(tests): add shopping cart test
✅ fix(ai-helper): improve selector fallback
✅ docs(readme): update installation guide
✅ chore: update dependencies
```

**Dostępne typy:**

- `feat` - nowa funkcjonalność
- `fix` - naprawa błędu
- `docs` - dokumentacja
- `style` - formatowanie kodu (bez zmian logiki)
- `refactor` - refaktoryzacja kodu
- `test` - dodanie/modyfikacja testów
- `chore` - maintanance (dependencies, config)
- `perf` - optymalizacja wydajności
- `ci` - zmiany w CI/CD
- `build` - zmiany w build system
- `revert` - wycofanie zmian

## 🔄 Workflow

### Typowy commit z Husky

```bash
# 1. Wprowadź zmiany w kodzie
vim features/login.feature

# 2. Dodaj pliki do staging
git add features/login.feature steps/login.steps.ts

# 3. Commit (Husky automatycznie uruchomi hooki)
git commit -m "feat(auth): add login test"

# Co się dzieje:
# ✅ Pre-commit: lint-staged sprawdza i formatuje pliki
# ✅ Commit-msg: weryfikuje format wiadomości
# ✅ Commit zostaje zapisany
```

### Jeśli commit zawiera błędy

```bash
git commit -m "add test"

# ❌ Commit message format error!
# Format: type(scope): message
# Example: feat(tests): add shopping cart test
```

```bash
# Poprawna wersja:
git commit -m "test(cart): add shopping cart test"
# ✅ Commit successful
```

## 🚫 Co jest ignorowane w .gitignore

### ✅ Ignorowane (nie commitowane)

- `node_modules/` - zależności
- `.env`, `.env.local` - zmienne środowiskowe (sekrety)
- `test-results/`, `playwright-report/` - wyniki testów
- `.features-gen/` - auto-generowane pliki testowe
- `logs/` - logi AI
- `dist/`, `build/` - skompilowane pliki
- `Modelfile` - lokalna konfiguracja Ollama
- `.vscode/launch.json` - osobiste debugowanie

### ✅ Commitowane (w repo)

- `package-lock.json` - stabilność wersji zależności
- `.vscode/settings.json` - wspólna konfiguracja IDE
- `.vscode/extensions.json` - zalecane rozszerzenia
- `.vscode/cucumber.json` - konfiguracja Cucumber
- `.github/workflows/` - CI/CD workflows
- `features/`, `steps/`, `utils/` - kod projektu

## 🛠️ Jak to działa

### Pre-commit proces

```bash
1. git commit
   ↓
2. Husky interceptuje commit
   ↓
3. Uruchamia .husky/pre-commit
   ↓
4. Wykonuje: npx lint-staged
   ↓
5. lint-staged dla każdego staged file:
   - *.ts, *.js → ESLint --fix → Prettier --write
   - *.json, *.md, *.feature → Prettier --write
   ↓
6. Jeśli OK → commit kontynuowany
   Jeśli błędy → commit przerwany (fix manually)
```

### Commit-msg proces

```bash
1. Commit message został napisany
   ↓
2. Husky interceptuje
   ↓
3. Uruchamia .husky/commit-msg
   ↓
4. Sprawdza regex: ^(feat|fix|...)(\(.+\))?: .{1,}
   ↓
5. Jeśli pasuje → commit OK
   Jeśli nie pasuje → pokazuje błąd i przykłady
```

## 🎯 Korzyści

### Dla zespołu

✅ Jednolity styl kodu (automatyczne formatowanie)
✅ Brak błędów lintingu w repo
✅ Czytelna historia commitów (Conventional Commits)
✅ Łatwiejsze generowanie changelog
✅ Automatyczne semantic versioning

### Dla CI/CD

✅ Mniej błędów w pipeline (lint przed pushem)
✅ Szybsze buildy (kod już sformatowany)
✅ Łatwiejsze code review (format jednolity)

## 🔧 Dodatkowe komendy

```bash
# Pomiń hooki (emergencja, nie zalecane!)
git commit --no-verify -m "fix: emergency fix"

# Uruchom lint-staged manualnie
npx lint-staged

# Przetestuj commit-msg hook
echo "feat(test): example" | .husky/commit-msg

# Reinstall hooks (po clone repo)
npm install
```

## 📝 Customizacja

### Wyłącz commit-msg verification

Usuń lub skomentuj `.husky/commit-msg`

### Zmień reguły lint-staged

Edytuj `package.json`:

```json
"lint-staged": {
  "*.ts": ["eslint --fix"]  // tylko ESLint, bez Prettier
}
```

### Dodaj pre-push hook

```bash
npx husky add .husky/pre-push "npm test"
```

## 🚀 Gotowe

Twoje repo jest teraz chronione przed:

- ❌ Niesformatowanym kodem
- ❌ Błędami ESLint
- ❌ Złym formatem commit messages
- ❌ Niepotrzebnymi plikami w repo

Happy coding! 🎉
