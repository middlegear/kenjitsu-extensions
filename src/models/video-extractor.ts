import { FetchClient } from '../config/client.js';

abstract class VideoExtractor {
  protected client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }

  protected async parseM3u8(url: string) {
    try {
      const response = await this.client.get(url);
    } catch (error) {}
  }
}
