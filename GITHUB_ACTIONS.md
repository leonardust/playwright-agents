# GitHub Actions z Ollama - Przewodnik

## 📋 Spis treści

- [🎯 Możliwości użycia Ollama w GitHub Actions](#-możliwości-użycia-ollama-w-github-actions)
  - [✅ Opcja 1: Self-Hosted Runner (Zalecane)](#-opcja-1-self-hosted-runner-zalecane)
  - [⚡ Opcja 2: GitHub-Hosted Runner z małym modelem](#-opcja-2-github-hosted-runner-z-małym-modelem)
  - [🌐 Opcja 3: Zewnętrzny serwis Ollama + Tunel](#-opcja-3-zewnętrzny-serwis-ollama--tunel)
  - [💡 Opcja 4: OpenAI API dla CI (Fallback)](#-opcja-4-openai-api-dla-ci-fallback)
- [📊 Porównanie opcji](#-porównanie-opcji)
- [🚀 Najlepsza praktyka](#-najlepsza-praktyka)
- [📝 Workflow Files](#-workflow-files)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🎯 Możliwości użycia Ollama w GitHub Actions

### ✅ Opcja 1: Self-Hosted Runner (Zalecane)

**Zalety:**

- Pełna kontrola nad zasobami
- Możliwość użycia GPU
- Szybkie działanie z dużymi modelami
- Brak limitów czasowych GitHub
- Najlepsza wydajność

**Kroki konfiguracji:**

1. **Zainstaluj GitHub Actions Runner na swoim komputerze:**

   ```bash
   # Pobierz runner
   mkdir actions-runner && cd actions-runner

   # Linux/macOS
   curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
   tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

   # Windows PowerShell
   Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip -OutFile actions-runner-win-x64-2.311.0.zip
   Expand-Archive -Path ./actions-runner-win-x64-2.311.0.zip -DestinationPath .
   ```

2. **Konfiguruj runner:**

   ```bash
   # Przejdź do Settings → Actions → Runners → New self-hosted runner
   # Skopiuj token i uruchom:
   ./config.sh --url https://github.com/TWOJE_KONTO/REPO --token TWOJ_TOKEN

   # Uruchom runner
   ./run.sh
   ```

3. **Upewnij się że Ollama działa:**

   ```bash
   ollama serve  # W osobnym terminalu
   ollama pull llama3.2-vision:latest
   ```

4. **Użyj workflow:** `.github/workflows/self-hosted-tests.yml`

---

### ⚡ Opcja 2: GitHub-Hosted Runner z małym modelem

**Zalety:**

- Nie wymaga konfiguracji runnera
- Bezpłatne dla publicznych repozytoriów
- Automatyczne zarządzanie

**Wady:**

- Ograniczone zasoby (2 CPU, 7GB RAM)
- Brak GPU (wolne działanie CPU)
- Tylko małe modele (phi3:mini, tinyllama)
- Timeout 6h dla job

**Kroki:**

1. **Użyj workflow:** `.github/workflows/playwright-tests.yml`

2. **Dostosuj timeout w playwright.config.ts dla CI:**

   ```typescript
   timeout: process.env.CI ? 180000 : 90000,  // 3 min dla CI
   ```

3. **Użyj małego modelu w .env CI:**

   ```bash
   OLLAMA_MODEL=phi3:mini  # ~2.3GB, szybszy niż llama3
   ```

**Ograniczenia:**

- Testy mogą być 3-5x wolniejsze niż lokalnie
- Użyj tylko tagów `@smoke` dla CI
- Rozważ zmniejszenie timeoutów

---

### 🌐 Opcja 3: Zewnętrzny serwis Ollama + Tunel

**Scenariusz:** Ollama działa na twoim serwerze/komputerze, GitHub Actions łączy się przez tunel.

**Kroki:**

1. **Uruchom Ollama z ekspozycją na zewnątrz:**

   ```bash
   # Linux/macOS
   OLLAMA_HOST=0.0.0.0:11434 ollama serve

   # Windows PowerShell
   $env:OLLAMA_HOST="0.0.0.0:11434"
   ollama serve
   ```

2. **Ustaw tunel (ngrok lub cloudflare tunnel):**

   ```bash
   # ngrok
   ngrok http 11434

   # lub cloudflare tunnel
   cloudflared tunnel --url http://localhost:11434
   ```

3. **Dodaj URL tunelu do GitHub Secrets:**
   - Settings → Secrets → Actions → New repository secret
   - Nazwa: `OLLAMA_BASE_URL`
   - Wartość: `https://your-tunnel-url.ngrok.io/v1`

4. **Zaktualizuj workflow:**

   ```yaml
   - name: Update .env for CI
     run: |
       echo "OLLAMA_BASE_URL=${{ secrets.OLLAMA_BASE_URL }}" > .env
       echo "OLLAMA_API_KEY=ollama" >> .env
       echo "OLLAMA_MODEL=llama3.2-vision:latest" >> .env
   ```

**Uwaga:** Bezpieczeństwo! Używaj tylko w prywatnych repozytoriach lub dodaj autentykację.

---

### 💡 Opcja 4: OpenAI API dla CI (Fallback)

Jeśli Ollama jest zbyt wolna dla CI, użyj OpenAI API tylko w środowisku CI:

1. **Dodaj OpenAI API key do GitHub Secrets:**
   - `OPENAI_API_KEY`

2. **Zaktualizuj AIHelper aby obsługiwał oba API:**

   ```typescript
   constructor(page: Page) {
     this.page = page;

     const isCI = process.env.CI === 'true';
     const baseURL = isCI
       ? 'https://api.openai.com/v1'  // OpenAI dla CI
       : process.env.OLLAMA_BASE_URL;  // Ollama lokalnie

     const apiKey = isCI
       ? process.env.OPENAI_API_KEY
       : process.env.OLLAMA_API_KEY;

     this.client = new OpenAI({ baseURL, apiKey });
   }
   ```

3. **Workflow z OpenAI:**

   ```yaml
   - name: Update .env for CI
     run: |
       echo "OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}" > .env
       echo "CI=true" >> .env
   ```

---

## 📊 Porównanie opcji

| Opcja                      | Szybkość   | Koszty      | Złożoność | Zalecane dla  |
| -------------------------- | ---------- | ----------- | --------- | ------------- |
| Self-hosted                | ⭐⭐⭐⭐⭐ | Bezpłatne   | ⭐⭐⭐    | Produkcja     |
| GitHub-hosted + mały model | ⭐⭐       | Bezpłatne\* | ⭐        | Smoke tests   |
| Tunel                      | ⭐⭐⭐⭐   | Bezpłatne   | ⭐⭐⭐⭐  | Tymczasowe    |
| OpenAI API                 | ⭐⭐⭐⭐⭐ | ~$0.01/test | ⭐        | CI/CD szybkie |

\*Bezpłatne dla publicznych repo, 2000 min/miesiąc dla prywatnych

---

## 🚀 Najlepsza praktyka

**Rekomendacja dla projektu:**

1. **Lokalnie:** Ollama z llama3.2-vision:latest
2. **CI/CD:** Self-hosted runner z Ollama (jeśli możliwe)
3. **Backup CI:** GitHub-hosted + phi3:mini tylko dla `@smoke` testów
4. **Produkcja:** OpenAI API (szybsze, bardziej stabilne)

---

## 📝 Workflow Files

Projekt zawiera 2 gotowe workflows:

- `.github/workflows/playwright-tests.yml` - GitHub-hosted runner
- `.github/workflows/self-hosted-tests.yml` - Self-hosted runner

Wybierz odpowiedni dla swoich potrzeb lub użyj obu!

---

## 🔧 Troubleshooting

### Problem: Ollama nie startuje w CI

```bash
# Dodaj więcej czasu na uruchomienie
sleep 10  # zamiast sleep 5
```

### Problem: Model za duży

```bash
# Użyj mniejszego modelu
ollama pull tinyllama  # tylko 637MB
```

### Problem: Timeout testów

```bash
# Zwiększ timeouty w playwright.config.ts
timeout: 180000,  // 3 minuty
```

### Problem: Brak pamięci

```bash
# Użyj self-hosted runner z więcej RAM
# lub zmniejsz num_ctx
OLLAMA_NUM_CTX=4096  # zamiast 8192
```
