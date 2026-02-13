import { BaseClass } from '../../models/base.js';

export class MangaKakalot extends BaseClass {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://www.mangakakalot.gg') {
    super();
    this.baseUrl = baseUrl;
  }

  async search(query: string) {
    try {
      const response = await this.client.get(`${this.baseUrl}/home/search/json?searchword=${query}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${this.baseUrl}/`,
        },
      });

      return response.data;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }
}
