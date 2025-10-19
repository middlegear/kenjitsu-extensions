import { BaseClass } from '../../models/base-anime.js';

export class PrimeWire extends BaseClass {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://primesrc.me') {
    super();
    this.baseUrl = baseUrl;
  }

  async fetchTvServers(tmdbId: number, season: number, episodeNumber: number) {
    try {
      const response = await this.client.get(`${this.baseUrl}/api/v1/s`, {
        params: {
          tmdb: String(tmdbId),
          season: String(season),
          episode: String(episodeNumber),
          type: 'tv',
        },
      });
      return response.data;
    } catch (error) {}
  }

  async fetchMovieServers(tmdbId: number) {
    try {
      const response = await this.client.get(`${this.baseUrl}/api/v1/s`, {
        params: {
          tmdb: String(tmdbId),
          type: 'movie',
        },
      });
      return response.data;
    } catch (error) {}
  }
}
