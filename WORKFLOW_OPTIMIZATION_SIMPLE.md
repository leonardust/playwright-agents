# Plan Optymalizacji Workflows - Commit po Commicie

## Baseline (stan obecny)

- **playwright-tests.yml**: 62s ✅ (z Groq działa świetnie!)
- **self-hosted-tests.yml**: 127s

---

## COMMIT 1: Concurrency control

**Co:** Anuluj stare runy przy nowym pushu  
**Plik:** `.github/workflows/playwright-tests.yml` + `self-hosted-tests.yml`

```yaml
# Dodaj na początku każdego workflow (po 'name:'):
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Test:** Push 2 commity szybko → pierwszy anulowany  
**Rollback:** Usuń te 3 linie

---

## COMMIT 2: Cache Playwright browsers

**Co:** -10-15s na instalacji przeglądarki  
**Plik:** `.github/workflows/playwright-tests.yml`

```yaml
# Przed "Install Playwright Browsers":
- name: Cache Playwright Browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

# Zmień "Install Playwright Browsers":
- name: Install Playwright Browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install chromium --with-deps
```

**Test:** Run 1 = slow, Run 2 = fast, smoke test działa  
**Rollback:** Usuń cache step, usuń `if:` z install

---

## COMMIT 3: Połącz artifacts

**Co:** -5s na uploadzie, czytelniej  
**Plik:** `.github/workflows/playwright-tests.yml`

```yaml
# Zastąp 2 osobne "Upload" steps jednym:
- name: Upload test artifacts
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report-${{ github.run_number }}
    path: |
      playwright-report/
      logs/
    retention-days: 7
```

**Zmień też w deploy:**

```yaml
artifact-name: playwright-report-${{ github.run_number }} # było: playwright-report
```

**Test:** Pobierz artifact, sprawdź że oba foldery są w środku  
**Rollback:** Przywróć 2 osobne uploads

---

## COMMIT 4: Usuń continue-on-error

**Co:** Workflow pokaże prawdziwy status testów  
**Plik:** `.github/workflows/playwright-tests.yml`

```yaml
# Usuń linię:
- name: Run smoke tests
  run: npm run test:smoke
  # continue-on-error: true  <- USUŃ TO
```

**Test:** Jak test failuje → workflow = failed, ale artifacts są  
**Rollback:** Dodaj z powrotem `continue-on-error: true`

---

## COMMIT 5: Cache node_modules (self-hosted)

**Co:** -5-8s na npm ci  
**Plik:** `.github/workflows/self-hosted-tests.yml`

```yaml
# Przed "Install dependencies":
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
# Pozostaw npm ci bez zmian
```

**Test:** Run 1 = slow, Run 2 = fast, testy działają  
**Rollback:** Usuń cache step

---

## COMMIT 6: Połącz artifacts (self-hosted)

**Co:** To samo co COMMIT 3 ale dla self-hosted  
**Plik:** `.github/workflows/self-hosted-tests.yml`

**Test:** To samo co COMMIT 3  
**Rollback:** Przywróć 2 osobne uploads

---

## Harmonogram

| Commit | Czas   | Test   | Spodziewany efekt   |
| ------ | ------ | ------ | ------------------- |
| 1      | 5 min  | 2 runs | Anulowanie działa   |
| 2      | 10 min | 3 runs | -10-15s             |
| 3      | 10 min | 2 runs | -5s                 |
| 4      | 5 min  | 2 runs | Lepszy feedback     |
| 5      | 10 min | 3 runs | -5-8s (self-hosted) |
| 6      | 10 min | 2 runs | -5s (self-hosted)   |

**Total:** ~1 godzina

**Wynik końcowy:**

- playwright-tests: **~40-45s** (było 62s) = -27% ✅
- self-hosted: **~110-115s** (było 127s) = -10% ✅

---

## Gotowy do startu?

Powiedz "start" to zaczynam od COMMIT 1 → implementuję → testuję → następny 🚀
