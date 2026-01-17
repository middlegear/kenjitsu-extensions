import BaseAnimeMeta from '../../models/anime-meta.js';
import type { IResponse } from '../../types/base.js';

import type {
  IMetaAnime,
  IMetaAnimePaginated,
  IMetaCharacters,
  Seasons,
  JSort,
  IMetaFormat,
  IMetaProviderEpisodesResponse,
  IMetaProviderEpisodes,
  IMetaProviderIdResponse,
  IMetaData,
  Provider,
} from '../../types/meta/meta-anime.js';

/**
 * A class for interacting with the Jikan API (MyAnimeList unofficial API) to search for anime,
 * fetch detailed information, retrieve various top lists (airing, movies, popular, upcoming),
 * seasonal anime, character details, and episode information from MyAnimeList.
 *
 *
 */
export class Jikan extends BaseAnimeMeta {
  constructor() {
    super('jikan');
  }
  /** Base URL for the Jikan API (MyAnimeList unofficial API) */
  private readonly baseUrl: string = 'https://api.jikan.moe/v4';

  /**
   * Maps MyAnimeList anime data to Zoro provider ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  private async fetchZoroProviderId(malId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        provider: null,
      };
    }

    try {
      const mal = await this.fetchInfo(malId);

      let titles: string | null = null;
      let release: string | null = null;

      if (mal.data) {
        titles = mal.data.title.english || mal.data.title.romaji || mal.data.title.native || null;
        release = mal.data.releaseDate;
      }
      if (mal.data?.status.toLowerCase() === 'not yet aired' || mal.data?.status.toLowerCase() === null) {
        throw new Error('No');
      }
      const year = release ? new Date(release).getFullYear() : null;
      const titleSlug = titles ? this.createTitleSlug(titles) : null;

      let malData: IMetaData | null = null;

      if (mal.data) {
        malData = {
          english: mal.data.title.english,
          romaji: mal.data.title.romaji,
          native: mal.data.title.native,
          type: mal.data.format,
          episodes: mal.data.episodes,
          season: mal.data.season,
          year: year as number,
        };
      }

      let zoroResults = null;
      if (titleSlug) {
        const response = await this.hianime.search(titleSlug);
        if (response && response.data.length > 0) {
          zoroResults = response.data;
        }
      }

      return {
        data: mal.data,
        provider: this.mapAnimeProviderId(malData, zoroResults, 'hianime'),
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
   * Maps MyAnimeList anime data to Animekai provider ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  private async fetchAnimekaiProviderId(malId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        provider: null,
      };
    }

    try {
      const mal = await this.fetchInfo(malId);

      let titles: string | null = null;
      let release: string | null = null;

      if (mal.data) {
        titles = mal.data.title.english || mal.data.title.romaji || mal.data.title.native || null;
        release = mal.data.releaseDate;
      }
      if (mal.data?.status.toLowerCase() === 'not yet aired' || mal.data?.status.toLowerCase() === null) {
        throw new Error('No');
      }
      const year = release ? new Date(release).getFullYear() : null;
      const titleSlug = titles ? this.createTitleSlugV2(titles) : null;

      let malData: IMetaData | null = null;

      if (mal.data) {
        malData = {
          english: mal.data.title.english,
          romaji: mal.data.title.romaji,
          native: mal.data.title.native,
          type: mal.data.format,
          episodes: mal.data.episodes,
          season: mal.data.season,
          year: year as number,
        };
      }

      let kaiResults = null;
      if (titleSlug) {
        const response = await this.animekai.search(titleSlug);
        if (response && response.data.length > 0) {
          kaiResults = response.data;
        }
      }

      return {
        data: mal.data,
        provider: this.mapAnimeProviderId(malData, kaiResults, 'animekai'),
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
   * Maps MyAnimeList anime data to Anizone provider ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  private async fetchAnizoneProviderId(malId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        provider: null,
      };
    }

    try {
      const response = await this.malAnizip(malId);
      const mal = await this.fetchInfo(malId);

      let release: string | null = null;

      if (mal.data) {
        release = mal.data.releaseDate;
      }

      const year = release ? new Date(release).getFullYear() : null;
      const titles =
        response.titles?.japanese ||
        response.titles?.simplifiedChinese ||
        response.titles?.romanized ||
        response.titles?.traditionalChinese;

      let malData: IMetaData | null = null;
      if (mal.data?.status.toLowerCase() === 'not yet aired' || mal.data?.status.toLowerCase() === null) {
        throw new Error('No');
      }
      if (mal.data) {
        malData = {
          english: mal.data.title.english,
          romaji: mal.data.title.romaji,
          native: mal.data.title.native,
          type: mal.data.format,
          episodes: mal.data.episodes,
          season: mal.data.season,
          year: year as number,
        };
      }

      let result = null;
      if (titles) {
        const response = await this.anizone.search(titles);
        if (response && response.data.length > 0) {
          result = response.data;
        }
      }

      return {
        data: mal.data,
        provider: this.mapAnimeProviderId(malData, result, 'anizone'),
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
   * Maps MyAnimeList anime data to AllAnime provider ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  private async fetchAllAnimeProviderId(malId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        provider: null,
      };
    }

    try {
      const mal = await this.fetchInfo(malId);

      let titles: string | null = null;
      let release: string | null = null;

      if (mal.data) {
        titles = mal.data.title.english || mal.data.title.romaji || mal.data.title.native || null;
        release = mal.data.releaseDate;
      }
      if (mal.data?.status.toLowerCase() === 'not yet aired' || mal.data?.status.toLowerCase() === null) {
        throw new Error('No');
      }
      const year = release ? new Date(release).getFullYear() : null;

      let malData: IMetaData | null = null;

      if (mal.data) {
        malData = {
          english: mal.data.title.english,
          romaji: mal.data.title.romaji,
          native: mal.data.title.native,
          type: mal.data.format,
          episodes: mal.data.episodes,
          season: mal.data.season,
          year: year as number,
        };
      }

      let allAnimeResults = null;

      if (titles) {
        const response = await this.allanime.search(titles);
        if (response && response.data.length > 0) {
          allAnimeResults = response.data;
        }
      }

      return {
        data: mal.data,
        provider: this.mapAnimeProviderId(malData, allAnimeResults, 'allanime'),
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
   * Maps MyAnimeList anime data to AnimePahe provider ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to provider mapping data
   */
  private async fetchAnimepaheProviderId(malId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        provider: null,
      };
    }

    try {
      const mal = await this.fetchInfo(malId);

      let titles: string | null = null;
      let release: string | null = null;

      if (mal.data) {
        titles = mal.data.title.english || mal.data.title.romaji || mal.data.title.native || null;
        release = mal.data.releaseDate;
      }
      if (mal.data?.status.toLowerCase() === 'not yet aired' || mal.data?.status.toLowerCase() === null) {
        throw new Error('No');
      }
      const year = release ? new Date(release).getFullYear() : null;
      const titleSlug = titles ? this.createTitleSlug(titles) : null;

      let malData: IMetaData | null = null;

      if (mal.data) {
        malData = {
          english: mal.data.title.english,
          romaji: mal.data.title.romaji,
          native: mal.data.title.native,
          type: mal.data.format,
          episodes: mal.data.episodes,
          season: mal.data.season,
          year: year as number,
        };
      }

      let paheResults = null;
      if (titleSlug) {
        const response = await this.animepahe.search(titleSlug);
        if (response && response.data.length > 0) {
          paheResults = response.data;
        }
      }

      return {
        data: mal.data,
        provider: this.mapAnimeProviderId(malData, paheResults, 'animepahe'),
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
   * Fetches episodes from AllAnime provider and enriches with Anizip data for a given MAL ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  private async fetchAllAnimeProviderEpisodes(malId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const initialResponse = await this.fetchAllAnimeProviderId(malId);
      if (!initialResponse.provider?.id) {
        return {
          error: 'Provider not found for given MAL ID.',
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const [allanimeResult, anizipResult] = await Promise.allSettled([
        this.allanime.fetchEpisodes(initialResponse.provider?.id as string),
        this.malAnizip(malId),
      ]);

      if (allanimeResult.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${allanimeResult.reason}`,
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const allanime = allanimeResult.value;
      const anizipEpisodes = anizipResult.status === 'fulfilled' ? anizipResult.value.episodes : [];
      const aniZipMap = new Map((anizipEpisodes || []).map(item => [item.episodeAnizipNumber, item]));

      const enrichedEpisodes = allanime.data
        .filter((ep: any) => typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber) && ep.episodeNumber > 0)
        .map((episode: any) => {
          const aniZipEpisode = aniZipMap.get(episode.episodeNumber) ?? null;
          return this.mergeEpisodeData(episode, aniZipEpisode, 'allanime');
        });

      return {
        data: initialResponse.data,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        providerEpisodes: [],
      };
    }
  }

  /**
   * Fetches episodes from AllAnime provider and enriches with Anizip data for a given MAL ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  private async fetchAnizoneProviderEpisodes(malId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const initialResponse = await this.fetchAnizoneProviderId(malId);
      if (!initialResponse.provider?.id) {
        return {
          error: 'Provider not found for given MAL ID.',
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const [anizoneResult, anizipResult] = await Promise.allSettled([
        this.anizone.fetchAnimeInfo(initialResponse.provider?.id as string),
        this.malAnizip(malId),
      ]);

      if (anizoneResult.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${anizoneResult.reason}`,
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const anizipEpisodes = anizipResult.status === 'fulfilled' ? anizipResult.value.episodes : [];
      const aniZipMap = new Map((anizipEpisodes || []).map(item => [item.episodeAnizipNumber, item]));

      const enrichedEpisodes = anizoneResult.value.providerEpisodes
        .filter((ep: any) => typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber))
        .map((episode: any) => {
          const aniZipEpisode = aniZipMap.get(episode.episodeNumber) ?? null;
          return this.mergeEpisodeData(episode, aniZipEpisode, 'anizone');
        });

      return {
        data: initialResponse.data,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        providerEpisodes: [],
      };
    }
  }

  /**
   * Fetches episodes from HiAnime (Zoro) provider and enriches with Anizip data for a given MAL ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  private async fetchZoroProviderEpisodes(malId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const initialResponse = await this.fetchZoroProviderId(malId);
      if (!initialResponse.provider?.id) {
        return {
          error: 'Provider not found for given mal ID.',
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const [hianimeResult, anizipResult] = await Promise.allSettled([
        this.hianime.fetchEpisodes(initialResponse.provider?.id as string),
        this.malAnizip(malId),
      ]);

      if (hianimeResult.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${hianimeResult.reason}`,
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const hianime = hianimeResult.value;
      const anizipEpisodes = anizipResult.status === 'fulfilled' ? anizipResult.value.episodes : [];
      const aniZipMap = new Map((anizipEpisodes || []).map(item => [item.episodeAnizipNumber, item]));

      const enrichedEpisodes = hianime.data.map((episode: any) => {
        const aniZipEpisode = aniZipMap.get(episode.episodeNumber);
        return this.mergeEpisodeData(episode, aniZipEpisode, 'hianime & kaido');
      });

      return {
        data: initialResponse.data,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        providerEpisodes: [],
      };
    }
  }
  /**
   * Fetches episodes from Animekai provider and enriches with Anizip data for a given MAL ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  private async fetchAnimekaiProviderEpisodes(malId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const initialResponse = await this.fetchAnimekaiProviderId(malId);
      if (!initialResponse.provider?.id) {
        return {
          error: 'Provider not found for given mal ID.',
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const [animekaiResult, anizipResult] = await Promise.allSettled([
        this.animekai.fetchAnimeInfo(initialResponse.provider?.id as string),
        this.malAnizip(malId),
      ]);

      if (animekaiResult.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${animekaiResult.reason}`,
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const animekai = animekaiResult.value;
      const anizipEpisodes = anizipResult.status === 'fulfilled' ? anizipResult.value.episodes : [];
      const aniZipMap = new Map((anizipEpisodes || []).map(item => [item.episodeAnizipNumber, item]));

      const enrichedEpisodes = animekai.providerEpisodes.map((episode: any) => {
        const aniZipEpisode = aniZipMap.get(episode.episodeNumber);
        return this.mergeEpisodeData(episode, aniZipEpisode, 'animekai');
      });

      return {
        data: initialResponse.data,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        providerEpisodes: [],
      };
    }
  }

  /**
   * Fetches episodes from AnimePahe provider and enriches with Anizip data for a given MAL ID.
   *
   * @private
   * @param malId - The MyAnimeList ID of the anime
   * @returns Promise resolving to episode data enriched with additional metadata
   */
  private async fetchPaheProviderEpisodes(malId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const initialResponse = await this.fetchAnimepaheProviderId(malId);
      if (!initialResponse.provider?.id) {
        return {
          error: 'Provider not found for given AniList ID.',
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const [paheResult, anizipResult] = await Promise.allSettled([
        this.animepahe.fetchEpisodes(initialResponse.provider?.id as string),
        this.malAnizip(malId),
      ]);

      if (paheResult.status === 'rejected') {
        return {
          error: `Failed to fetch provider episodes: ${paheResult.reason}`,
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const animepahe = paheResult.value;
      const anizipEpisodes = anizipResult.status === 'fulfilled' ? anizipResult.value.episodes : [];
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
        data: initialResponse.data,
        providerEpisodes: enrichedEpisodes as IMetaProviderEpisodes[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        providerEpisodes: [],
      };
    }
  }

  /**
   * Searches for anime titles based on the provided query string using Jikan API.
   *
   * @param query - The search query string (required)
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20, maximum 25)
   * @returns Promise that resolves to paginated search results containing anime data
   */
  async search(query: string, page: number = 1, perPage: number = 20): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
        error: 'Missing required fields : search',
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/anime`, {
        params: {
          q: query,
          page: String(page),
          limit: String(perPage),
        },
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
        hasNextPage: response.data.pagination.has_next_page,
        lastPage: response.data.pagination.last_visible_page,
        currentPage: page,
        perPage: response.data.pagination.items.per_page,
      };

      const search: IMetaAnime[] = response.data.data.map((item: any) => ({
        malId: item.mal_id,
        title: {
          romaji: item.title,
          english: item.title_english,
          native: item.title_japanese,
        },
        image:
          item.images.webp.large_image_url ||
          item.images.jpg.large_image_url ||
          item.images.jpg.image_url ||
          item.images.webp.image_url ||
          item.images.webp.small_image_url ||
          item.images.jpg.small_image_url,

        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,
        releaseDate:
          item.aired.prop && item.aired.prop.from.year
            ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.from || 'Unknown',

        endDate:
          item.aired.prop && item.aired.prop.to.year
            ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.to || 'Unknown',
        format: item.type,
        status: item.status,
        genres: item.genres.map((item2: any) => item2.name),
        duration: item.duration,
        score: item.score,
        synopsis: item.synopsis,
        season: item.season,
        studio: item.studios,
        producers: item.producers,
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: search as IMetaAnime[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err ',
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime using its MyAnimeList (MAL) ID.
   *
   * @param malId - The unique MyAnimeList (MAL) ID for the anime (required)
   * @returns Promise that resolves to comprehensive detailed anime information
   */
  async fetchInfo(malId: number): Promise<IResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Missing required parameter : MALId!',
        data: null,
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/anime/${malId}`);

      if (!response.data) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };
      }

      const animeInfo: IMetaAnime = {
        malId: response.data.data.mal_id,
        title: {
          romaji: response.data.data.title,
          english: response.data.data.title_english,
          native: response.data.data.title_japanese,
        },
        image:
          response.data.data.images.webp.large_image_url ||
          response.data.data.images.jpg.large_image_url ||
          response.data.data.images.jpg.image_url ||
          response.data.data.images.webp.image_url ||
          response.data.data.images.webp.small_image_url ||
          response.data.data.images.jpg.small_image_url,

        trailer: response.data.data.trailer.embed_url ?? response.data.data.trailer.url,
        episodes: response.data.data.episodes,

        releaseDate:
          response.data.data.aired.prop && response.data.data.aired.prop.from.year
            ? new Date(
                response.data.data.aired.prop.from.year,
                response.data.data.aired.prop.from.month - 1,
                response.data.data.aired.prop.from.day,
              ).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : response.data.data.aired.from || 'Unknown',

        endDate:
          response.data.data.aired.prop && response.data.data.aired.prop.to.year
            ? new Date(
                response.data.data.aired.prop.to.year,
                response.data.data.aired.prop.to.month - 1,
                response.data.data.aired.prop.to.day,
              ).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : response.data.data.aired.to || 'Unknown',
        format: response.data.data.type,
        status: response.data.data.status || null,
        genres: response.data.data.genres.map((item2: any) => item2.name),
        duration: response.data.data.duration,
        score: response.data.data.score,
        synopsis: response.data.data.synopsis,
        season: response.data.data.season,
        studio: response.data.data.studios,
        producers: response.data.data.producers,
      };

      return {
        data: animeInfo,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        data: null,
      };
    }
  }

  /**
   * Fetches characters associated with a specific anime from MyAnimeList.
   *
   * @param malId - The unique MyAnimeList (MAL) ID for the anime (required)
   * @returns Promise that resolves to anime characters with voice actor information
   */
  async fetchAnimeCharacters(malId: number): Promise<IResponse<IMetaCharacters[] | []>> {
    if (!malId) {
      return {
        error: 'Missing required parameter : MALId!',
        data: [],
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/anime/${malId}/characters`);

      if (!response.data) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
        };
      }

      const res: IMetaCharacters[] = response.data.data.map((item: any) => ({
        role: item.role,
        id: item.character.mal_id,
        name: item.character.name,
        image:
          item.character.images.jpg.image_url ??
          item.character.images.webp.image_url ??
          item.character.images.webp.small_image_url,

        voiceActors: item.voice_actors.map((item2: any) => ({
          name: item2.person.name,
          image: item2.person.images.jpg.image_url,
          language: item2.language,
        })),
      }));

      return {
        data: res as IMetaCharacters[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        data: [],
      };
    }
  }

  /**
   * Fetches the anime list for the current season from MyAnimeList.
   *
   * @param page - The page number for pagination (required)
   * @param perPage - The number of results per page (required, maximum 25)
   * @param format - The format type to filter by (optional, defaults to TV)
   * @returns Promise that resolves to paginated list of current seasonal anime
   */
  async fetchCurrentSeason(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    if (!format) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: 'Missing required parameter : Format!',
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/seasons/now`, {
        params: {
          filter: format.toLowerCase(),
          page: String(page),
          sfw: 'true',
          limit: String(perPage),
        },
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

      const res = response.data;
      const pagination = {
        hasNextPage: res.pagination.has_next_page,
        lastPage: res.pagination.last_visible_page,
        currentPage: page,
        perPage: res.pagination.items.per_page,
      };

      const currentSeason: IMetaAnime[] = res.data.map((item: any) => ({
        malId: item.mal_id,
        title: {
          romaji: item.title,
          english: item.title_english,
          native: item.title_japanese,
        },
        image:
          item.images.webp.large_image_url ||
          item.images.jpg.large_image_url ||
          item.images.jpg.image_url ||
          item.images.webp.image_url ||
          item.images.webp.small_image_url ||
          item.images.jpg.small_image_url,
        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,
        releaseDate:
          item.aired.prop && item.aired.prop.from.year
            ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.from || 'Unknown',

        endDate:
          item.aired.prop && item.aired.prop.to.year
            ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.to || 'Unknown',
        format: item.type,
        status: item.status,
        genres: item.genres.map((item2: any) => item2.name),
        duration: item.duration,
        score: item.score,
        synopsis: item.synopsis,
        season: item.season,
        studio: item.studios,
        producers: item.producers,
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: currentSeason,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err ',
      };
    }
  }

  /**
   * Fetches the anime list for the upcoming season from MyAnimeList.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20, maximum 25)
   * @param format - The format type to filter by (optional, defaults to TV)
   * @returns Promise that resolves to paginated list of upcoming season's anime
   */
  async fetchNextSeason(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    if (!format) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: 'Missing required parameter : Format!',
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/seasons/upcoming`, {
        params: {
          filter: format.toLowerCase(),
          sfw: 'true',
          page: String(page),
          limit: String(perPage),
        },
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

      const res = response.data;
      const pagination = {
        hasNextPage: res.pagination.has_next_page,
        lastPage: res.pagination.last_visible_page,
        currentPage: page,
        total: res.pagination.items.total,
        perPage: res.pagination.items.per_page,
      };

      const NextSeason: IMetaAnime[] = res.data.map((item: any) => ({
        malId: item.mal_id,
        title: {
          romaji: item.title,
          english: item.title_english,
          native: item.title_japanese,
        },
        image:
          item.images.webp.large_image_url ||
          item.images.jpg.large_image_url ||
          item.images.jpg.image_url ||
          item.images.webp.image_url ||
          item.images.webp.small_image_url ||
          item.images.jpg.small_image_url,

        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,
        releaseDate:
          item.aired.prop && item.aired.prop.from.year
            ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.from || 'Unknown',

        endDate:
          item.aired.prop && item.aired.prop.to.year
            ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.to || 'Unknown',
        format: item.type,
        status: item.status,
        genres: item.genres.map((item2: any) => item2.name),
        duration: item.duration,
        score: item.score,
        synopsis: item.synopsis,
        season: item.season,
        studio: item.studios,
        producers: item.producers,
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: NextSeason as IMetaAnime[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err ',
      };
    }
  }

  /**
   * Fetches seasonal anime for a given year and season from MyAnimeList.
   *
   * @param season - The target season (e.g., WINTER, SPRING, SUMMER, FALL) (required)
   * @param year - The target year (e.g., 2023, 2024) (required)
   * @param format - The anime format to filter by (optional, defaults to TV)
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20, maximum 25)
   * @returns Promise that resolves to paginated list of seasonal anime
   */
  async fetchSeasonalAnime(
    season: Seasons,
    year: number,
    format: IMetaFormat = 'TV',
    page: number = 1,
    perPage: number = 20,
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    if (!year || !season) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: 'Missing required parameter : year or season',
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/seasons/${year}/${season.toLowerCase()}`, {
        params: {
          filter: format,
          sfw: 'true',
          page: String(page),
          limit: String(perPage),
        },
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

      const res = response.data;
      const pagination = {
        hasNextPage: res.pagination.has_next_page,
        lastPage: res.pagination.last_visible_page,
        currentPage: page,
        perPage: res.pagination.items.per_page,
      };

      const Season: IMetaAnime[] = res.data.map((item: any) => ({
        malId: item.mal_id,
        title: {
          romaji: item.title,
          english: item.title_english,
          native: item.title_japanese,
        },
        image:
          item.images.webp.large_image_url ||
          item.images.jpg.large_image_url ||
          item.images.jpg.image_url ||
          item.images.webp.image_url ||
          item.images.webp.small_image_url ||
          item.images.jpg.small_image_url,

        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,

        releaseDate:
          item.aired.prop && item.aired.prop.from.year
            ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.from || 'Unknown',

        endDate:
          item.aired.prop && item.aired.prop.to.year
            ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.to || 'Unknown',
        format: item.type,
        status: item.status,
        genres: item.genres.map((item2: any) => item2.name),
        duration: item.duration,
        score: item.score,
        synopsis: item.synopsis,
        season: item.season,
        studio: item.studios,
        producers: item.producers,
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: Season as IMetaAnime[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err ',
      };
    }
  }

  /**
   * Fetches a list of the top-rated anime from MyAnimeList.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20)
   * @param format - The anime format to filter by (optional, defaults to TV)
   * @param sort - The sorting criteria (optional, defaults to 'rating')
   * @returns Promise that resolves to paginated list of top-rated anime
   */
  async fetchTopAnime(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
    sort: JSort = 'rating',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    try {
      const params: Record<string, string> = {
        type: format.toLowerCase(),
        sfw: 'true',
        page: String(page),
        limit: String(perPage),
      };

      if (sort !== 'rating') {
        params.filter = sort;
      }

      const response = await this.client.get(`${this.baseUrl}/top/anime`, { params });

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

      const res = response.data;
      const pagination = {
        hasNextPage: res.pagination.has_next_page,
        lastPage: res.pagination.last_visible_page,
        currentPage: page,
        total: res.pagination.items.total,
        perPage: res.pagination.items.per_page,
      };

      const topAnime: IMetaAnime[] = res.data.map((item: any) => ({
        malId: item.mal_id,
        title: {
          romaji: item.title,
          english: item.title_english,
          native: item.title_japanese,
        },
        image:
          item.images.webp.large_image_url ||
          item.images.jpg.large_image_url ||
          item.images.jpg.image_url ||
          item.images.webp.image_url ||
          item.images.webp.small_image_url ||
          item.images.jpg.small_image_url,

        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,

        releaseDate:
          item.aired.prop && item.aired.prop.from.year
            ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.from || 'Unknown',

        endDate:
          item.aired.prop && item.aired.prop.to.year
            ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            : item.aired.to || 'Unknown',
        format: item.type,
        status: item.status,
        genres: item.genres.map((item2: any) => item2.name),
        duration: item.duration,
        score: item.score,
        synopsis: item.synopsis,
        season: item.season,
        studio: item.studios,
        producers: item.producers,
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        perPage: pagination.perPage,
        data: topAnime as IMetaAnime[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err ',
      };
    }
  }

  /**
   * Fetches a list of the top airing anime from MyAnimeList.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20, maximum 25)
   * @param format - The format type to filter by (optional, defaults to TV)
   * @returns Promise that resolves to paginated list of top airing anime
   */
  async fetchTopAiring(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
    sort: JSort = 'airing',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopAnime(page, perPage, format, sort);
  }
  /**
   * Fetches a list of the most anticipated upcoming anime from MyAnimeList.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20, maximum 25)
   * @param format - The format type to filter by (optional, defaults to TV)
   * @returns Promise that resolves to paginated list of upcoming anime resources
   */
  async fetchTopUpcoming(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
    sort: JSort = 'upcoming',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopAnime(page, perPage, format, sort);
  }

  /**
   * Fetches a list of the most popular anime from MyAnimeList.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20, maximum 25)
   * @param format - The format type to filter by (optional, defaults to TV)
   * @param sort - The sorting criteria (optional, defaults to 'bypopularity')
   * @returns Promise that resolves to paginated list of most popular anime
   */
  async fetchMostPopular(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
    sort: JSort = 'bypopularity',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopAnime(page, perPage, format, sort);
  }

  /**
   * Fetches a list of the most favorite anime from MyAnimeList.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @param perPage - The number of results per page (optional, defaults to 20, maximum 25)
   * @param format - The format type to filter by (optional, defaults to TV)
   * @param sort - The sorting criteria (optional, defaults to 'bypopularity')
   * @returns Promise that resolves to paginated list of most favorite anime
   */
  async fetchMostFavorite(
    page: number = 1,
    perPage: number = 20,
    format: IMetaFormat = 'TV',
    sort: JSort = 'favorite',
  ): Promise<IMetaAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopAnime(page, perPage, format, sort);
  }

  /**
   * Fetches anime information along with a provider-specific anime ID for MyAnimeList entries.
   *
   * @param malId - The unique MyAnimeList anime ID (required)
   * @param provider - The anime provider to fetch data from (optional, defaults to HiAnime)
   * @returns Promise that resolves to provider-specific anime ID and core anime info
   */
  async fetchProviderId(
    malId: number,
    provider: 'hianime' | 'allanime' | 'animepahe' | 'anizone' | 'animekai' = 'hianime',
  ): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        provider: null,
      };
    }

    try {
      switch (provider) {
        case 'hianime':
          const zoro = await this.fetchZoroProviderId(malId);
          if ('error' in zoro) {
            throw new Error(zoro.error);
          }
          return { data: zoro.data, provider: zoro.provider };

        case 'allanime':
          const allanime = await this.fetchAllAnimeProviderId(malId);
          if ('error ' in allanime) {
            throw new Error(allanime.error);
          }
          return { data: allanime.data, provider: allanime.provider };

        case 'animepahe':
          const animepahe = await this.fetchAnimepaheProviderId(malId);
          if ('error ' in animepahe) {
            throw new Error(animepahe.error);
          }
          return { data: animepahe.data, provider: animepahe.provider };

        case 'anizone':
          const anizone = await this.fetchAnizoneProviderId(malId);
          if ('error ' in anizone) {
            throw new Error(anizone.error);
          }
          return { data: anizone.data, provider: anizone.provider };

        case 'animekai':
          const animekai = await this.fetchAnimekaiProviderId(malId);
          if ('error ' in animekai) {
            throw new Error(animekai.error);
          }
          return { data: animekai.data, provider: animekai.provider };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
      };
    }
  }

  /**
   * Fetches anime information along with provider-specific episode details using the MAL ID.
   *
   * @param malId - The unique MAL ID of the anime (required)
   * @param provider - The anime provider to fetch episodes from (optional, defaults to HiAnime)
   * @returns Promise that resolves to anime info and its episodes from the specified provider
   */
  async fetchAnimeProviderEpisodes(
    malId: number,
    provider: 'hianime' | 'allanime' | 'animepahe' | 'anizone' | 'animekai' = 'hianime',
  ): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!malId) {
      return {
        error: 'Invalid or missing required parameter: malId!',
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      switch (provider) {
        case 'hianime':
          const zoro = await this.fetchZoroProviderEpisodes(malId);
          if ('error' in zoro) {
            throw new Error(zoro.error);
          }
          return { data: zoro.data, providerEpisodes: zoro.providerEpisodes };

        case 'allanime':
          const allanime = await this.fetchAllAnimeProviderEpisodes(malId);
          if ('error ' in allanime) {
            throw new Error(allanime.error);
          }
          return { data: allanime.data, providerEpisodes: allanime.providerEpisodes };

        case 'animepahe':
          const animepahe = await this.fetchPaheProviderEpisodes(malId);
          if ('error ' in animepahe) {
            throw new Error(animepahe.error);
          }
          return { data: animepahe.data, providerEpisodes: animepahe.providerEpisodes };

        case 'anizone':
          const anizone = await this.fetchAnizoneProviderEpisodes(malId);
          if ('error ' in anizone) {
            throw new Error(anizone.error);
          }
          return { data: anizone.data, providerEpisodes: anizone.providerEpisodes };

        case 'animekai':
          const animekai = await this.fetchAnimekaiProviderEpisodes(malId);
          if ('error ' in animekai) {
            throw new Error(animekai.error);
          }
          return { data: animekai.data, providerEpisodes: animekai.providerEpisodes };
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Err',
        providerEpisodes: [],
      };
    }
  }
}
