import { BaseAnimeMeta } from '../../models/anime-meta.js';
import type { HiAnimeServers } from '../../types/anime/zoro.js';
import type { IBasePaginated, IResponse, ISubOrDub } from '../../types/base.js';
import type {
  IAnilistCharacters,
  IMetaAnime,
  IMetaAnimePaginated,
  IMetaFormat,
  IRelatedAnilistData,
  Seasons,
  MediaSchedule,
  AiringSchedule,
  IMetaProviderEpisodes,
  IMetaProviderEpisodesResponse,
  IMetaProviderIdResponse,
  IMetaData,
  Provider,
} from '../../types/meta/meta-anime.js';
import {
  airingSchedule,
  characterQuery,
  fetchByIdQuery,
  mediaAiringSchedule,
  mediaTrendQuery,
  popularAnimeQuery,
  relatedQuery,
  searchQuery,
  seasonQuery,
  topQuery,
} from '../../utils/queries.js';

/**
 * A class for interacting with the Anilist API to search for anime, fetch detailed information,
 * retrieve various lists (trending, popular, top-rated, seasonal, upcoming), and get character
 * and episode information from specific providers.
 *
 *
 */
export class Anilist extends BaseAnimeMeta {
  private readonly baseUrl: string = 'https://graphql.anilist.co';
  private readonly mappingUrl: string = 'https://kenjitsu-mapper.vercel.app';

  constructor() {
    super('anilist');
  }

