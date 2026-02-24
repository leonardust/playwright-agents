const apiKey = process.env.OLLAMA_API_KEY;
if (!apiKey || apiKey === 'ollama') {
  throw new Error('OLLAMA_API_KEY nie został ustawiony lub jest niepoprawny. Ustaw odpowiedni sekret.');
}
this.client = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: apiKey,
});
