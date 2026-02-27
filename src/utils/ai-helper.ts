import { Page } from '@playwright/test';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

/**
 * AIHelper - wrapper for a local LLM (Ollama) used for UI automation
 * Logs all prompts sent to the model for debugging purposes
 */
export class AIHelper {
  private page: Page;
  private client: OpenAI;
  private logFile: string;

  constructor(page: Page) {
    this.page = page;

    // Configure OpenAI client for Ollama. We assume each workflow
    // (including Dependabot) will provide the required environment variables.
    // If the model is unreachable, heuristics will be used as a fallback.
    this.client = new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      apiKey: process.env.OLLAMA_API_KEY || 'ollama',
    });

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Log filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `ai-prompts-${timestamp}.log`);
  }

  /**
   * Log a prompt sent to the AI along with context
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
   * Clean AI response from markdown code blocks and extraneous characters
   */
  private cleanSelector(selector: string): string {
    // Remove markdown code blocks (```css ... ``` or ``` ... ```)
    let cleaned = selector.replace(/```(?:css|html|javascript|)?\s*/g, '').replace(/```\s*/g, '');

    // Remove CSS comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove curly braces and their contents (CSS rules)
    cleaned = cleaned.replace(/\{[\s\S]*?\}/g, '');

    // Take only the first line (selector), discard the rest
    cleaned = cleaned.split('\n')[0].trim();

    // Remove trailing semicolons
    cleaned = cleaned.replace(/;+$/, '');

    // Remove accidental spaces around colons (e.g. ": nth-child" -> ":nth-child")
    cleaned = cleaned.replace(/\s*:\s*/g, ':');

    return cleaned.trim();
  }

  /**
   * Find an element using AI and click it
   */
  /**
   * Simple heuristics without AI — useful as a safe fallback,
   * used when the model returns an empty selector or when the model
   * is not available. Heuristics work independently of the model's availability.
   */
  private heuristicSelector(description: string): string | undefined {
    const desc = description.toLowerCase();
    if (desc.includes('username')) return 'input[data-test="username"]';
    if (desc.includes('password')) return 'input[data-test="password"]';
    if (desc.includes('login')) return 'input[data-test="login-button"]';
    if (desc.includes('add to cart')) {
      const base = '.inventory_item button[data-test^="add-to-cart"]';
      return desc.includes('first') ? `${base}:first-child` : base;
    }
    if (desc.includes('shopping cart')) return '.shopping_cart_link';
    if (desc.includes('dropdown')) return 'select';
    return undefined;
  }

  async click(description: string): Promise<void> {
    this.logPrompt(`AI Click: ${description}`, { description });

    try {
      // Try AI first, if available.
      let selector: string | undefined;
      try {
        const pageContent = await this.page.content();
        const prompt = `Find a UNIQUE CSS selector for a CLICKABLE element: "${description}". \n      Page HTML structure: ${this.simplifyHtml(pageContent)}\n      \n      For buttons: Look for <button> tags, prefer [data-test="add-to-cart"] or button text content.\n      For "first": Select the FIRST matching element in DOM order, use :first-child or :nth-child(1).\n      For "add to cart button": Look for <button> with text "Add to cart", NOT menu buttons.\n      Prefer [data-test="..."] attributes on clickable elements like buttons, links.\n      Return ONLY the CSS selector, nothing else. NO markdown, NO code blocks.`;

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
        selector = this.cleanSelector(rawSelector);
        this.logPrompt('AI Response (click)', {
          rawSelector,
          cleanedSelector: selector,
          description,
        });
      } catch (e) {
        // if the model call throws, leave selector undefined
        this.logPrompt('AI call failed, falling back', { error: String(e) });
      }

      // if AI does not provide a selector, use heuristics
      if (!selector) {
        selector = this.heuristicSelector(description);
        this.logPrompt('Heuristic selector used', { description, selector });
      }

      // Choose locator
      if (!selector) {
        throw new Error('No selector found for fill operation');
      }
      let locator = this.page.locator(selector);
      const count = await locator.count();

      if (count === 0) {
        // Fallback: use getByRole or other strategies
        this.logPrompt('Selector not found, trying fallback strategies', { selector, description });

        if (description.toLowerCase().includes('button')) {
          // Fallback for buttons
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
          // Fallback for cart icons/links
          this.logPrompt('Trying cart/icon fallback');
          locator = this.page
            .locator('.shopping_cart_link, [data-test="shopping-cart-link"], a.shopping_cart_link')
            .first();
        } else if (description.toLowerCase().includes('link')) {
          // Fallback for links
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
          // Last resort - search by text
          this.logPrompt('Trying text-based fallback');
          const text = description.replace(/^(first|second|last|)\s*/i, '').trim();
          locator = this.page.getByText(new RegExp(text, 'i'));

          if (description.toLowerCase().includes('first')) {
            locator = locator.first();
          }
        }

        // Check if fallback found anything
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
   * Fill a form field using AI
   */
  async fill(description: string, value: string): Promise<void> {
    this.logPrompt(`AI Fill: ${description} = ${value}`, { description, value });

    try {
      let selector: string | undefined;

      try {
        const pageContent = await this.page.content();

        const prompt = `Find a UNIQUE CSS selector for an INPUT element: "${description}". \n      Page HTML structure: ${this.simplifyHtml(pageContent)}\n      \n      Must select <input>, <textarea>, or <select> element directly, NOT wrapper divs.\n      Prefer [data-test="..."] attributes on the input element itself.\n      Return ONLY the CSS selector, nothing else. NO markdown, NO code blocks.`;

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
        selector = this.cleanSelector(rawSelector);
        this.logPrompt('AI Response (fill)', {
          rawSelector,
          cleanedSelector: selector,
          description,
        });
        this.logPrompt('AI Response', { selector, description });
      } catch (e) {
        this.logPrompt('AI call failed for fill', { error: String(e) });
      }

      if (!selector) {
        selector = this.heuristicSelector(description);
        this.logPrompt('Heuristic selector used for fill', { description, selector });
      }

      // Choose locator
      if (!selector) {
        throw new Error('No selector found for fill operation');
      }
      let locator = this.page.locator(selector);
      const count = await locator.count();

      if (count > 1) {
        this.logPrompt('Multiple elements found, using .first()', { selector, count });
        locator = locator.first();
      }

      // Check if this is an editable element - if not, search for an input inside
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
   * Select an option from a <select> element using AI
   */
  async selectDropdown(description: string, option: string): Promise<void> {
    this.logPrompt(`AI SelectDropdown: ${description} -> ${option}`, { description, option });

    try {
      let selector: string | undefined;

      try {
        const pageContent = await this.page.content();

        const prompt = `Find a UNIQUE CSS selector for a DROPDOWN (<select>) element: "${description}". \n      Page HTML structure: ${this.simplifyHtml(pageContent)}\n      \n      Must select the <select> element itself, not its wrapper. Return ONLY the CSS selector, nothing else. NO markdown, NO code blocks.`;

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
        selector = this.cleanSelector(rawSelector);
        this.logPrompt('AI Response (selectDropdown)', {
          rawSelector,
          cleanedSelector: selector,
          description,
          option,
        });
      } catch (e) {
        this.logPrompt('AI call failed for dropdown', { error: String(e) });
      }

      if (!selector) {
        selector = this.heuristicSelector(description) || 'select';
        this.logPrompt('Heuristic selector used for dropdown', { description, selector });
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
      let selector: string | undefined;

      try {
        const pageContent = await this.page.content();

        const prompt = `Find a UNIQUE CSS selector for: "${description}". \n      Page HTML structure: ${this.simplifyHtml(pageContent)}\n      \n      Prefer data-test attributes, unique IDs, or use :nth-child() for uniqueness.\n      Return ONLY the CSS selector, nothing else. NO markdown, NO code blocks.`;

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
        selector = this.cleanSelector(rawSelector);
        this.logPrompt('AI Response (verify)', {
          rawSelector,
          cleanedSelector: selector,
          description,
        });
        this.logPrompt('AI Response', { selector, description });
      } catch (e) {
        this.logPrompt('AI call failed for verify', { error: String(e) });
      }

      if (!selector) {
        selector = this.heuristicSelector(description);
        this.logPrompt('Heuristic selector used for verify', { description, selector });
        if (!selector) {
          return false;
        }
      }

      // Fallback: if selector matches >1 elements, use .first()
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
   * Simplify HTML to a basic structure to reduce token usage
   */
  private simplifyHtml(html: string): string {
    // Remove styles, scripts and comments using an HTML parser
    // to correctly handle different forms of closing tags.
    try {
      const dom = new JSDOM(html);
      const { document } = dom.window;

      // Remove all <script> and <style> elements
      document.querySelectorAll('script, style').forEach(el => el.remove());

      // Serialize back to HTML
      let simplified = dom.serialize();

      // Remove HTML angle brackets by replacing `<` and `>`
      simplified = simplified.replace(/[<>]/g, ' ');

      // Reduce whitespace
      simplified = simplified.replace(/\s+/g, ' ').trim();

      // Limit length to 4000 characters (leave room for prompt)
      if (simplified.length > 4000) {
        simplified = simplified.substring(0, 4000) + '...';
      }

      return simplified;
    } catch (e) {
      void e;
      // If the parser fails, apply a simplified cleaning routine
      let simplified = html;

      // Aggressively strip characters that can participate in HTML tags
      // or comment delimiters to avoid incomplete multi-character
      // sanitization issues (e.g., with "<!--" / "-->").
      simplified = simplified
        // Remove all angle brackets and common comment punctuation
        // so that sequences like "<!--" or "-->" cannot be formed.
        .replace(/[<>!-]/g, ' ')
        // additional guard against leftover tag names
        .replace(/script\b/gi, ' ')
        .replace(/style\b/gi, ' ');

      // Reduce whitespace and trim
      simplified = simplified.replace(/\s+/g, ' ').trim();

      // Limit length to 4000 characters (leave room for prompt)
      if (simplified.length > 4000) {
        simplified = simplified.substring(0, 4000) + '...';
      }

      return simplified;
    }
  }
}
