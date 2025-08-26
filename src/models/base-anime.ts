import { FetchClient } from '../config/client.js';

export abstract class BaseAnime {
  protected readonly client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }
}
