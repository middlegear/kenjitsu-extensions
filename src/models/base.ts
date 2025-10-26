import { FetchClient } from '../config/client.js';

export abstract class BaseClass {
  protected readonly client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }

  protected createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  protected normalizeKey(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  protected getMappedValue<T extends string, U extends string>(input: T, mapping: Record<string, U>): U {
    const normalized = this.normalizeKey(input);
    if (!(normalized in mapping)) {
      throw new Error(`Invalid: ${input}. Must be one of: ${Object.keys(mapping).join(', ')}`);
    }
    return mapping[normalized];
  }
}
