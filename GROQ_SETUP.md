# Groq API Setup for GitHub Actions

## Why Groq?

Groq provides ultra-fast LLM inference (~500 tokens/sec) with a generous free tier:

- **Model**: llama-3.1-8b-instant
- **Speed**: <1 second responses (vs 30-50s with local Ollama)
- **Free tier**: 30 requests/min, 14,400 requests/day
- **Cost**: $0 for our smoke tests

## Setup Instructions

### 1. Get Groq API Key

1. Go to https://console.groq.com
2. Sign up with GitHub account (free)
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Name it: `playwright-agents-ci`
6. Copy the key (starts with `gsk_...`)

### 2. Add to GitHub Secrets

1. Go to your repository: https://github.com/leonardust/playwright-agents
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GROQ_API_KEY`
5. Value: Paste your Groq API key
6. Click **Add secret**

### 3. Verify Setup

After adding the secret, the next GitHub Actions run will:

- Use Groq API instead of local Ollama
- Complete smoke tests in ~30-60 seconds (instead of timing out)
- Show successful selector generation in logs

## Configuration

Current workflow settings (`.github/workflows/playwright-tests.yml`):

```yaml
- name: Update .env for CI
  run: |
    echo "OLLAMA_BASE_URL=https://api.groq.com/openai/v1" > .env
    echo "OLLAMA_API_KEY=${{ secrets.GROQ_API_KEY }}" >> .env
    echo "OLLAMA_MODEL=llama-3.1-8b-instant" >> .env
```

## Local Development

Keep using your local Ollama setup (faster for development):

```env
# .env (local)
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_API_KEY=ollama
OLLAMA_MODEL=llama3.2-vision:latest
```

## Benefits

| Setup               | Model                | Speed         | Cost   | Best For       |
| ------------------- | -------------------- | ------------- | ------ | -------------- |
| **Local**           | llama3.2-vision      | Medium        | $0     | Development    |
| **GitHub + Groq**   | llama-3.1-8b-instant | Very Fast     | $0     | CI/CD          |
| ~~GitHub + Ollama~~ | ~~llama3.1:8b~~      | ~~Very Slow~~ | ~~$0~~ | ~~Deprecated~~ |

## Troubleshooting

### Error: "GROQ_API_KEY not found"

- Verify secret name is exactly `GROQ_API_KEY` (case-sensitive)
- Check secret is in Repository secrets (not Environment secrets)

### Error: "Rate limit exceeded"

- Free tier: 30 requests/min
- Smoke tests use ~6-10 requests per run
- Should not hit limit with normal usage

### Error: "Invalid API key"

- Regenerate API key at https://console.groq.com
- Update GitHub secret with new key

## Alternative: Self-hosted Runner

If you want to keep using local Ollama:

- Use `self-hosted-tests.yml` workflow instead
- Runs on your local machine with your Ollama setup
- See `HUSKY.md` for self-hosted runner setup

## API Usage Monitoring

Check your usage at: https://console.groq.com/usage

- Requests per day
- Tokens consumed
- Rate limit status

## References

- Groq Documentation: https://console.groq.com/docs
- Groq Pricing: https://groq.com/pricing (free tier details)
- OpenAI API compatibility: https://console.groq.com/docs/openai
