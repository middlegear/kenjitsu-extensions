import { BaseClass } from '../../models/base.js';
import type { IBase, IResponse } from '../../types/base.js';


class Cinemeta extends BaseClass {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://v3-cinemeta.strem.io') {
    super();
    this.baseUrl = baseUrl;
  }

  private async search(query: string, format: string): Promise<IResponse<IBase[] | []>> {
    try {
      const mediaType = format.toLowerCase() === 'movie' ? 'movie' : 'series';

      const response = await this.client.fetch(
        `${this.baseUrl}/catalog/${mediaType}/top/search=${encodeURIComponent(query)}.json`,
        {
          method: 'GET',
        },
      );

      if (!response.ok) {
        return {
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }

      const result = await response.json();
      const data = (result.metas ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
        imdbId: item.imdb_id,
        posterImage: item.poster,
        coverImage: item.background,
        type: item.type,
        releaseDate: item.releaseInfo,
      }));

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
        status: 500,
      };
    }
  }


}

export { Cinemeta };
