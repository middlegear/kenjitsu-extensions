import { BaseAnimeMeta } from '../../models/anime-meta.js';
import type { IResponse } from '../../types/base.js';
import type {
  AiringSchedule,
  IAnilistCharacters,
  IMetaAnime,
  IMetaAnimePaginated,
  IMetaFormat,
  IMetaProviderEpisodes,
  IMetaProviderEpisodesResponse,
  IMetaProviderIdResponse,
  IRelatedAnilistData,
  MediaSchedule,
  Seasons,
} from '../../types/meta/meta-anime.js';
import {
  characterQuery,
  fetchAiringByDate,
  fetchByIdQuery,
  mediaAiringSchedule,
  mediaTrendQuery,
  popularAnimeQuery,
  relatedQuery,
  searchQuery,
  searchQueryWithSort,
  seasonQuery,
  singleResultQuery,
  topQuery,
} from '../../utils/queries.js';
import type { ClientOptions } from '../../config/client.js';
import type { IMetaMovieEpisodes } from '../../types/meta/meta-movie.js';

/**
 * A class for interacting with the Anilist API to search for anime, fetch detailed information,
 * retrieve various lists (trending, popular, top-rated, seasonal, upcoming), and get character
 * and episode information from specific providers.
 *
 *
 */
export class Anilist extends BaseAnimeMeta {
  private readonly baseUrl: string = 'https://graphql.anilist.co';
  private readonly workerUrl: string = 'https://api.kenjitsu.workers.dev';

  constructor(
    options: ClientOptions = {
      rateLimit: {
        intervalMs: 60000,
        requestsPerInterval: 30,
      },
      followRedirects: true,
    },
  ) {
    super(options);
  }

  /**
   * Maps an Anilist anime ID to the corresponding Anizone provider ID.
   *
   * @param anilistId - Anilist media ID (required)
   * @returns Provider mapping result including Anilist metadata and provider-specific ID (if found)
   */