  /**
   * Maps Anilist anime data to HiAnime (Zoro) provider ID.
   *
   * @private
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  async fetchZoroProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
      };
    }

    try {
      const [anilistSettled, zoroSettled] = await Promise.allSettled([
        this.fetchInfo(anilistId),
        this.client.get(`${this.mappingUrl}/api/mappings/anilist/${anilistId}?provider=hianime`),
      ]);

      const anilistData = anilistSettled.status === 'fulfilled' ? anilistSettled.value : null;
      const zoroResults = zoroSettled.status === 'fulfilled' ? zoroSettled.value.data : null;

      if (!anilistData?.data) {
        return {
          error: 'Failed to fetch AniList metadata.',
          data: null,
          provider: null,
        };
      }

      return {
        data: anilistData.data,
        provider: zoroResults.provider,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
      };
    }
  }

  /**
   * Maps Anilist anime data to Anizone provider ID.
   *
   * @private
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  async fetchAnizoneProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
      };
    }

    try {
      const [anilist, anizone] = await Promise.allSettled([
        this.fetchInfo(anilistId),
        this.client.get(`${this.mappingUrl}/api/mappings/anilist/${anilistId}?provider=anizone`),
      ]);

      const anilistData = anilist.status === 'fulfilled' ? anilist.value : null;
      const anizoneResult = anizone.status === 'fulfilled' ? anizone.value.data : null;

      if (!anilistData?.data) {
        return {
          error: 'Failed to fetch AniList metadata.',
          data: null,
          provider: null,
        };
      }

      return {
        data: anilistData.data,
        provider: anizoneResult.provider,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
      };
    }
  }
  /**
   * Maps Anilist anime data to AllAnime provider ID.
   *
   * @private
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  async fetchAllAnimeProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
      };
    }

    try {
      const [anilist, allanime] = await Promise.allSettled([
        this.fetchInfo(anilistId),
        this.client.get(`${this.mappingUrl}/api/mappings/anilist/${anilistId}?provider=allanime`),
      ]);

      const anilistData = anilist.status === 'fulfilled' ? anilist.value : null;
      const allAnimeResult = allanime.status === 'fulfilled' ? allanime.value.data : null;

      if (!anilistData?.data) {
        return {
          error: 'Failed to fetch AniList metadata.',
          data: null,
          provider: null,
        };
      }

      return {
        data: anilistData.data,
        provider: allAnimeResult.provider,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
      };
    }
  }

  /**
   * Maps Anilist anime data to AnimePahe provider ID.
   *
   * @private
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  async fetchAnimepaheProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
      };
    }

    try {
      const [anilist, animepahe] = await Promise.allSettled([
        this.fetchInfo(anilistId),
        this.client.get(`${this.mappingUrl}/api/mappings/anilist/${anilistId}?provider=animepahe`),
      ]);

      const anilistData = anilist.status === 'fulfilled' ? anilist.value : null;
      const animepaheResult = animepahe.status === 'fulfilled' ? animepahe.value.data : null;

      if (!anilistData?.data) {
        return {
          error: 'Failed to fetch AniList metadata.',
          data: null,
          provider: null,
        };
      }

      return {
        data: anilistData.data,
        provider: animepaheResult.provider,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
      };
    }
  }
  /**
   * Maps Anilist anime data to AnimeKai provider ID.
   *
   * @private
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  async fetchAnimeKaiProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
      };
    }

    try {
      const [anilist, animekai] = await Promise.allSettled([
        this.fetchInfo(anilistId),
        this.client.get(`${this.mappingUrl}/api/mappings/anilist/${anilistId}?provider=animekai`),
      ]);

      const anilistData = anilist.status === 'fulfilled' ? anilist.value : null;
      const animekaiResult = animekai.status === 'fulfilled' ? animekai.value.data : null;

      if (!anilistData?.data) {
        return {
          error: 'Failed to fetch AniList metadata.',
          data: null,
          provider: null,
        };
      }

      return {
        data: anilistData.data,
        provider: animekaiResult.provider,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
      };
    }
  }

  /**
   * Fetches episodes from AllAnime provider and enriches with Anizip data.
   *
   * @private
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  async fetchAllAnimeProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const [initialResponse, anizip] = await Promise.allSettled([
        this.fetchAllAnimeProviderId(anilistId),
        this.client.get(`${this.mappingUrl}/api/tvdb/anilist/${anilistId}`),
      ]);

      if (initialResponse.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${initialResponse.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }
      if (anizip.status === 'rejected')
        return { error: `Failed to fetch provider episodes: ${anizip.reason}`, data: null, providerEpisodes: [] };

      const allAnimeId = initialResponse.status === 'fulfilled' ? initialResponse.value.provider?.id : null;
      const allanimeResult = await this.allanime.fetchEpisodes(allAnimeId as string);

      const anizipEpisodes = anizip.status === 'fulfilled' ? anizip.value.data.episodes : [];
      const aniZipMap = new Map(
        (anizipEpisodes || []).map((item: { episodeAnizipNumber: any }) => [item.episodeAnizipNumber, item]),
      );

      const enrichedEpisodes = allanimeResult.data
        .filter((ep: any) => typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber) && ep.episodeNumber > 0)
        .map((episode: any) => {
          const aniZipEpisode = aniZipMap.get(episode.episodeNumber) ?? null;
          return this.mergeEpisodeData(episode, aniZipEpisode, 'allanime');
        });

      const anilistData = initialResponse.status === 'fulfilled' ? initialResponse.value.data : null;

      return {
        data: anilistData,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
        providerEpisodes: [],
      };
    }
  }
  /**
   * Fetches episodes from AllAnime provider and enriches with Anizip data.
   *
   * @private
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  async fetchAnizoneProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const [initialResponse, anizip] = await Promise.allSettled([
        this.fetchAnizoneProviderId(anilistId),
        this.client.get(`${this.mappingUrl}/api/tvdb/anilist/${anilistId}`),
      ]);

      if (initialResponse.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${initialResponse.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }
      if (anizip.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${anizip.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }

      const anizoneAnimeId = initialResponse.status === 'fulfilled' ? initialResponse.value.provider?.id : null;
      const anizoneResult = await this.anizone.fetchAnimeInfo(anizoneAnimeId as string);

      const anizipEpisodes = anizip.status === 'fulfilled' ? anizip.value.data.episodes : [];
      const aniZipMap = new Map(
        (anizipEpisodes || []).map((item: { episodeAnizipNumber: any }) => [item.episodeAnizipNumber, item]),
      );

      const enrichedEpisodes = anizoneResult.providerEpisodes
        .filter((ep: any) => typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber))
        .map((episode: any) => {
          const aniZipEpisode = aniZipMap.get(episode.episodeNumber) ?? null;
          return this.mergeEpisodeData(episode, aniZipEpisode, 'anizone');
        });
      const anilistData = initialResponse.status === 'fulfilled' ? initialResponse.value.data : null;
      return {
        data: anilistData,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
        providerEpisodes: [],
      };
    }
  }

  /**
   * Fetches episodes from HiAnime (Zoro) provider and enriches with Anizip data.
   *
   * @private
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  async fetchZoroProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const [initialResponse, anizip] = await Promise.allSettled([
        this.fetchZoroProviderId(anilistId),
        this.client.get(`${this.mappingUrl}/api/tvdb/anilist/${anilistId}`),
      ]);

      if (initialResponse.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${initialResponse.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }
      if (anizip.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${anizip.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }
      const hianimeId = initialResponse.status === 'fulfilled' ? initialResponse.value.provider?.id : null;
      const anilistData = initialResponse.status === 'fulfilled' ? initialResponse.value.data : null;

      const hianimeResult = await this.hianime.fetchEpisodes(hianimeId as string);

      const anizipEpisodes = anizip.status === 'fulfilled' ? anizip.value.data.episodes : [];
      const aniZipMap = new Map(
        (anizipEpisodes || []).map((item: { episodeAnizipNumber: any }) => [item.episodeAnizipNumber, item]),
      );

      const enrichedEpisodes = hianimeResult.data.map((episode: any) => {
        const aniZipEpisode = aniZipMap.get(episode.episodeNumber);
        return this.mergeEpisodeData(episode, aniZipEpisode, 'hianime & kaido');
      });

      return {
        data: anilistData,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: null,
        providerEpisodes: [],
      };
    }
  }
  /**
   * Fetches episodes from Animekai provider and enriches with Anizip data.
   *
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  async fetchAnimeKaiProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const [initialResponse, anizip] = await Promise.allSettled([
        this.fetchAnimeKaiProviderId(anilistId),
        this.client.get(`${this.mappingUrl}/api/tvdb/anilist/${anilistId}`),
      ]);

      if (initialResponse.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${initialResponse.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }
      if (anizip.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${anizip.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }

      const animekaiId = initialResponse.status === 'fulfilled' ? initialResponse.value.provider?.id : null;
      const anilistData = initialResponse.status === 'fulfilled' ? initialResponse.value.data : null;
      const anizipEpisodes = anizip.status === 'fulfilled' ? anizip.value.data.episodes : [];

      const aniZipMap = new Map(
        (anizipEpisodes || []).map((item: { episodeAnizipNumber: any }) => [item.episodeAnizipNumber, item]),
      );

      const animekai = await this.animekai.fetchAnimeInfo(animekaiId as string);

      const enrichedEpisodes = animekai.providerEpisodes.map((episode: any) => {
        const aniZipEpisode = aniZipMap.get(episode.episodeNumber);

        return this.mergeEpisodeData(episode, aniZipEpisode, 'animekai');
      });

      return {
        data: anilistData,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: null,
        providerEpisodes: [],
      };
    }
  }

  /**
   * Fetches episodes from AnimePahe provider and enriches with Anizip data.
   *
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  async fetchAnimePaheProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const [initialResponse, anizip] = await Promise.allSettled([
        this.fetchAnimepaheProviderId(anilistId),
        this.client.get(`${this.mappingUrl}/api/tvdb/anilist/${anilistId}`),
      ]);

      if (initialResponse.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${initialResponse.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }
      if (anizip.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${anizip.reason}`,
          data: null,
          providerEpisodes: [],
        };
      }

      const anilistData = initialResponse.status === 'fulfilled' ? initialResponse.value.data : null;
      const paheId = initialResponse.status === 'fulfilled' ? initialResponse.value.provider?.id : null;
      const anizipEpisodes = anizip.status === 'fulfilled' ? anizip.value.data.episodes : [];

      const animepahe = await this.animepahe.fetchEpisodes(paheId as string);

      const paheNumbers = animepahe.data.map((e: any) => Number(e.episodeNumber));

      let enrichedEpisodes;
      if (anizipEpisodes) {
        const anizipNumbers = anizipEpisodes?.map((e: any) => Number(e.episodeAnizipNumber));

        const offset = paheNumbers[0] - anizipNumbers[0];

        const aniZipMap = new Map(
          anizipEpisodes.map((item: { episodeAnizipNumber: any }) => [Number(item.episodeAnizipNumber), item]),
        );

        enrichedEpisodes = animepahe.data.map((episode: any) => {
          const matchKey = Number(episode.episodeNumber) - offset;
          const aniZipEpisode = aniZipMap.get(matchKey) || null;
          return this.mergeEpisodeData(episode, aniZipEpisode, 'animepahe');
        });
      }
      return {
        data: anilistData,
        providerEpisodes: enrichedEpisodes as IMetaProviderEpisodes[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: null,
        providerEpisodes: [],
      };
    }
  }

  /**
   * Searches for anime based on the provided query string.
   *
   * @param search - The search query string (required)
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @returns Promise that resolves to paginated search results containing anime data
   */
  async search(search: string, page: number = 1, perPage: number = 20): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    if (!search) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: 'Missing required parameter: query',
      };
    }

    try {
      const variables = { search, page, perPage, type: 'ANIME', isAdult: false };
      const response = await this.client.post(this.baseUrl, {
        query: searchQuery,
        variables,
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
        };
      }

      const pagination = {
        hasNextPage: response.data.data.Page.pageInfo.hasNextPage,
        total: response.data.data.Page.pageInfo.total,
        lastPage: response.data.data.Page.pageInfo.lastPage,
        currentPage: response.data.data.Page.pageInfo.currentPage,
        perPage: response.data.data.Page.pageInfo.perPage,
      };

      const res = response.data.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        color: item.coverImage.color,
        bannerImage: item.bannerImage ?? item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
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
        data: res as IMetaAnime[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Internal Server Error ',
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime using its Anilist ID.
   *
   * @param id - The unique Anilist anime ID (required)
   * @returns Promise that resolves to detailed anime information
   */
  async fetchInfo(id: number): Promise<IResponse<IMetaAnime | null>> {
    if (!id) {
      return {
        error: 'Missing required parameter : Anilistid!',
        data: null,
      };
    }

    const variables = { id };

    try {
      const response = await this.client.post(this.baseUrl, {
        query: fetchByIdQuery,
        variables,
      });

      if (!response.data) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };
      }

      const res = {
        malId: response.data.data.Media.idMal,
        anilistId: response.data.data.Media.id,
        image:
          response.data.data.Media.coverImage.extraLarge ??
          response.data.data.Media.coverImage.large ??
          response.data.data.Media.coverImage.medium,
        color: response.data.data.Media.coverImage.color,

        bannerImage:
          response.data.data.Media.bannerImage ??
          response.data.data.Media.coverImage.extraLarge ??
          response.data.data.Media.coverImage.large ??
          response.data.data.Media.coverImage.medium,

        title: {
          romaji: response.data.data.Media.title.romaji ?? response.data.data.Media.title.userPreferred,
          english: response.data.data.Media.title.english,
          native: response.data.data.Media.title.native,
        },
        trailer: response.data.data.Media.trailer,
        format: response.data.data.Media.format,
        country: response.data.data.Media.countryOfOrigin || null,
        synonyms: response.data.data.Media.synonyms || null,
        year: response.data.data.Media.seasonYear || null,
        status: response.data.data.Media.status || null,
        duration: response.data.data.Media.duration,
        score: response.data.data.Media.meanScore || response.data.data.Media.averageScore,
        genres: response.data.data.Media.genres,
        episodes: response.data.data.Media.episodes,
        synopsis: response.data.data.Media.description,
        season: response.data.data.Media.season,
        releaseDate:
          response.data.data.Media.startDate && response.data.data.Media.startDate.year
            ? new Date(
                response.data.data.Media.startDate.year,
                response.data.data.Media.startDate.month - 1,
                response.data.data.Media.startDate.day,
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        endDate:
          response.data.data.Media.endDate && response.data.data.Media.endDate.year
            ? new Date(
                response.data.data.Media.endDate.year,
                response.data.data.Media.endDate.month - 1,
                response.data.data.Media.endDate.day,
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown',

        studio: response.data.data.Media.studios.nodes.length > 0 ? response.data.data.Media.studios.nodes[0].name : null,
        producers: response.data.data.Media.studios.nodes.map((item2: any) => item2.name),
      };

      return {
        data: res as IMetaAnime,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
      };
    }
  }

  /**
   * Fetches a list of the most anticipated upcoming anime.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @param sort - The sorting order for results (optional, defaults to POPULARITY_DESC)
   * @returns Promise that resolves to paginated list of upcoming anime
   */
  async fetchTopUpcoming(
    page: number = 1,
    perPage: number = 20,
    sort: 'SCORE_DESC' | 'POPULARITY_DESC' = 'POPULARITY_DESC',
    status: 'NOT_YET_RELEASED' | 'RELEASING' = 'NOT_YET_RELEASED',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    try {
      const variables = { page, perPage, type: 'ANIME', status, isAdult: false, sort };
      const response = await this.client.post(this.baseUrl, {
        query: topQuery,
        variables,
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
        };
      }

      const pagination = {
        hasNextPage: response.data.data.Page.pageInfo.hasNextPage,
        total: response.data.data.Page.pageInfo.total,
        lastPage: response.data.data.Page.pageInfo.lastPage,
        currentPage: response.data.data.Page.pageInfo.currentPage,
        perPage: response.data.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = response.data.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        bannerImage: item.bannerImage ?? item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
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
      };
    }
  }

  /**
   * Fetches a list of the top airing anime.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @param sort - The sorting order for results (optional, defaults to POPULARITY_DESC)
   * @returns Promise that resolves to paginated list of airing anime
   */
  async fetchTopAiring(
    page: number = 1,
    perPage: number = 20,
    sort: 'SCORE_DESC' | 'POPULARITY_DESC' = 'POPULARITY_DESC',
    status: 'NOT_YET_RELEASED' | 'RELEASING' = 'RELEASING',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopUpcoming(page, perPage, sort, status);
  }

  /**
   * Fetches a list of the most popular anime.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @param format - The anime format to filter by (optional, defaults to TV)
   * @returns Promise that resolves to paginated list of popular anime
   */
  async fetchMostPopular(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
    sort: 'SCORE_DESC' | 'POPULARITY_DESC' = 'POPULARITY_DESC',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    try {
      const variables = { page, perPage, type: 'ANIME', format, isAdult: false, sort };
      const response = await this.client.post(this.baseUrl, {
        query: popularAnimeQuery,
        variables,
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
        };
      }

      const pagination = {
        hasNextPage: response.data.data.Page.pageInfo.hasNextPage,
        total: response.data.data.Page.pageInfo.total,
        lastPage: response.data.data.Page.pageInfo.lastPage,
        currentPage: response.data.data.Page.pageInfo.currentPage,
        perPage: response.data.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = response.data.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        bannerImage: item.bannerImage ?? item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
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
      };
    }
  }

  /**
   * Fetches a list of the top-rated anime.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @param format - The anime format to filter by (optional, defaults to TV)

   * @returns Promise that resolves to paginated list of top-rated anime
   */
  async fetchTopRatedAnime(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
    sort: 'SCORE_DESC' | 'POPULARITY_DESC' = 'SCORE_DESC',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchMostPopular(page, perPage, format, sort);
  }

  /**
   * Fetches seasonal anime for a given year and season.
   *
   * @param season - The target season (e.g., WINTER, SPRING, SUMMER, FALL) (required)
   * @param seasonYear - The target year (e.g., 2023, 2024) (required)
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @param format - The anime format to filter by (optional, defaults to TV)
   * @returns Promise that resolves to paginated list of seasonal anime
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

      const response = await this.client.post(this.baseUrl, {
        query: seasonQuery,
        variables,
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
        };
      }

      const pagination = {
        hasNextPage: response.data.data.Page.pageInfo.hasNextPage,
        total: response.data.data.Page.pageInfo.total,
        lastPage: response.data.data.Page.pageInfo.lastPage,
        currentPage: response.data.data.Page.pageInfo.currentPage,
        perPage: response.data.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = response.data.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
        bannerImage: item.bannerImage ?? item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
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
      };
    }
  }

  /**
   * Fetches a list of currently trending anime.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @returns Promise that resolves to paginated list of trending anime
   */
  async fetchTrending(page: number = 1, perPage: number = 20): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    const variables = {
      page,
      perPage,
    };

    try {
      const response = await this.client.post(this.baseUrl, {
        query: mediaTrendQuery,
        variables,
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
        };
      }

      const pagination = {
        hasNextPage: response.data.data.Page.pageInfo.hasNextPage,
        total: response.data.data.Page.pageInfo.total,
        lastPage: response.data.data.Page.pageInfo.lastPage,
        currentPage: response.data.data.Page.pageInfo.currentPage,
        perPage: response.data.data.Page.pageInfo.perPage,
      };

      const res: IMetaAnime[] = response.data.data.Page.media.map((item: any) => ({
        malId: item.idMal,
        anilistId: item.id,
        bannerImage: item.bannerImage ?? item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
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
      const response = await this.client.post(this.baseUrl, {
        query: relatedQuery,
        variables,
      });

      if (!response.data) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
        };
      }

      const res: IRelatedAnilistData[] = response.data.data.Media.relations.edges
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
          bannerImage: item.node.bannerImage ?? item.node.coverImage.extraLarge ?? item.node.coverImage.large,
          color: item.node.coverImage.color ?? null,
        }));

      return {
        data: res,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: [],
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
      };
    }

    try {
      const variables = {
        mediaId,
        sort: 'RELEVANCE',
        voiceActorsSort2: 'RELEVANCE',
      };

      const response = await this.client.post(this.baseUrl, {
        query: characterQuery,
        variables,
      });

      if (!response.data) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };
      }

      const res: IAnilistCharacters = {
        malId: response.data.data.Media.idMal,
        anilistId: response.data.data.Media.id,
        title: {
          romaji: response.data.data.Media.title.romaji ?? response.data.data.Media.title.userPreferred,
          english: response.data.data.Media.title.english,
          native: response.data.data.Media.title.native,
        },
        characters: response.data.data?.Media.characters.edges.map((item: any) => ({
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
      return { error: 'Missing required params: anilistId', data: null };
    }
    try {
      const variables = {
        mediaId,
      };

      const response = await this.client.post(`${this.baseUrl}`, {
        query: mediaAiringSchedule,
        variables,
      });

      if (!response.data) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };
      }

      const res = {
        malId: response.data.data.AiringSchedule.media.idMal,
        anilistId: response.data.data.AiringSchedule.media.id,

        image:
          response.data.data.AiringSchedule.media.coverImage.extraLarge ??
          response.data.data.AiringSchedule.media.coverImage.large ??
          response.data.data.AiringSchedule.media.coverImage.medium,

        color: response.data.data.AiringSchedule.media.coverImage.color,

        bannerImage:
          response.data.data.AiringSchedule.media.bannerImage ??
          response.data.data.AiringSchedule.media.coverImage.extraLarge ??
          response.data.data.AiringSchedule.media.coverImage.large ??
          response.data.data.AiringSchedule.media.coverImage.medium,

        title: {
          romaji:
            response.data.data.AiringSchedule.media.title.romaji ??
            response.data.data.AiringSchedule.media.title.userPreferred,
          english: response.data.data.AiringSchedule.media.title.english,
          native: response.data.data.AiringSchedule.media.title.native,
        },
        status: response.data.data.AiringSchedule.media.status,
        format: response.data.data.AiringSchedule.media.format,
        duration: response.data.data.AiringSchedule.media.duration,

        releaseDate: response.data.data.AiringSchedule.media.startDate?.year
          ? new Date(
              response.data.data.AiringSchedule.media.startDate.year,
              response.data.data.AiringSchedule.media.startDate.month - 1,
              response.data.data.AiringSchedule.media.startDate.day,
            ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Unknown',

        endDate: response.data.data.AiringSchedule.media.endDate?.year
          ? new Date(
              response.data.data.AiringSchedule.media.endDate.year,
              response.data.data.AiringSchedule.media.endDate.month - 1,
              response.data.data.AiringSchedule.media.endDate.day,
            ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Unknown',

        nextAiringEpisode: response.data.data.AiringSchedule.media.nextAiringEpisode
          ? {
              episode: response.data.data.AiringSchedule.media.nextAiringEpisode.episode,
              id: response.data.data.AiringSchedule.media.nextAiringEpisode.id,
              airingAt: response.data.data.AiringSchedule.media.nextAiringEpisode.airingAt,
              timeUntilAiring: response.data.data.AiringSchedule.media.nextAiringEpisode.timeUntilAiring,
            }
          : null,
      };

      return { data: res as MediaSchedule };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err',
        data: null,
      };
    }
  }

  /**
   * Fetches a paginated list of airing schedules for anime with a minimum score.
   *
   * @param {number} page - The page number to fetch (deafault=1).
   * @param {number} [score=60] - The minimum average or mean score for filtering anime (default: 60).If you have bad taste you can lower this
   * **/
  async fetchAiringSchedule(page: number = 1, score: number = 60): Promise<IBasePaginated<AiringSchedule[] | []>> {
    try {
      const variables = {
        page: page,
        perPage: 50,
        notYetAired: true,
      };
      const response = await this.client.post(this.baseUrl, {
        query: airingSchedule,
        variables,
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
        };
      }

      const res = response.data.data.Page.airingSchedules
        .filter(
          (item: any) =>
            item.media.format === 'TV' &&
            item.media.type === 'ANIME' &&
            (item.media.averageScore >= score || item.media.meanScore >= score),
        )
        .map((item: any) => ({
          malId: item.media.idMal,
          anilistId: item.media.id,
          bannerImage:
            item.media.bannerImage ??
            item.media.coverImage.extraLarge ??
            item.media.coverImage.large ??
            item.media.coverImage.medium,
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
        hasNextPage: response.data.data.Page.pageInfo.hasNextPage,
        currentPage: response.data.data.Page.pageInfo.currentPage,
        data: res,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
      };
    }
  }

  // /**
  //  * Fetches anime information along with a provider-specific anime ID.
  //  *
  //  * @param anilistId - The unique Anilist anime ID (required)
  //  * @param provider - The anime provider to fetch data from (optional, defaults to HiAnime)
  //  * @returns Promise that resolves to provider-specific anime ID and core anime info
  //  */
  // async fetchProviderId(
  //   anilistId: number,
  //   provider: Provider = 'hianime',
  // ): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
  //   if (!anilistId) {
  //     return {
  //       error: 'Invalid or missing required parameter: anilistId!',
  //       data: null,
  //       provider: null,
  //     };
  //   }

  //   try {
  //     switch (provider) {
  //       case 'hianime':
  //         const zoro = await this.fetchZoroProviderId(anilistId);
  //         if ('error' in zoro) {
  //           throw new Error(zoro.error);
  //         }
  //         return { data: zoro.data, provider: zoro.provider };

  //       case 'allanime':
  //         const allanime = await this.fetchAllAnimeProviderId(anilistId);
  //         if ('error ' in allanime) {
  //           throw new Error(allanime.error);
  //         }
  //         return { data: allanime.data, provider: allanime.provider };

  //       case 'animepahe':
  //         const animepahe = await this.fetchAnimepaheProviderId(anilistId);
  //         if ('error ' in animepahe) {
  //           throw new Error(animepahe.error);
  //         }
  //         return { data: animepahe.data, provider: animepahe.provider };
  //       case 'anizone':
  //         const anizone = await this.fetchAnizoneProviderId(anilistId);
  //         if ('error ' in anizone) {
  //           throw new Error(anizone.error);
  //         }
  //         return { data: anizone.data, provider: anizone.provider };
  //       case 'animekai':
  //         const animekai = await this.fetchAnimeKaiProviderId(anilistId);
  //         if ('error' in animekai) {
  //           throw new Error(animekai.error);
  //         }
  //         return { data: animekai.data, provider: animekai.provider };
  //     }
  //   } catch (error) {
  //     return {
  //       error: error instanceof Error ? error.message : 'Unknown error occurred',
  //       data: null,
  //       provider: null,
  //     };
  //   }
  // }

  // /**
  //  * Fetches anime information along with provider-specific episode details using the Anilist ID.
  //  *
  //  * @param anilistId - The unique Anilist ID of the anime (required)
  //  * @param provider - The anime provider to fetch episodes from (optional, defaults to HiAnime)
  //  * @returns Promise that resolves to anime info and its episodes from the specified provider
  //  */
  // async fetchAnimeProviderEpisodes(
  //   anilistId: number,
  //   provider: 'hianime' | 'allanime' | 'animepahe' | 'anizone' | 'animekai' = 'hianime',
  // ): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
  //   if (!anilistId) {
  //     return {
  //       error: 'Invalid or missing required parameter: anilistId!',
  //       data: null,
  //       providerEpisodes: [],
  //     };
  //   }

  //   try {
  //     switch (provider) {
  //       case 'hianime':
  //         const zoro = await this.fetchZoroProviderEpisodes(anilistId);
  //         if ('error' in zoro) {
  //           throw new Error(zoro.error);
  //         }
  //         return { data: zoro.data, providerEpisodes: zoro.providerEpisodes };

  //       case 'allanime':
  //         const allanime = await this.fetchAllAnimeProviderEpisodes(anilistId);
  //         if ('error ' in allanime) {
  //           throw new Error(allanime.error);
  //         }
  //         return { data: allanime.data, providerEpisodes: allanime.providerEpisodes };

  //       case 'animepahe':
  //         const animepahe = await this.fetchPaheProviderEpisodes(anilistId);
  //         if ('error ' in animepahe) {
  //           throw new Error(animepahe.error);
  //         }
  //         return { data: animepahe.data, providerEpisodes: animepahe.providerEpisodes };

  //       case 'anizone':
  //         const anizone = await this.fetchAnizoneProviderEpisodes(anilistId);
  //         if ('error ' in anizone) {
  //           throw new Error(anizone.error);
  //         }
  //         return { data: anizone.data, providerEpisodes: anizone.providerEpisodes };
  //       case 'animekai':
  //         const animekai = await this.fetchAnimekaiProviderEpisodes(anilistId);
  //         if ('error' in animekai) {
  //           throw new Error(animekai.error);
  //         }
  //         return { data: animekai.data, providerEpisodes: animekai.providerEpisodes };
  //     }
  //   } catch (error) {
  //     return {
  //       error: error instanceof Error ? error.message : 'Unknown Err',
  //       data: null,
  //       providerEpisodes: [],
  //     };
  //   }
  // }
}
