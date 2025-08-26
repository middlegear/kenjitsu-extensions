import { FetchClient } from '../config/client.js';

export abstract class BaseClass {
  protected readonly client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }
}
