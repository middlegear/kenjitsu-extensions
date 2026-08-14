import { BaseClass } from '../../models/base.js';
import type { IBase, IResponse } from '../../types/base.js';

interface ICinemetaEpisode {
  id: string;
  title: string;
  airDate: string;
  seasonNumber: number | null;
  episodeNumber: number | null;
  relativeNumber?: number | null;
  thumbnail: string;
  summary: string;
  rating: string;
}

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

  private async fetchMediaInfo(id: string, format: string) {
    try {
      const mediaType = format.toLowerCase() === 'movie' ? 'movie' : 'series';

      const response = await this.client.fetch(`${this.baseUrl}/meta/${mediaType}/${id}.json`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          data: null,
          providerEpisodes: [],
          error: response.statusText,
          status: response.status,
        };
      }

      const result = await response.json();

      const info = {
        id: result.meta.id,
        name: result.meta.name,
        posterImage: result.meta.poster,
        releaseDate: result.meta.released,
        imdbId: result.meta.imdb_id,
        tmdbId: result.meta.moviedb_id,
        tvdbId: result.meta.tvdb_id,
        logo: result.meta.logo,
        coverImage: result.meta.background,
        year: result.meta.year,
      };
  
      const rawVideos: any[] =
        Array.isArray(result.meta.videos) && result.meta.videos.length > 0
          ? result.meta.videos
          : mediaType === 'movie'
            ? [
                {
                  name: result.meta.name,
                  released: result.meta.released,
                  season: 1,
                  number: 1,
                  thumbnail: result.meta.poster ?? result.meta.background,
                  id: result.meta.id,
                  description: result.meta.description,
                  overview: result.meta.overview,
                  rating: result.meta.imdbRating,
                },
              ]
            : [];

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const episodes: ICinemetaEpisode[] = rawVideos
        .map((item: any): ICinemetaEpisode => ({
          title: item.name,
          airDate: item.released || item.firstAired || '',
          seasonNumber: item.season != null ? Number(item.season) : null,
          episodeNumber: item.number != null ? Number(item.number) : null,
          relativeNumber: item.relativeNumber != null ? Number(item.relativeNumber) : null,
          thumbnail: item.thumbnail,
          id: item.id,
          summary: item.description || item.overview || '',
          rating: item.rating,
        }))
        .filter(episode => {
          if (!episode.airDate) {
            return false;
          }

          const airDate = new Date(episode.airDate);

          if (Number.isNaN(airDate.getTime())) {
            return false;
          }

          return airDate <= today;
        });

      return {
        data: info,
        providerEpisodes: episodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: null,
        providerEpisodes: [],
        status: 500,
      };
    }
  }



}

export { Cinemeta };
