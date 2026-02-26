import { Page } from '@playwright/test';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

// typ dla uproszczonego stubu używanego przy testach Dependabot
export type OllamaStub = {
  chat: {
    completions: {
      create: (
        opts: Record<string, unknown>,
      ) => Promise<{ choices: { message: { content: string } }[] }>;
    };
  };
};

/**
 * AIHelper - wrapper dla lokalnego LLM (Ollama) do automatyzacji UI
 * Loguje wszystkie prompty wysyłane do modelu dla celów debugowania
 */
export class AIHelper {
  private page: Page;
  // klient OpenAI (lub stub używany w testach dependabot)
  private client: OpenAI | OllamaStub;
  private logFile: string;

  constructor(page: Page) {
    this.page = page;

    // Konfiguracja klienta OpenAI dla Ollama
    if (process.env.GITHUB_ACTOR && process.env.GITHUB_ACTOR.includes('dependabot')) {
      // W środowisku Dependabot tests nie mają dostępu do sekretów — użyj stub'a, aby uniknąć 401
      this.client = {
        chat: {
          completions: {
            create: async (_opts: { [key: string]: unknown }) => ({
              choices: [{ message: { content: '' } }],
            }),
          },
        },
      };
    } else {
      this.client = new OpenAI({
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
        apiKey: process.env.OLLAMA_API_KEY || 'ollama',
      });
    }

    // Utwórz katalog dla logów jeśli nie istnieje
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Plik logu z timestampem
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `ai-prompts-${timestamp}.log`);
  }

  /**
   * Loguje prompt wysłany do AI wraz z kontekstem
   */
  logPrompt(action: string, context?: unknown) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      context,
      url: this.page.url(),
    };

    const logLine = `[${timestamp}] ${action}\n${JSON.stringify(logEntry, null, 2)}\n\n`;

    fs.appendFileSync(this.logFile, logLine);
    console.log(`📝 AI Log: ${action}`);
  }

  /**
   * Czyści odpowiedź AI z markdown code blocks i nadmiarowych znaków
   */
  private cleanSelector(selector: string): string {
    // Usuń markdown code blocks (```css ... ``` lub ``` ... ```)
    let cleaned = selector.replace(/```(?:css|html|javascript|)?\s*/g, '').replace(/```\s*/g, '');

    // Usuń komentarze CSS
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

    // Usuń nawiasy klamrowe i zawartość (reguły CSS)
    cleaned = cleaned.replace(/\{[\s\S]*?\}/g, '');

    // Weź tylko pierwszą linię (selector), usuń resztę
    cleaned = cleaned.split('\n')[0].trim();

    // Usuń średniki na końcu
    cleaned = cleaned.replace(/;+$/, '');

    // Usuń przypadkowe spacje wokół dwukropków (np. ": nth-child" -> ":nth-child")
    cleaned = cleaned.replace(/\s*:\s*/g, ':');

    return cleaned.trim();
  }

  /**
   * Znajdź element używając AI i kliknij go
   */
  async click(description: string): Promise<void> {
    this.logPrompt(`AI Click: ${description}`, { description });

    try {
      // Pobierz HTML strony dla kontekstu
      const pageContent = await this.page.content();

      // Wysłanie zapytania do lokalnego LLM
      const prompt = `Find a UNIQUE CSS selector for a CLICKABLE element: "${description}". 
      Page HTML structure: ${this.simplifyHtml(pageContent)}
      
      For buttons: Look for <button> tags, prefer [data-test="add-to-cart"] or button text content.
      For "first": Select the FIRST matching element in DOM order, use :first-child or :nth-child(1).
      For "add to cart button": Look for <button> with text "Add to cart", NOT menu buttons.
      Prefer [data-test="..."] attributes on clickable elements like buttons, links.
      Return ONLY the CSS selector, nothing else. NO markdown, NO code blocks.`;

      const response = await this.client.chat.completions.create({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        messages: [
          {
            role: 'system',
            content:
              'You are a CSS selector generator for clickable elements. Return ONLY a plain CSS selector, NO markdown code blocks, NO explanations. Distinguish between different button types (menu buttons vs action buttons). For "first add to cart", find the first button with "Add to cart" text in product list. Use button[data-test="add-to-cart"] or .inventory_item button patterns.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0'),
        max_tokens: 100,
      });

      const rawSelector = response.choices[0]?.message?.content?.trim() || '';
      const selector = this.cleanSelector(rawSelector);
      this.logPrompt('AI Response (click)', {
        rawSelector,
        cleanedSelector: selector,
        description,
      });

      if (!selector) {
        throw new Error(`AI could not find selector for: ${description}`);
      }

      // Wybierz locator
      let locator = this.page.locator(selector);
      const count = await locator.count();

      if (count === 0) {
        // Fallback: użyj getByRole lub innych strategii
        this.logPrompt('Selector not found, trying fallback strategies', { selector, description });

        if (description.toLowerCase().includes('button')) {
          // Fallback dla przycisków
          const buttonText = description
            .replace(/^(first|second|last|)\s*/i, '')
            .replace(/\s*button$/i, '')
            .trim();
          this.logPrompt('Trying getByRole button', { buttonText });
          locator = this.page.getByRole('button', { name: new RegExp(buttonText, 'i') });

          if (description.toLowerCase().includes('first')) {
            locator = locator.first();
          }
        } else if (
          description.toLowerCase().includes('cart') ||
          description.toLowerCase().includes('icon')
        ) {
          // Fallback dla ikon/linków koszyka
          this.logPrompt('Trying cart/icon fallback');
          locator = this.page
            .locator('.shopping_cart_link, [data-test="shopping-cart-link"], a.shopping_cart_link')
            .first();
        } else if (description.toLowerCase().includes('link')) {
          // Fallback dla linków
          const linkText = description
            .replace(/^(first|second|last|)\s*/i, '')
            .replace(/\s*(link|icon)$/i, '')
            .trim();
          this.logPrompt('Trying getByRole link', { linkText });
          locator = this.page.getByRole('link', { name: new RegExp(linkText, 'i') });

          if (description.toLowerCase().includes('first')) {
            locator = locator.first();
          }
        } else {
          // Ostatnia deska ratunku - szukaj po tekście
          this.logPrompt('Trying text-based fallback');
          const text = description.replace(/^(first|second|last|)\s*/i, '').trim();
          locator = this.page.getByText(new RegExp(text, 'i'));

          if (description.toLowerCase().includes('first')) {
            locator = locator.first();
          }
        }

        // Sprawdź czy fallback znalazł coś
        const fallbackCount = await locator.count();
        if (fallbackCount === 0) {
          throw new Error(`Selector ${selector} not found and fallback strategies failed`);
        }
      } else if (count > 1) {
        this.logPrompt('Multiple elements found, using .first()', { selector, count });
        locator = locator.first();
      }

      await locator.click({ timeout: 30000 });
      this.logPrompt('Click successful', { selector });
    } catch (error) {
      this.logPrompt('Click failed', { description, error: String(error) });
      throw error;
    }
  }

  /**
   * Wypełnij pole formularza używając AI
   */
  async fill(description: string, value: string): Promise<void> {
    this.logPrompt(`AI Fill: ${description} = ${value}`, { description, value });

    try {
      const pageContent = await this.page.content();

      const prompt = `Find a UNIQUE CSS selector for an INPUT element: "${description}". 
      Page HTML structure: ${this.simplifyHtml(pageContent)}
      
      Must select <input>, <textarea>, or <select> element directly, NOT wrapper divs.
      Prefer [data-test="..."] attributes on the input element itself.
      Return ONLY the CSS selector, nothing else. NO markdown, NO code blocks.`;

      const response = await this.client.chat.completions.create({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        messages: [
          {
            role: 'system',
            content:
              'You are a CSS selector generator for form inputs. Return ONLY a plain CSS selector, NO markdown code blocks, NO explanations. Return selector pointing to <input>, <textarea> or <select> elements directly, never to wrapper divs. Look for input elements with data-test attributes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0'),
        max_tokens: 100,
      });

      const rawSelector = response.choices[0]?.message?.content?.trim() || '';
      const selector = this.cleanSelector(rawSelector);
      this.logPrompt('AI Response (fill)', { rawSelector, cleanedSelector: selector, description });
      this.logPrompt('AI Response', { selector, description });

      if (!selector) {
        throw new Error(`AI could not find selector for: ${description}`);
      }

      // Wybierz locator
      let locator = this.page.locator(selector);
      const count = await locator.count();

      if (count > 1) {
        this.logPrompt('Multiple elements found, using .first()', { selector, count });
        locator = locator.first();
      }

      // Sprawdź czy to edytowalny element - jeśli nie, szukaj input w środku
      try {
        const tagName = await locator.evaluate(el => el.tagName.toLowerCase());

        if (!['input', 'textarea', 'select'].includes(tagName)) {
          this.logPrompt('Not an input element, searching for input inside', { selector, tagName });
          const inputLocator = locator.locator('input, textarea, select').first();
          const inputCount = await inputLocator.count();

          if (inputCount > 0) {
            locator = inputLocator;
            const newSelector = await locator.evaluate(el =>
              el.getAttribute('data-test') ? `[data-test="${el.getAttribute('data-test')}"]` : '',
            );
            this.logPrompt('Found input inside wrapper', { oldSelector: selector, newSelector });
          } else {
            throw new Error(`No input found inside ${selector}`);
          }
        }
      } catch (evalError) {
        this.logPrompt('Element check failed, trying direct fill', { error: String(evalError) });
      }

      await locator.fill(value, { timeout: 30000 });
      this.logPrompt('Fill successful', { selector, value });
    } catch (error) {
      this.logPrompt('Fill failed', { description, value, error: String(error) });
      throw error;
    }
  }

  /**
   * Wybierz opcję z elementu <select> używając AI
   */
  async selectDropdown(description: string, option: string): Promise<void> {
    this.logPrompt(`AI SelectDropdown: ${description} -> ${option}`, { description, option });

    try {
      const pageContent = await this.page.content();

      const prompt = `Find a UNIQUE CSS selector for a DROPDOWN (<select>) element: "${description}". 
      Page HTML structure: ${this.simplifyHtml(pageContent)}
      
      Must select the <select> element itself, not its wrapper. Return ONLY the CSS selector, nothing else. NO markdown, NO code blocks.`;

      const response = await this.client.chat.completions.create({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        messages: [
          {
            role: 'system',
            content:
              'You are a CSS selector generator for <select> dropdown elements. Return ONLY a plain CSS selector, NO markdown code blocks, NO explanations. Prefer [data-test="..."] or unique ids. For the Saucedemo inventory page specifically, the sort dropdown has class "product_sort_container" so selectors like ".product_sort_container" or "select.product_sort_container" are ideal. If description mentions "dropdown" or "sort" look for a <select> tag.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0'),
        max_tokens: 100,
      });

      const rawSelector = response.choices[0]?.message?.content?.trim() || '';
      const selector = this.cleanSelector(rawSelector);
      this.logPrompt('AI Response (selectDropdown)', {
        rawSelector,
        cleanedSelector: selector,
        description,
        option,
      });

      if (!selector) {
        throw new Error(`AI could not find selector for dropdown: ${description}`);
      }

      let locator = this.page.locator(selector);
      const count = await locator.count();

      if (count === 0) {
        // fallback: try accessible combobox by name
        this.logPrompt('Selector not found, trying dropdown fallback', { selector, description });
        locator = this.page.getByRole('combobox', { name: new RegExp(description, 'i') });
        let fallbackCount = await locator.count();

        // if still nothing, look for known container or any select
        if (fallbackCount === 0) {
          locator = this.page.locator(
            'select.product_sort_container, .product_sort_container select, select',
          );
          fallbackCount = await locator.count();
        }

        if (fallbackCount === 0) {
          throw new Error(`Dropdown selector ${selector} not found and fallback failed`);
        }
      } else if (count > 1) {
        this.logPrompt('Multiple dropdowns found, using .first()', { selector, count });
        locator = locator.first();
      }

      // attempt selection by label then by value
      try {
        await locator.selectOption({ label: option });
      } catch (e1) {
        try {
          await locator.selectOption({ value: option });
        } catch (e2) {
          this.logPrompt('Dropdown selectOption error', { error1: String(e1), error2: String(e2) });
          throw e2;
        }
      }

      this.logPrompt('SelectDropdown successful', { selector, option });
    } catch (error) {
      this.logPrompt('SelectDropdown failed', { description, option, error: String(error) });
      throw error;
    }
  }

  /**
   * Weryfikuj obecność elementu używając AI
   */
  async verify(description: string): Promise<boolean> {
    this.logPrompt(`AI Verify: ${description}`, { description });

    try {
      const pageContent = await this.page.content();

      const prompt = `Find a UNIQUE CSS selector for: "${description}". 
      Page HTML structure: ${this.simplifyHtml(pageContent)}
      
      Prefer data-test attributes, unique IDs, or use :nth-child() for uniqueness.
      Return ONLY the CSS selector, nothing else. NO markdown, NO code blocks.`;

      const response = await this.client.chat.completions.create({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        messages: [
          {
            role: 'system',
            content:
              'You are a precise CSS selector generator. Return ONLY a plain CSS selector, NO markdown code blocks, NO explanations. Always return a UNIQUE selector that matches only one element. Prefer [data-test="..."] attributes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0'),
        max_tokens: 100,
      });

      const rawSelector = response.choices[0]?.message?.content?.trim() || '';
      const selector = this.cleanSelector(rawSelector);
      this.logPrompt('AI Response (verify)', {
        rawSelector,
        cleanedSelector: selector,
        description,
      });
      this.logPrompt('AI Response', { selector, description });

      if (!selector) {
        return false;
      }

      // Fallback: jeśli selektor znajduje >1 element, użyj .first()
      const count = await this.page.locator(selector).count();
      let isVisible: boolean;

      if (count > 1) {
        this.logPrompt('Multiple elements found, using .first()', { selector, count });
        isVisible = await this.page.locator(selector).first().isVisible({ timeout: 10000 });
      } else {
        isVisible = await this.page.locator(selector).isVisible({ timeout: 10000 });
      }

      this.logPrompt('Verify result', { selector, isVisible });

      return isVisible;
    } catch (error) {
      this.logPrompt('Verify failed', { description, error: String(error) });
      return false;
    }
  }

  /**
   * Upraszcza HTML do podstawowej struktury dla zmniejszenia tokenu
   */
  private simplifyHtml(html: string): string {
    // Usuń style, skrypty i komentarze z użyciem parsera HTML,
    // aby poprawnie obsłużyć różne formy znaczników kończących.
    try {
      const dom = new JSDOM(html);
      const { document } = dom.window;

      // Usuń wszystkie elementy <script> i <style>
      document.querySelectorAll('script, style').forEach(el => el.remove());

      // Zserializuj z powrotem do HTML
      let simplified = dom.serialize();

      // Usuń znaczniki HTML poprzez usunięcie znaków `<` i `>`
      simplified = simplified.replace(/[<>]/g, ' ');

      // Zredukuj białe znaki
      simplified = simplified.replace(/\s+/g, ' ').trim();

      // Ogranicz długość do 4000 znaków (zachowaj miejsce na prompt)
      if (simplified.length > 4000) {
        simplified = simplified.substring(0, 4000) + '...';
      }

      return simplified;
    } catch (e) {
      void e;
      // W razie problemów z parserem, zastosuj uproszczone czyszczenie
      let simplified = html;
      let previous = '';

      do {
        previous = simplified;

        simplified = simplified
          // Usuń komentarze HTML.
          .replace(/<!--[\s\S]*?-->/g, '')
          // Usuń wszystkie nawiasy ostre, aby uniemożliwić tworzenie znaczników.
          .replace(/[<>]/g, ' ')
          // Zredukuj białe znaki
          .replace(/\s+/g, ' ');
      } while (simplified !== previous);

      // Upewnij się, że żadne pozostałe delimitery komentarzy nie zostaną w tekście.
      let prevComments = '';
      do {
        prevComments = simplified;
        simplified = simplified.replace(/<!--/g, ' ').replace(/--!?>/g, ' ');
      } while (simplified !== prevComments);

      // Ostatecznie usuń wszelkie pozostałe fragmenty <script>/<style> oraz znaczniki HTML
      simplified = simplified
        // dodatkowe zabezpieczenie przed pozostałościami nazw tagów
        .replace(/script\b/gi, ' ')
        .replace(/style\b/gi, ' ')
        .replace(/[<>]/g, ' ');
      // Ponownie zredukuj białe znaki po ostatecznym czyszczeniu
      simplified = simplified.replace(/\s+/g, ' ').trim();

      // Ogranicz długość do 4000 znaków (zachowaj miejsce na prompt)
      if (simplified.length > 4000) {
        simplified = simplified.substring(0, 4000) + '...';
      }

      return simplified;
    }
  }
}
