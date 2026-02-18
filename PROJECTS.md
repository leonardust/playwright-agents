# 🎭 Playwright Agents - Project Management

## 📋 O Projekcie

Ten GitHub Project zarządza rozwojem frameworka **Playwright Agents** - zaawansowanego systemu automatyzacji testów wykorzystującego AI (Ollama/Groq) do inteligentnego wyszukiwania elementów UI.

**Status**: ✅ Ollama i Groq są już skonfigurowane i działają

## 🔗 Powiązane Zasoby

- **Repository**: [leonardust/playwright-agents](https://github.com/leonardust/playwright-agents)
- **GitHub Pages**: [Test Reports](https://leonardust.github.io/playwright-agents/)
- **CI/CD**:
  - Self-hosted runner z Ollama (llama3.2-vision)
  - GitHub-hosted runner z Groq API (llama-3.1-8b-instant)

## 📊 Struktura Projektu

### Kolumny Workflow

- **📝 Todo** - Zaplanowane zadania do realizacji
- **🚧 In Progress** - Zadania w trakcie realizacji
- **✅ Done** - Ukończone zadania

## 🏷️ Etykiety

- `enhancement` - Nowe funkcjonalności
- `bug` - Błędy do naprawy
- `documentation` - Aktualizacje dokumentacji
- `dependencies` - Aktualizacje zależności (Dependabot)
- `ai` - Funkcjonalności związane z AI/LLM

## 🎯 Priorytety

Issues są priorytetyzowane według:

1. **Critical** 🔴 - Blokujące, wymagające natychmiastowej uwagi
2. **High** 🟠 - Ważne, do realizacji w najbliższym czasie
3. **Medium** 🟡 - Standardowy priorytet
4. **Low** 🟢 - Nice-to-have, do realizacji w przyszłości

## 🔄 Workflow

1. **Utworzenie Issue** → automatycznie trafia do **Todo**
2. **Rozpoczęcie pracy** → przenieś do **In Progress**
3. **Ukończenie** → przenieś do **Done**

## 🤝 Jak Współpracować

### Dodawanie nowego zadania

1. Utwórz issue w repozytorium
2. Dodaj odpowiednie etykiety
3. Przypisz do projektu (automatycznie trafi do Todo)
4. Ustaw priorytet

### Praca nad zadaniem

1. Przypisz issue do siebie
2. Przenieś do **In Progress**
3. Utwórz branch: `feat/nazwa-zadania` lub `fix/nazwa-zadania`
4. Commituj zgodnie z [Conventional Commits](https://www.conventionalcommits.org/)
5. Otwórz PR i dodaj link do issue: `Closes #123`
6. Po merge przenieś do **Done**

## 🤖 Skonfigurowane AI Providers

### Ollama (Local)

- ✅ Skonfigurowane i działające
- Model: `llama3.2-vision:latest`
- Użycie: Self-hosted CI/CD runner
- Diagnostyka: `npm run diagnose`

### Groq (Cloud)

- ✅ Skonfigurowane i działające
- Model: `llama-3.1-8b-instant`
- Użycie: GitHub-hosted CI/CD
- Ultra-szybkie (~37s execution time)

## 📈 Metryki

Projekt śledzi:

- ⏱️ Czas realizacji zadań (cycle time)
- 📊 Liczba otwartych vs zamkniętych issues
- 🔥 Velocity (zadania per sprint)
- 🎯 Postęp względem celów

## 🛠️ Automatyzacje

- **Dependabot**: Automatyczne PRy dla aktualizacji zależności
- **Husky**: Pre-commit hooks (ESLint + Prettier)
- **GitHub Actions**:
  - Automatyczne testy przy każdym push/PR
  - Deployment raportów na GitHub Pages
  - Scheduled runs

## 📝 Roadmap

### ✅ Completed

- Podstawowa integracja z Ollama
- Integracja z Groq Cloud API
- Self-hosted i GitHub-hosted workflows
- GitHub Pages deployment
- BDD z Playwright

### 🚧 In Progress

- Sprawdź aktualny board projektu

### 📝 Planned

- Advanced AI features (context memory)
- Self-healing tests
- Multi-model support
- Performance optimizations

## 💡 Wskazówki

- Używaj **draft PR** dla pracy w toku
- Linkuj issues: `Closes #123`, `Fixes #123`, `Relates to #123`
- Dodawaj screenshoty/logi dla bugów
- Aktualizuj dokumentację razem z kodem
- Testy muszą przejść przed merge

## 📚 Dokumentacja

- [README.md](./README.md) - Główna dokumentacja projektu
- [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md) - CI/CD i workflows
- [HUSKY.md](./HUSKY.md) - Git hooks
- [GROQ_SETUP.md](./GROQ_SETUP.md) - Konfiguracja Groq
- [DEPENDABOT.md](./DEPENDABOT.md) - Zarządzanie zależnościami

---

**🚀 Happy automating with AI!**
