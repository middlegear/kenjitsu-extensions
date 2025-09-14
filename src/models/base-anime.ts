import { FetchClient } from '../config/client.js';

export abstract class BaseClass {
  protected readonly client: FetchClient;

  protected constructor() {
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
}
