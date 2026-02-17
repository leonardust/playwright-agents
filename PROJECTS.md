# 🎭 Playwright Agents - Project Management

## 📋 O Projekcie

Ten GitHub Project zarządza rozwojem frameworka **Playwright Agents** - zaawansowanego systemu automatyzacji testów wykorzystującego AI (Ollama/Groq) do inteligentnego wyszukiwania elementów UI.

## 🔗 Powiązane Zasoby

- **Repository**: [leonardust/playwright-agents](https://github.com/leonardust/playwright-agents)
- **GitHub Pages**: [Test Reports](https://leonardust.github.io/playwright-agents/)
- **CI/CD**: Self-hosted i GitHub-hosted workflows

## 📊 Struktura Projektu

### Kolumny Workflow

- **📝 Backlog** - Zaplanowane zadania do realizacji
- **🚧 In Progress** - Zadania w trakcie realizacji
- **👀 In Review** - Kod gotowy do przeglądu (PR otwarte)
- **✅ Done** - Ukończone i zmergowane zadania

## 🏷️ Etykiety

- `enhancement` - Nowe funkcjonalności
- `bug` - Błędy do naprawy
- `documentation` - Aktualizacje dokumentacji
- `ci/cd` - Zmiany w GitHub Actions
- `dependencies` - Aktualizacje zależności
- `ai` - Funkcjonalności związane z AI/LLM

## 🎯 Priorytety

Issues są priorytetyzowane według:
1. **Critical** 🔴 - Blokujące, wymagające natychmiastowej uwagi
2. **High** 🟠 - Ważne, do realizacji w najbliższym czasie
3. **Medium** 🟡 - Standardowy priorytet
4. **Low** 🟢 - Nice-to-have, do realizacji w przyszłości

## 🔄 Workflow

1. **Utworzenie Issue** → automatycznie trafia do Backlog
2. **Rozpoczęcie pracy** → przenieś do "In Progress"
3. **Otwarcie PR** → automatycznie przechodzi do "In Review"
4. **Merge PR** → automatycznie przenosi się do "Done"

## 🤝 Jak Współpracować

### Dodawanie nowego zadania
1. Utwórz issue w repozytorium
2. Dodaj odpowiednie etykiety
3. Przypisz do projektu
4. Ustaw priorytet

### Praca nad zadaniem
1. Przypisz issue do siebie
2. Przenieś do "In Progress"
3. Utwórz branch: `feat/nazwa-zadania` lub `fix/nazwa-zadania`
4. Commituj zgodnie z [Conventional Commits](https://www.conventionalcommits.org/)
5. Otwórz PR i dodaj link do issue

## 📈 Metryki

Projekt śledzi:
- ⏱️ Czas realizacji zadań (cycle time)
- 📊 Liczba otwartych vs zamkniętych issues
- 🔥 Burndown velocity
- 🎯 Postęp względem milestone'ów

## 🛠️ Automatyzacje

- **Auto-assignment**: Dependabot PRs automatycznie przypisane do maintainera
- **Auto-labeling**: PRy otrzymują etykiety na podstawie ścieżek plików
- **Status sync**: Status PR synchronizuje się z kartą w projekcie
- **Stale issues**: Nieaktywne issue starsze niż 60 dni otrzymują ostrzeżenie

## 📝 Milestones

Aktywne milestony:
- `v1.0` - Podstawowa funkcjonalność z Ollama
- `v1.1` - Integracja z Groq Cloud
- `v2.0` - Advanced AI features (context memory, self-healing)

## 💡 Wskazówki

- Używaj draft PR dla pracy w toku (work in progress)
- Linkuj issues w PR używając: `Closes #123` lub `Fixes #123`
- Dodawaj screenshoty/logi dla bugów
- Aktualizuj dokumentację razem z kodem

---

**🚀 Happy automating with AI!**
