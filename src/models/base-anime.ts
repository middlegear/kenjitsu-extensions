import { FetchClient } from '../config/client.js';

export abstract class BaseClass {
  protected readonly client: FetchClient;

  protected constructor() {
    this.client = new FetchClient();
  }
}
