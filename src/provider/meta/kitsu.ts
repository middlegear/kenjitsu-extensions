import { BaseClass } from '../../models/base.js';
import type { ClientOptions } from '../../config/client.js';

class Kitsu extends BaseClass {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://kitsu.io/api/edge', options: ClientOptions = { browser: 'okhttp4' }) {
    super(options);
    this.baseUrl = baseUrl;
  }

  async search(query: string) {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime?filter[text]=${query}`, {
        method: 'GET',
      });
      if (!response.ok) {
        return {
          error: response.statusText,
          data: [],
          status: response.status,
        };
      }

      const result = await response.json();
      const data = result.data.map((item: any) => {
        const a = item.attributes;

        return {
          kitsuId: Number(item.id),

          isAdult: a.nsfw,
          slug: a.slug,
          image:
            a.posterImage?.original ??
            a.posterImage?.large ??
            a.posterImage?.medium ??
            a.posterImage?.small ??
            a.posterImage?.tiny,

          bannerImage: a.coverImage?.original ?? a.coverImage?.large ?? a.coverImage?.small ?? a.coverImage?.tiny,

          title: {
            romaji: a.titles?.en_jp ?? a.canonicalTitle ?? null,
            english: a.titles?.en ?? null,
            native: a.titles?.ja_jp ?? null,
          },

          trailer: a.youtubeVideoId
            ? {
                id: a.youtubeVideoId,
                site: 'youtube',
              }
            : null,

          format: a.showType ?? a.subtype,

          synonyms: a.abbreviatedTitles ?? [],

          status: a.status,

          releaseDate: a.startDate,
          endDate: a.endDate,

          duration: a.episodeLength,
          episodes: a.episodeCount,

          score: a.averageRating ? Number(a.averageRating) : null,

          synopsis: a.synopsis ?? a.description,
        };
      });

      return {
        data: data,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: [],
        status: 500,
      };
    }
  }
  async searchSlug(query: string) {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime?filter[slug]=${query}`, {
        method: 'GET',
      });
      if (!response.ok) {
        return {
          error: response.statusText,
          data: [],
          status: response.status,
        };
      }

      const result = await response.json();
      const data = result.data.map((item: any) => {
        const a = item.attributes;

        return {
          kitsuId: Number(item.id),

          isAdult: a.nsfw,
          slug: a.slug,
          image:
            a.posterImage?.original ??
            a.posterImage?.large ??
            a.posterImage?.medium ??
            a.posterImage?.small ??
            a.posterImage?.tiny,

          bannerImage: a.coverImage?.original ?? a.coverImage?.large ?? a.coverImage?.small ?? a.coverImage?.tiny,

          title: {
            romaji: a.titles?.en_jp ?? a.canonicalTitle ?? null,
            english: a.titles?.en ?? null,
            native: a.titles?.ja_jp ?? null,
          },

          trailer: a.youtubeVideoId
            ? {
                id: a.youtubeVideoId,
                site: 'youtube',
              }
            : null,

          format: a.showType ?? a.subtype,

          synonyms: a.abbreviatedTitles ?? [],

          status: a.status,

          releaseDate: a.startDate,
          endDate: a.endDate,

          duration: a.episodeLength,
          episodes: a.episodeCount,

          score: a.averageRating ? Number(a.averageRating) : null,

          synopsis: a.synopsis ?? a.description,
        };
      });

      return {
        data: data,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: [],
        status: 500,
      };
    }
  }

  async fetchEpisodes(id: number) {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime/${id}/episodes`, { method: 'GET' });
      if (!response.ok) {
        return {
          error: response.statusText,
          data: [],
          status: response.status,
        };
      }

      const result = await response.json();
      const data = result.data.map((item: any) => {
        const a = item.attributes;

        return {
          // episodeId: Number(item.id), // kitsu episodeId
          episodeId: Number(id),
          thumbnail: a.thumbnail?.original,
          title: {
            romaji: a.titles?.en_jp ?? null,
            english: a.titles?.en ?? a.canonicalTitle ?? null,
            native: a.titles?.ja_jp ?? null,
          },

          airDate: a.airdate,

          seasonNumber: a.seasonNumber,
          episodeNumber: a.number,

          relativeNumber: a.relativeNumber ?? null,

          synopsis: a.synopsis ?? a.description,
        };
      });

      return { data: data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: [],
        status: 500,
      };
    }
  }

  async fetchMapping(id: number) {
    try {
      const response = await this.client.fetch(
        `${this.baseUrl}/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${id}&include=item`,
        { method: 'GET' },
      );
      if (!response.ok) {
        return {
          error: response.statusText,
          data: null,
          status: response.status,
        };
      }
      const result = await response.json();

      const kitsuId = result.data?.[0]?.relationships?.item?.data?.id;

      const anime = result.included?.find((item: any) => item.type === 'anime' && item.id === kitsuId);

      return {
        data: {
          id: kitsuId,
          provider: 'Kitsu',
          name: anime?.attributes?.canonicalTitle,
          romaji: anime?.attributes?.titles?.en_jp ?? anime?.attributes?.canonicalTitle,
          score: null,
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        status: 500,
      };
    }
  }
}
export { Kitsu };