  async fetchAnizoneProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
        status: 400,
      };
    }

    try {
      const [anilist, anizone] = await Promise.allSettled([
        this.fetchInfo(anilistId, 'ANIME'),
        this.client.fetch(`${this.workerUrl}/api/anime/anilist/${anilistId}?provider=anizone`, {
          method: 'GET',
        }),
      ]);

      if (anilist.status === 'rejected') {
        return {
          data: null,
          provider: null,
          error: anilist.reason,
          status: 500,
        };
      }

      if (anizone.status === 'rejected') {
        return {
          data: null,
          provider: null,
          error: anizone.reason,
          status: 500,
        };
      }

      const anilistData = anilist.value.data;

      if (!anizone.value.ok) {
        return {
          data: null,
          provider: null,
          error: anizone.value.statusText,
          status: anizone.value.status,
        };
      }
      const anizoneResult = await anizone.value.json();

      return {
        data: anilistData || anizoneResult?.data,
        provider: anizoneResult?.provider,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
        status: 500,
      };
    }
  }

  /**
   * Maps an Anilist anime ID to the corresponding AnimePahe provider ID.
   *
   * @param anilistId - Anilist media ID (required)
   * @returns Provider mapping result including Anilist metadata and provider-specific ID (if found)
   */
  async fetchAnimepaheProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
        status: 400,
      };
    }

    try {
      const [anilist, animepahe] = await Promise.allSettled([
        this.fetchInfo(anilistId, 'ANIME'),
        this.client.fetch(`${this.workerUrl}/api/anime/anilist/${anilistId}?provider=animepahe`, {
          method: 'GET',
        }),
      ]);

      if (anilist.status === 'rejected') {
        return {
          data: null,
          provider: null,
          error: anilist.reason,
          status: 500,
        };
      }

      const anilistData = anilist.value;
      if (animepahe.status == 'rejected') {
        return {
          data: null,
          provider: null,
          error: animepahe.reason,
          status: 500,
        };
      }
      if (!animepahe.value.ok) {
        return { data: null, provider: null, status: animepahe.value.status, error: animepahe.value.statusText };
      }
      const animepaheResult = await animepahe.value.json();

      return {
        data: anilistData.data,
        provider: animepaheResult.provider,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
        status: 500,
      };
    }
  }

  /**
   * Maps an Anilist anime ID to the corresponding Anikoto provider ID.
   *
   * @param anilistId - Anilist media ID (required)
   * @returns Provider mapping result including Anilist metadata and provider-specific ID (if found)
   */
  async fetchAnikotoProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
        status: 400,
      };
    }
    try {
      const [anilist, anikoto] = await Promise.allSettled([
        this.fetchInfo(anilistId, 'ANIME'),
        this.client.fetch(`${this.workerUrl}/api/anime/anilist/${anilistId}?provider=anikoto`, {
          method: 'GET',
        }),
      ]);

      if (anilist.status === 'rejected') {
        return {
          data: null,
          provider: null,
          error: anilist.reason,
          status: 500,
        };
      }

      const anilistData = anilist.value;
      if (anikoto.status == 'rejected') {
        return {
          data: null,
          provider: null,
          error: anikoto.reason,
          status: 500,
        };
      }
      if (!anikoto.value.ok) {
        return { data: null, provider: null, status: anikoto.value.status, error: anikoto.value.statusText };
      }
      const anikotoResult = await anikoto.value.json();

      return {
        data: anilistData.data,
        provider: anikotoResult.provider,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
        status: 500,
      };
    }
  }
  /**
   * Fetches episode list from Anikoto provider and enriches episodes with Anizip metadata (titles, thumbnails, etc.).
   *
   * @param anilistId - Anilist media ID (required)
   * @returns Enriched episode list from Anizone + Anilist base data
   */
  async fetchAnikotoProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
        provider: null,
        status: 400,
      };
    }

    try {
      const [initialResponse, anizip, tmdb] = await Promise.allSettled([
        this.fetchAnikotoProviderId(anilistId),
        this.anilistAnizip(anilistId),
        this.client.fetch(`${this.workerUrl}/api/meta/anilist/${anilistId}?platform=tmdb`, { method: 'GET' }),
      ]);

      if (initialResponse.status === 'rejected') {
        return {
          data: null,
          providerEpisodes: [],
          provider: null,
          error: initialResponse.reason,
          status: 500,
        };
      }

      if (anizip.status === 'rejected') {
        return {
          data: null,
          providerEpisodes: [],
          provider: null,
          error: anizip.reason,
          status: 500,
        };
      }

      const anikotoAnimeId = initialResponse.value.provider?.id;
      const anikotoResult = await this.anikoto.fetchAnimeInfo(anikotoAnimeId as string);

      const tmdbData = tmdb.status === 'fulfilled' ? await tmdb.value.json() : null;
      const tmdbEpisodesList = Array.isArray(tmdbData?.episodes) ? (tmdbData.episodes as IMetaMovieEpisodes[]) : [];

      const tmdbMap = new Map(
        tmdbEpisodesList.map((item: any) => [item.absoluteEpisodeNumber || item.absoluteEpisode, item]),
      );
      const anizipEpisodes = anizip.value.episodes;
      const aniZipMap = new Map(
        (anizipEpisodes || []).map((item: { episodeAnizipNumber: any }) => [item.episodeAnizipNumber, item]),
      );

      const enrichedEpisodes = anikotoResult.providerEpisodes
        .filter((ep: any) => typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber) && ep.episodeNumber > 0)
        .map((episode: any) => {
          const epNum = episode.episodeNumber;
          const tmdbEp = tmdbMap.get(epNum);
          const aniZipEp = aniZipMap.get(epNum);
          return this.mergeEpisodeData(episode, aniZipEp, tmdbEp, 'anizone');
        });

      const anilistData = initialResponse.value.data;
      const providerInfo = initialResponse.value.provider;

      return {
        data: anilistData,
        providerEpisodes: enrichedEpisodes,
        provider: providerInfo,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
        providerEpisodes: [],
        provider: null,
        status: 500,
      };
    }
  }
  /**
   * Fetches episode list from Anizone provider and enriches episodes with Anizip metadata (titles, thumbnails, etc.).
   *
   * @param anilistId - Anilist media ID (required)
   * @returns Enriched episode list from Anizone + Anilist base data
   */
  async fetchAnizoneProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
        provider: null,
        status: 400,
      };
    }

    try {
      const [initialResponse, anizip, tmdb] = await Promise.allSettled([
        this.fetchAnizoneProviderId(anilistId),
        this.anilistAnizip(anilistId),
        this.client.fetch(`${this.workerUrl}/api/meta/anilist/${anilistId}?platform=tmdb`, { method: 'GET' }),
      ]);

      if (initialResponse.status === 'rejected') {
        return {
          data: null,
          providerEpisodes: [],
          provider: null,
          error: initialResponse.reason,
          status: 500,
        };
      }

      if (anizip.status === 'rejected') {
        return {
          data: null,
          providerEpisodes: [],
          provider: null,
          error: anizip.reason,
          status: 500,
        };
      }

      const anizoneAnimeId = initialResponse.value.provider?.id;
      const anizoneResult = await this.anizone.fetchAnimeInfo(anizoneAnimeId as string);

      const tmdbData = tmdb.status === 'fulfilled' ? await tmdb.value.json() : null;
      const tmdbEpisodesList = Array.isArray(tmdbData?.episodes) ? (tmdbData.episodes as IMetaMovieEpisodes[]) : [];

      const tmdbMap = new Map(
        tmdbEpisodesList.map((item: any) => [item.absoluteEpisodeNumber || item.absoluteEpisode, item]),
      );
      const anizipEpisodes = anizip.value.episodes;
      const aniZipMap = new Map(
        (anizipEpisodes || []).map((item: { episodeAnizipNumber: any }) => [item.episodeAnizipNumber, item]),
      );

      const enrichedEpisodes = anizoneResult.providerEpisodes
        .filter((ep: any) => typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber) && ep.episodeNumber > 0)
        .map((episode: any) => {
          const epNum = episode.episodeNumber;
          const tmdbEp = tmdbMap.get(epNum);
          const aniZipEp = aniZipMap.get(epNum);
          return this.mergeEpisodeData(episode, aniZipEp, tmdbEp, 'anizone');
        });
      const anilistData = initialResponse.value.data;
      const providerInfo = initialResponse.value.provider;
      return {
        data: anilistData,
        providerEpisodes: enrichedEpisodes,
        provider: providerInfo,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
        providerEpisodes: [],
        provider: null,
        status: 500,
      };
    }
  }

  /**
   * Fetches episode list from AnimePahe provider and enriches episodes with Anizip metadata.
   *
   * @param anilistId - Anilist media ID (required)
   * @returns Enriched episode list from AnimePahe + Anilist base data
   */
  async fetchAnimepaheProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
        provider: null,
        status: 400,
      };
    }

    try {
      const [initialResponse, anizip, tmdb] = await Promise.allSettled([
        this.fetchAnimepaheProviderId(anilistId),
        this.anilistAnizip(anilistId),
        this.client.fetch(`${this.workerUrl}/api/meta/anilist/${anilistId}?platform=tmdb`, { method: 'GET' }),
      ]);

      if (initialResponse.status === 'rejected') {
        return {
          data: null,
          providerEpisodes: [],
          provider: null,
          error: initialResponse.reason,
          status: 500,
        };
      }

      if (anizip.status === 'rejected') {
        return {
          data: null,
          providerEpisodes: [],
          provider: null,
          error: anizip.reason,
          status: 500,
        };
      }

      const anilistData = initialResponse.value.data;
      const animepaheId = initialResponse.value.provider?.id;
      const anizipEpisodes = anizip.value.episodes;

      const animepahe = await this.animepahe.fetchEpisodes(animepaheId as string);

      const animepaheNumbers = animepahe.data.map((e: any) => Number(e.episodeNumber));

      let enrichedEpisodes;
      if (anizipEpisodes) {
        const anizipNumbers = anizipEpisodes?.map((e: any) => Number(e.episodeAnizipNumber));

        const offset = animepaheNumbers[0] - anizipNumbers[0];

        const aniZipMap = new Map(
          anizipEpisodes.map((item: { episodeAnizipNumber: any }) => [Number(item.episodeAnizipNumber), item]),
        );
        const tmdbData = tmdb.status === 'fulfilled' ? await tmdb.value.json() : null;
        const tmdbEpisodesList = Array.isArray(tmdbData?.episodes) ? (tmdbData.episodes as IMetaMovieEpisodes[]) : [];

        const tmdbMap = new Map(
          tmdbEpisodesList.map((item: any) => [
            item.absoluteEpisodeNumber || item.absoluteEpisode, // Use the field name we just added
            item,
          ]),
        );
        enrichedEpisodes = animepahe.data
          .filter((ep: any) => typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber) && ep.episodeNumber > 0)
          .map((episode: any) => {
            const matchKey = Number(episode.episodeNumber) - offset;

            const tmdbEp = tmdbMap.get(matchKey);
            const aniZipEp = aniZipMap.get(matchKey);
            return this.mergeEpisodeData(episode, aniZipEp, tmdbEp, 'animepahe');
          });
      }
      const providerInfo = initialResponse.value.provider;
      return {
        data: anilistData,
        providerEpisodes: enrichedEpisodes as IMetaProviderEpisodes[],
        provider: providerInfo,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: null,
        providerEpisodes: [],
        provider: null,
        status: 500,
      };
    }
  }

  /**
   * Searches for anime or manga using a query string.
   *
   * @param search - Search term / keyword (required)
   * @param mediaType - Type of media to search for
   * @param mediaType - `'ANIME'` or `'MANGA'`
   * @param [page=1] - Page number (1-based)
   * @param [perPage=20] - Results per page
   * @returns Paginated search results with media entries
   */
  async search(
    search: string,
    mediaType: 'ANIME' | 'MANGA',
    page: number = 1,
    perPage: number = 20,
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    if (!search) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: 'Missing required parameter: query',
        status: 400,
      };
    }

    try {
      const variables = { search, page, perPage, type: mediaType, isAdult: false };
      const payload = {
        query: searchQueryWithSort,
        variables,
      };
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const pagination = {
        hasNextPage: result.data.Page.pageInfo.hasNextPage,
        total: result.data.Page.pageInfo.total,
        lastPage: result.data.Page.pageInfo.lastPage,
        currentPage: result.data.Page.pageInfo.currentPage,
        perPage: result.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = result.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        color: item.coverImage.color,
        bannerImage: item.bannerImage ?? null,
        title: {
          romaji: item.title.romaji ?? item.title.userPreferred,
          english: item.title.english,
          native: item.title.native,
        },
        trailer: item.trailer,
        format: item.format,
        status: item.status,
        duration: item.duration,
        score: item.meanScore ?? item.averageScore,
        genres: item.genres,
        episodes: item.episodes,
        synopsis: item.description,
        season: item.season,
        releaseDate:
          item.startDate && item.startDate.year
            ? new Date(item.startDate.year, item.startDate.month - 1, item.startDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        endDate:
          item.endDate && item.endDate.year
            ? new Date(item.endDate.year, item.endDate.month - 1, item.endDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        studio: item.studios.nodes.length > 0 ? item.studios.nodes[0].name : null,
        producers: item.studios.nodes.map((item2: any) => item2.name),
      }));

      let items: IMetaAnime[] = res;

      if (mediaType === 'MANGA') {
        items = res.filter((item: { format: string }) => item.format === 'MANGA');
      }

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: items,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        status: 500,
        error: error instanceof Error ? error.message : 'Internal Server Error ',
      };
    }
  }

  /**
   * Fetches detailed metadata for a single anime or manga entry by its Anilist ID.
   *
   * @param id - Anilist media ID (required)
   * @param mediaType - Type of media
   * @param mediaType - `'ANIME'` or `'MANGA'`
   * @returns Detailed media information or error
   */
  async fetchInfo(id: number, mediaType: 'ANIME' | 'MANGA'): Promise<IResponse<IMetaAnime | null>> {
    if (!id) {
      return {
        error: 'Missing required parameter : Anilistid!',
        data: null,
        status: 500,
      };
    }

    const variables = { id, type: mediaType };
    const payload = {
      query: fetchByIdQuery,
      variables,
    };
    try {
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          error: response.statusText,
          data: null,
          status: response.status,
        };
      }
      const result = await response.json();
      const res = {
        malId: result.data.Media.idMal,
        anilistId: result.data.Media.id,
        isAdult: result.data.Media.isAdult,
        image:
          result.data.Media.coverImage.extraLarge ??
          result.data.Media.coverImage.large ??
          result.data.Media.coverImage.medium,
        color: result.data.Media.coverImage.color,
        bannerImage: result.data.Media.bannerImage ?? null,

        title: {
          romaji: result.data.Media.title.romaji ?? result.data.Media.title.userPreferred,
          english: result.data.Media.title.english,
          native: result.data.Media.title.native,
        },
        trailer: result.data.Media.trailer,
        format: result.data.Media.format,
        country: result.data.Media.countryOfOrigin || null,
        synonyms: result.data.Media.synonyms || null,
        year: result.data.Media.seasonYear || null,
        status: result.data.Media.status || null,
        duration: result.data.Media.duration,
        score: result.data.Media.meanScore || result.data.Media.averageScore,
        genres: result.data.Media.genres,
        episodes: result.data.Media.episodes,
        synopsis: result.data.Media.description,
        season: result.data.Media.season,
        releaseDate:
          result.data.Media.startDate && result.data.Media.startDate.year
            ? new Date(
                result.data.Media.startDate.year,
                result.data.Media.startDate.month - 1,
                result.data.Media.startDate.day,
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        endDate:
          result.data.Media.endDate && result.data.Media.endDate.year
            ? new Date(
                result.data.Media.endDate.year,
                result.data.Media.endDate.month - 1,
                result.data.Media.endDate.day,
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        studio: result.data.Media.studios.nodes.length > 0 ? result.data.Media.studios.nodes[0].name : null,
        producers: result.data.Media.studios.nodes.map((item2: any) => item2.name),
      };

      return {
        data: res as IMetaAnime,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        status: 500,
      };
    }
  }

  /**
   * Fetches a list of the most anticipated upcoming anime.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @param sort - The sorting order for results (optional, defaults to POPULARITY_DESC)
   * @param status - The state of the anime('NOT_YET_RELEASED' | 'RELEASING' ) defaults to 'NOT_YET_RELEASED',
   * @param format - The anime format
   * @returns Promise that resolves to paginated list of upcoming anime
   */
  async fetchTopUpcoming(
    page: number = 1,
    perPage: number = 20,
    sort: 'TRENDING_DESC' | 'SCORE_DESC' | 'POPULARITY_DESC' = 'POPULARITY_DESC',
    status: 'NOT_YET_RELEASED' | 'RELEASING' = 'NOT_YET_RELEASED',
    format: IMetaFormat = 'TV',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    try {
      const variables = { page, perPage, type: 'ANIME', format, status, isAdult: false, sort };

      const payload = {
        query: topQuery,
        variables,
      };
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();

      const pagination = {
        hasNextPage: result.data.Page.pageInfo.hasNextPage,
        total: result.data.Page.pageInfo.total,
        lastPage: result.data.Page.pageInfo.lastPage,
        currentPage: result.data.Page.pageInfo.currentPage,
        perPage: result.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = result.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        bannerImage: item.bannerImage ?? null,
        title: {
          romaji: item.title.romaji ?? item.title.userPreferred,
          english: item.title.english,
          native: item.title.native,
        },
        trailer: item.trailer,
        format: item.format,
        status: item.status,
        genres: item.genres,
        synopsis: item.description,
        releaseDate:
          item.startDate && item.startDate.year
            ? new Date(item.startDate.year, item.startDate.month - 1, item.startDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        studio: item.studios.nodes.length > 0 ? item.studios.nodes[0].name : null,
        producers: item.studios.nodes.map((item2: any) => item2.name),
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: res as IMetaAnime[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Err',
        status: 500,
      };
    }
  }

  /**
   * Fetches a list of the top airing anime.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @param sort - The sorting order for results (optional, defaults to SCORE_DESC)
   * @param status - Anime state defaults to RELEASING.
   * @returns Promise that resolves to paginated list of airing anime
   */
  async fetchTopAiring(
    page: number = 1,
    perPage: number = 20,
    sort: 'SCORE_DESC' = 'SCORE_DESC',
    status: 'RELEASING' = 'RELEASING',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopUpcoming(page, perPage, sort, status);
  }

  /**
   * Fetches a list of the most popular media
   *
   * @param {('ANIME' | 'MANGA')} mediaType - The type of media to fetch
   * @param {string} [format] - The format to filter by
   *           - When `mediaType` is `'ANIME'`: `'TV' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC'`
   *           - When `mediaType` is `'MANGA'`: `'MANGA'`
   * @param {number} [page=1] - Page number for pagination.
   * @param {number} [perPage=20] - Number of items per page
   * @param sort - The criteria used to order the results.
   * @returns {Promise<Object>} Promise that resolves to a paginated response containing popular media
   *
   */
  async fetchMostPopular(
    mediaType: 'ANIME' | 'MANGA',
    format: IMetaFormat,
    page: number = 1,
    perPage: number = 20,
    sort: 'SCORE_DESC' | 'POPULARITY_DESC' = 'POPULARITY_DESC',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    try {
      const variables = { page, perPage, type: mediaType, format, isAdult: false, sort };

      const payload = {
        query: popularAnimeQuery,
        variables,
      };
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const pagination = {
        hasNextPage: result.data.Page.pageInfo.hasNextPage,
        total: result.data.Page.pageInfo.total,
        lastPage: result.data.Page.pageInfo.lastPage,
        currentPage: result.data.Page.pageInfo.currentPage,
        perPage: result.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = result.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        bannerImage: item.bannerImage ?? null,
        title: {
          romaji: item.title.romaji ?? item.title.userPreferred,
          english: item.title.english,
          native: item.title.native,
        },
        trailer: item.trailer,
        format: item.format,
        status: item.status,
        duration: item.duration,
        score: item.meanScore ?? item.averageScore,
        genres: item.genres,
        episodes: item.episodes,
        synopsis: item.description,
        season: item.season,
        releaseDate:
          item.startDate && item.startDate.year
            ? new Date(item.startDate.year, item.startDate.month - 1, item.startDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        endDate:
          item.endDate && item.endDate.year
            ? new Date(item.endDate.year, item.endDate.month - 1, item.endDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        studio: item.studios.nodes.length > 0 ? item.studios.nodes[0].name : null,
        producers: item.studios.nodes.map((item2: any) => item2.name),
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: res,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err',
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        status: 500,
      };
    }
  }

  /**
   * Fetches a list of top-rated media
   *
   * @param {('ANIME' | 'MANGA')} mediaType - The type of media to fetch
   * @param {string} [format] - The format to filter by
   *           - When `mediaType` is `'ANIME'`: `'TV' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC'`
   *           - When `mediaType` is `'MANGA'`: `'MANGA'`
   * @param {number} [page=1] - Page number for pagination.
   * @param {number} [perPage=20] - Number of items per page
   * @param sort - The criteria used to order the results.
   * @returns {Promise<Object>} Promise that resolves to a paginated response containing popular media
   *
   */
  async fetchTopRated(
    mediaType: 'ANIME' | 'MANGA',
    format: IMetaFormat,
    page: number = 1,
    perPage: number = 20,
    sort: 'SCORE_DESC' | 'POPULARITY_DESC' = 'SCORE_DESC',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchMostPopular(mediaType, format, page, perPage, sort);
  }

  /**
   * Fetches a paginated list of anime released in a specific season and year.
   *
   * @param season - Anime season to query
   * @param season - `'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'`
   * @param seasonYear - The year of the season (e.g. 2023, 2024, 2025)
   * @param [page=1] - Page number (1-based pagination)
   * @param [perPage=20] - Number of results per page
   * @param [format='TV'] - Format filter for the anime
   * @param format - `'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC'`
   * @returns Promise resolving to a paginated list of seasonal anime entries
   */
  async fetchSeasonalAnime(
    season: Seasons,
    seasonYear: number,
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    if (!season || !seasonYear) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: 'Missing a required parameter : season or  seasonYear',
        status: 400,
      };
    }

    try {
      const variables = {
        page,
        perPage,
        type: 'ANIME',
        format,
        isAdult: false,
        season,
        seasonYear,
        sort: 'POPULARITY_DESC',
      };
      const payload = {
        query: seasonQuery,
        variables,
      };
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },

          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const pagination = {
        hasNextPage: result.data.Page.pageInfo.hasNextPage,
        total: result.data.Page.pageInfo.total,
        lastPage: result.data.Page.pageInfo.lastPage,
        currentPage: result.data.Page.pageInfo.currentPage,
        perPage: result.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = result.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        bannerImage: item.bannerImage ?? null,
        title: {
          romaji: item.title.romaji ?? item.title.userPreferred,
          english: item.title.english,
          native: item.title.native,
        },
        trailer: item.trailer,
        format: item.format,
        status: item.status,
        duration: item.duration,
        score: item.meanScore ?? item.averageScore,
        genres: item.genres,
        episodes: item.episodes,
        synopsis: item.description,
        season: item.season,
        releaseDate:
          item.startDate && item.startDate.year
            ? new Date(item.startDate.year, item.startDate.month - 1, item.startDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        endDate:
          item.endDate && item.endDate.year
            ? new Date(item.endDate.year, item.endDate.month - 1, item.endDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        studio: item.studios.nodes.length > 0 ? item.studios.nodes[0].name : null,
        producers: item.studios.nodes.map((item2: any) => item2.name),
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: res,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }

  /**
   * Fetches a paginated list of currently trending media (anime or manga),
   * typically ordered by recent popularity, trending score, or user activity.
   *
   * @param mediaType - Type of media to fetch
   * @param mediaType - `'ANIME'` or `'MANGA'`
   * @param format - Format filter to apply
   * @param format - For ANIME: `'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC'`
   * @param format - For MANGA: `'MANGA' | 'NOVEL' | 'ONE_SHOT' | 'LIGHT_NOVEL'`
   * @param [page=1] - Page number for pagination (1-based)
   * @param [perPage=20] - Number of items per page
   * @returns Promise resolving to paginated list of trending media entries
   *
   */
  async fetchTrending(
    mediaType: 'ANIME' | 'MANGA',
    format: IMetaFormat,
    page: number = 1,
    perPage: number = 20,
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    const variables = {
      page,
      perPage,
      type: mediaType,
      format,
    };

    try {
      const payload = {
        query: mediaTrendQuery,
        variables,
      };
      const response = await this.client.fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const pagination = {
        hasNextPage: result.data.Page.pageInfo.hasNextPage,
        total: result.data.Page.pageInfo.total,
        lastPage: result.data.Page.pageInfo.lastPage,
        currentPage: result.data.Page.pageInfo.currentPage,
        perPage: result.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = result.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        bannerImage: item.bannerImage ?? null,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        title: {
          romaji: item.title.romaji ?? item.title.userPreferred,
          english: item.title.english,
          native: item.title.native,
        },
        format: item.format,
        status: item.status,
        popularity: item.popularity,
        score: item.meanScore ?? item.averageScore,
        genres: item.genres,
        episodes: item.episodes,
        synopsis: item.description,
        season: item.season,
        releaseDate:
          item.startDate && item.startDate.year
            ? new Date(item.startDate.year, item.startDate.month - 1, item.startDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        endDate:
          item.endDate && item.endDate.year
            ? new Date(item.endDate.year, item.endDate.month - 1, item.endDate.day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        studio: item.studios.nodes.length > 0 ? item.studios.nodes[0].name : null,
        producers: item.studios?.nodes.map((item2: any) => item2.name),
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: res,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }

  /**
   * Fetches anime titles related to a specific anime ID, such as sequels, prequels, or spin-offs.
   *
   * @param mediaId - The unique Anilist anime ID (required)
   * @returns Promise that resolves to related anime information
   */
  async fetchRelatedAnime(mediaId: number): Promise<IResponse<IRelatedAnilistData[] | []>> {
    if (!mediaId) {
      return {
        data: [],
        error: 'Missing a required param : season | seasonYear',
      };
    }

    const variables = {
      mediaId,
      type: 'ANIME',
    };

    try {
      const payload = {
        query: relatedQuery,
        variables,
      };
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },

          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
          status: response.status,
        };
      }
      const result = await response.json();
      const res: IRelatedAnilistData[] = result.data.Media.relations.edges
        .filter((item: any) => item.node.type === 'ANIME')
        .map((item: any) => ({
          anilistId: item.node.id,
          malId: item.node.idMal,

          title: {
            romaji: item.node.title.romaji ?? item.node.title.userPreferred,
            english: item.node.title.english,
            native: item.node.title.native,
          },
          type: item.node.type,
          country: item.node.countryOfOrigin || null,
          synonyms: item.node.synonyms || null,
          year: item.node.seasonYear || null,
          score: item.node.averageScore ?? item.node.meanScore,
          image: item.node.coverImage.extraLarge ?? item.node.coverImage.large ?? item.node.coverImage.medium,
          bannerImage: item.node.bannerImage ?? null,
          color: item.node.coverImage.color ?? null,
        }));

      return {
        data: res,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: [],
        status: 500,
      };
    }
  }

  /**
   * Fetches characters associated with a specific anime.
   *
   * @param mediaId - The unique Anilist anime ID (required)
   * @returns Promise that resolves to anime characters and their voice actors
   */
  async fetchCharacters(mediaId: number): Promise<IResponse<IAnilistCharacters | null>> {
    if (!mediaId) {
      return {
        error: 'Missing required parameter: mediaId!',
        data: null,
        status: 400,
      };
    }

    try {
      const variables = {
        mediaId,
        sort: 'RELEVANCE',
        voiceActorsSort2: 'RELEVANCE',
      };
      const payload = {
        query: characterQuery,
        variables,
      };
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
          status: response.status,
        };
      }
      const result = await response.json();
      const res: IAnilistCharacters = {
        malId: result.data.Media.idMal,
        anilistId: result.data.Media.id,
        title: {
          romaji: result.data.Media.title.romaji ?? result.data.Media.title.userPreferred,
          english: result.data.Media.title.english,
          native: result.data.Media.title.native,
        },
        characters: result.data?.Media.characters.edges.map((item: any) => ({
          role: item.role,
          id: item.node.id,
          name: item.node.name.full,
          image: item.node.image.large ?? item.node.image.medium,
          voiceActors: item.voiceActors.map((item2: any) => ({
            name: item2.name.full,
            language: item2.languageV2,
            image: item2.image.large ?? item2.image.medium,
          })),
        })),
      };

      return {
        data: res,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err',
        data: null,
        status: 500,
      };
    }
  }

  /**
   * Fetches the airing schedule for a specific anime by its Anilist ID.
   *
   * @param {number} mediaId - The unique Anilist anime ID (required).
   * @returns  A promise that resolves to an object containing the airing schedule data or an error.
   * **/
  async fetchMediaSchedule(mediaId: number): Promise<IResponse<MediaSchedule | null>> {
    if (!mediaId) {
      return { error: 'Missing required params: anilistId', data: null, status: 400 };
    }
    try {
      const variables = {
        mediaId,
      };
      const payload = {
        query: mediaAiringSchedule,
        variables,
      };
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },

          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
          status: response.status,
        };
      }
      const result = await response.json();
      const res = {
        malId: result.data.AiringSchedule.media.idMal,
        anilistId: result.data.AiringSchedule.media.id,

        image:
          result.data.AiringSchedule.media.coverImage.extraLarge ??
          result.data.AiringSchedule.media.coverImage.large ??
          result.data.AiringSchedule.media.coverImage.medium,

        color: result.data.AiringSchedule.media.coverImage.color,

        bannerImage: result.data.AiringSchedule.media.bannerImage ?? null,

        title: {
          romaji: result.data.AiringSchedule.media.title.romaji ?? result.data.AiringSchedule.media.title.userPreferred,
          english: result.data.AiringSchedule.media.title.english,
          native: result.data.AiringSchedule.media.title.native,
        },
        status: result.data.AiringSchedule.media.status,
        format: result.data.AiringSchedule.media.format,
        duration: result.data.AiringSchedule.media.duration,

        releaseDate: result.data.AiringSchedule.media.startDate?.year
          ? new Date(
              result.data.AiringSchedule.media.startDate.year,
              result.data.AiringSchedule.media.startDate.month - 1,
              result.data.AiringSchedule.media.startDate.day,
            ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Unknown',

        endDate: result.data.AiringSchedule.media.endDate?.year
          ? new Date(
              result.data.AiringSchedule.media.endDate.year,
              result.data.AiringSchedule.media.endDate.month - 1,
              result.data.AiringSchedule.media.endDate.day,
            ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Unknown',

        nextAiringEpisode: result.data.AiringSchedule.media.nextAiringEpisode
          ? {
              episode: result.data.AiringSchedule.media.nextAiringEpisode.episode,
              id: result.data.AiringSchedule.media.nextAiringEpisode.id,
              airingAt: result.data.AiringSchedule.media.nextAiringEpisode.airingAt,
              timeUntilAiring: result.data.AiringSchedule.media.nextAiringEpisode.timeUntilAiring,
            }
          : null,
      };

      return { data: res as MediaSchedule };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err',
        data: null,
        status: 500,
      };
    }
  }

  /**
   * Fetches a paginated list of all anime airing on a specific date.
   * @param {string} date - The date to check for airing episodes (Format: ISO 8601 standard (YYYY-MM-DD)).
   * @param {number} [page=1] - The page number to fetch for pagination.
   * @param {number} [perPage=20] - The number of results to return per page.
   * @returns  A promise resolving to a paginated  object containing an array of airing schedules and page metadata.
   */
  async fetchAiringSchedule(
    date: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<IMetaAnimePaginated<AiringSchedule[] | []>> {
    try {
      const start = this.getAniListVariables(date).start;
      const end = this.getAniListVariables(date).end;
      const variables = {
        airingAtLesser: end,
        airingAtGreater: start,
        page,
        perPage,
      };
      const payload = {
        query: fetchAiringByDate,
        variables,
      };
      const response = await this.client.fetch(
        this.baseUrl,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },

          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,

          error: response.statusText || 'Server returned an empty response',
          data: [],
          status: response.status,
        };
      }

      const result = await response.json();
      const res = result.data.Page.airingSchedules.map((item: any) => ({
        malId: item.media.idMal,
        anilistId: item.media.id,
        bannerImage: item.media.bannerImage ?? null,
        image: item.media.coverImage.extraLarge ?? item.media.coverImage.large ?? item.media.coverImage.medium,
        color: item.media.coverImage.color,
        title: {
          romaji: item.media.title.romaji ?? item.media.title.userPreferred,
          english: item.media.title.english,
          native: item.media.title.native,
        },
        format: item.media.format,
        status: item.media.status,
        popularity: item.media.popularity,
        score: item.media.meanScore ?? item.media.averageScore,
        genres: item.media.genres,
        episodes: item.media.episodes,
        duration: item.media.duration,
        synopsis: item.media.description,
        season: item.media.season,
        releaseDate:
          item.media.startDate && item.media.startDate.year
            ? new Date(
                item.media.startDate.year,
                item.media.startDate.month - 1,
                item.media.startDate.day,
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',
        endDate:
          item.media.endDate && item.media.endDate.year
            ? new Date(item.media.endDate.year, item.media.endDate.month - 1, item.media.endDate.day).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : 'Unknown',
        nextAiringEpisode: item.media.nextAiringEpisode
          ? {
              episode: item.media.nextAiringEpisode.episode,
              id: item.media.nextAiringEpisode.id,
              airingAt: item.media.nextAiringEpisode.airingAt,
              timeUntilAiring: item.media.nextAiringEpisode.timeUntilAiring,
            }
          : null,
      }));
      return {
        hasNextPage: result.data.Page.pageInfo.hasNextPage,
        currentPage: result.data.Page.pageInfo.currentPage,
        lastPage: result.data.Page.pageInfo.lastPage,
        perPage: result.data.Page.pageInfo.perPage,
        data: res,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
      };
    }
  }

  /**
   * Converts two date strings into a variables object for AniList
   * @param {string} startDate - Format "YYYY-MM-DD"
   */
  private getAniListVariables(startDate: String) {
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${startDate}T23:59:59Z`);

    return {
      start: Math.floor(start.getTime() / 1000),
      end: Math.floor(end.getTime() / 1000),
    };
  }
}
