# Dependabot - Automatyczne Update Zależności

## 🤖 Co to jest?

**Dependabot** to wbudowane narzędzie GitHub, które automatycznie:

- Sprawdza czy są nowe wersje zależności
- Tworzy Pull Requesty z update'ami
- Testuje zmiany przez GitHub Actions
- Grupuje podobne update'y razem

## ⚙️ Konfiguracja

Plik: `.github/dependabot.yml`

### Co monitoruje?

1. **npm dependencies** (package.json)
   - Sprawdzanie: **codziennie o 09:00 (Europe/Warsaw)**
   - Grupuje Playwright updates razem
   - Grupuje dev dependencies (minor/patch) razem
2. **GitHub Actions** (workflows)
   - Sprawdzanie: **co poniedziałek o 9:00**
   - Update'uje wersje actions (checkout, setup-node, etc.)

## 📋 Jak działa?

### 1. Dependabot skanuje zależności

Każdy poniedziałek o 9:00 sprawdza czy są nowe wersje.

### 2. Tworzy Pull Request

Jeśli znajdzie update, otwiera PR z:

- ✅ Changelog nowej wersji
- ✅ Compatibility score
- ✅ Automatycznymi testami (nasze workflows)
- ✅ Labelkami: `dependencies`, `npm`

### 3. Ty decydujesz

- Przejrzyj zmiany w PR
- Sprawdź czy testy przeszły
- Merge lub odrzuć

## 📊 Przykładowe PR

```
chore(deps): bump playwright from 1.40.0 to 1.41.0

Bumps playwright from 1.40.0 to 1.41.0.

Release notes:
- Added new feature X
- Fixed bug Y

Compatibility: 95/100
Tests: ✅ Passed
```

## 🎯 Konfiguracja projektu

### Częstotliwość:

- **Daily** (codziennie o 09:00 Europe/Warsaw)
- Można zmienić na: `daily`, `weekly`, `monthly`

### Limity:

- **npm**: max 10 otwartych PRs
- **GitHub Actions**: max 5 otwartych PRs

### Grupowanie:

```yaml
groups:
  playwright:
    patterns:
      - '@playwright/*'
      - 'playwright*'
```

Wszystkie Playwright pakiety w jednym PR.

### Auto-assign:

- Reviewer: **leonardust**
- Assignee: **leonardust**

## 🔧 Dodatkowe opcje

### Ignoruj konkretne zależności:

```yaml
ignore:
  - dependency-name: 'eslint'
    # ignoruj major updates ESLint
    update-types: ['version-update:semver-major']
```

### Auto-merge dla Dependabot PR-ów

Wcześniej korzystaliśmy z prostego workflowu, który poprawiał PR-y od Dependabota
bez sprawdzania czegokolwiek. Wprowadziliśmy zmiany:

- auto-merge nadal jest dozwolone, ale **tylko jeśli wszystkie wymagane
  statusy są zielone**
- nie liczymy do listy wymaganych statusów żadnego kroku deploy
- workflow nie uruchamia deploymentu raportu dla PR-ów od Dependabota

Obowiązkowe checks w tym repozytorium to:

1. **GitGuardian Security Checks** – zewnętrzny skaner bezpieczeństwa.
2. **CodeQL Advanced** – analiza kodu z pomocą GitHub CodeQL.
3. **Playwright - GitHub-Hosted / test** – wszystkie nasze testy E2E uruchamiane
   przez workflow `playwright-github-hosted.yml`.

Dodatkowo: **workflow `playwright-github-hosted.yml` nie uruchamia jobu deploy dla żadnego PR-a**,
więc status „deploy” nigdy nie jest brany pod uwagę przy auto-merge. Oznacza to, że
przeprowadzenie aktualizacji zależności nie skutkuje wdrożeniem raportu, a jedynie
sprawdzeniem kodu i testów.

Dlatego w `.github/workflows/dependabot-auto-merge.yml` zobaczysz logikę,
która czeka na te trzy statusy i dopiero wtedy squashuje PR, jeśli nie ma konfliktów.
Jeżeli któryś check nie pojawi się (np. deploy), auto-merge się nie zacznie.

W razie potrzeby możesz też użyć komend:

```bash
@dependabot rebase          # Rebase PR
@dependabot recreate        # Odtwórz PR od zera
@dependabot merge           # Merge jeśli testy przeszły
@dependabot squash and merge
@dependabot cancel merge
@dependabot close           # Zamknij ten PR
@dependabot ignore this major version
@dependabot ignore this minor version
@dependabot ignore this dependency
```

Szczegóły workflowa znajdują się w `.github/workflows/dependabot-auto-merge.yml`.

## 📚 Użyteczne komendy

### W komentarzu PR:

```bash
@dependabot rebase          # Rebase PR
@dependabot recreate        # Odtwórz PR od zera
@dependabot merge           # Merge jeśli testy przeszły
@dependabot squash and merge
@dependabot cancel merge
@dependabot close           # Zamknij ten PR
@dependabot ignore this major version
@dependabot ignore this minor version
@dependabot ignore this dependency
```

## ⚠️ Ważne - Włącz Branch Protection!

**Auto-merge wymaga 2 rzeczy:**

### 1. Włącz "Allow auto-merge" w repo settings:

1. Idź do **Settings** → **General**
2. Sekcja **Pull Requests**
3. ✅ Zaznacz **"Allow auto-merge"**

### 2. Włącz Branch Protection (ZALECANE):

1. Idź do **Settings** → **Branches**
2. Kliknij **Add branch protection rule**
3. **Branch name pattern**: `main`
4. Zaznacz:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
     - ✅ **Require branches to be up to date before merging**
     - W search box dodaj required checks:
       - `test` (dla "Playwright - GitHub-Hosted")
       - `test-with-local-ollama` (dla "Playwright - Self-Hosted")
   - ✅ **Do not allow bypassing the above settings**
5. Kliknij **Create** / **Save changes**

### Dlaczego to ważne?

**❌ Bez branch protection:**

- Auto-merge opiera się tylko na workflow logic
- Teoretycznie może zmergować bez testów (jeśli coś pójdzie nie tak)

**✅ Z branch protection:**

- GitHub **wymusza** passing tests
- Nie ma możliwości merge bez green checks
- Nawet admin nie może obejść (jeśli włączone)
- **100% bezpieczeństwo** 🔒

### Status checks do dodania:

Po pierwszym uruchomieniu workflows, będziesz mógł wybrać z listy:

- `test` - job z playwright-github-hosted.yml
- `test-with-local-ollama` - job z playwright-self-hosted.yml

GitHub pokaże je w dropdownie po pierwszym uruchomieniu.

## 🎨 Przykładowy workflow

### Poniedziałek 9:00:

- 📧 Dependabot: "2 new PRs opened"
- PR #1: `chore(deps): bump @playwright/test 1.40 → 1.41`
- PR #2: `chore(ci): bump actions/checkout v3 → v4`

### Ty sprawdzasz:

1. Otwierasz PR
2. Sprawdzasz changelog
3. Workflow wykonał testy: ✅ **Passed**
4. Klikasz **Merge**

### Gotowe! 🎉

## 🔒 Bezpieczeństwo

Dependabot też skanuje **security vulnerabilities**:

- CVE-2024-XXXXX wykryte
- Automatyczny PR z fixem
- Label: `security` 🚨

## 📖 Dokumentacja

- [Dependabot configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Dependabot commands](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/managing-pull-requests-for-dependency-updates)
- [Auto-merge setup](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)

## ✅ Status

Po pushu tego pliku, sprawdź:

1. **Settings** → **Security** → **Dependabot**
2. Powinieneś zobaczyć: "Dependabot version updates: Enabled"
3. Pierwszy skan: **najbliższy poniedziałek o 9:00**

Możesz też ręcznie trigger'ować: **Insights** → **Dependency graph** → **Dependabot** → **Check for updates**
