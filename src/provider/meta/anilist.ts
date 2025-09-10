import { Meta } from '../../models/base-meta.js';
import type {
  AnilistStatus,
  AnimeProvider,
  Format,
  HISubOrDub,
  IAnilistCharacters,
  IAnimePaginated,
  IMetaAnime,
  IMetaProviderEpisodesResponse,
  IMetaProviderIdResponse,
  IRelatedAnilistData,
  IResponse,
  ITitle,
  Seasons,
  Sort,
} from '../../models/types.js';
import {
  characterQuery,
  fetchByIdQuery,
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
 */
export class Anilist extends Meta {
  private readonly baseUrl: string = 'https://graphql.anilist.co';
  constructor() {
    super();
  }
  private async fetchAllAnimeProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
      };
    }
    try {
      const initialResponse = await this.fetchAllAnimeProviderId(anilistId);
      if (!initialResponse.provider?.id) {
        return {
          error: 'Provider not found for given AniList ID.',
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const [allanimeResult, anizipResult] = await Promise.allSettled([
        this.fetchAllAnimeEpisodes(initialResponse.provider?.id as string),
        this.anilistAnizip(anilistId),
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

      const enrichedEpisodes = allanime.map((episode: any) => {
        const aniZipEpisode = aniZipMap.get(episode.episodeNumber);
        return this.mergeEpisodeData(episode, aniZipEpisode);
      });

      return {
        data: initialResponse.data,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Err',
        providerEpisodes: [],
      };
    }
  }
  private async fetchZoroProviderEpisodes(anilistId: number): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
      };
    }
    try {
      const initialResponse = await this.fetchZoroProviderId(anilistId);
      if (!initialResponse.provider?.id) {
        return {
          error: 'Provider not found for given AniList ID.',
          data: initialResponse.data,
          providerEpisodes: [],
        };
      }

      const [hianimeResult, anizipResult] = await Promise.allSettled([
        this.fetchZoroEpisodes(initialResponse.provider?.id as string),
        this.anilistAnizip(anilistId),
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

      const enrichedEpisodes = hianime.map((episode: any) => {
        const aniZipEpisode = aniZipMap.get(episode.episodeNumber);
        return this.mergeEpisodeData(episode, aniZipEpisode);
      });

      return {
        data: initialResponse.data,
        providerEpisodes: enrichedEpisodes,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Err',
        providerEpisodes: [],
      };
    }
  }
  private async fetchZoroProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
      };
    }
    try {
      const anilist = await this.fetchInfo(anilistId);
      const titles = anilist.data?.title as ITitle;
      const userPref = titles?.english || titles?.romaji || titles?.native;
      const titleSlug = this.createSlug(userPref as string);

      const zoroResults = await this.searchZoro(titleSlug);

      return {
        data: anilist.data,
        provider: this.mapAnimeId(titles, zoroResults),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        provider: null,
      };
    }
  }

  private async fetchAllAnimeProviderId(anilistId: number): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
      };
    }
    try {
      const anilist = await this.fetchInfo(anilistId);
      const titles = anilist.data?.title as ITitle;
      const userPref = titles?.english || titles?.romaji || titles?.native;
      const titleSlug = this.createSlug(userPref as string);
      const allanimeResults = await this.searchAllAnime(titleSlug);

      return {
        data: anilist.data,
        provider: this.mapAnimeId(titles, allanimeResults),
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
   * Searches for anime based on the provided query string.
   * @param {string} search - The search query string (required).
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20).
   * @returns  A promise that resolves to an object containing an array of anime related to the search query.
   */
  async search(search: string, page: number = 1, perPage: number = 20): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    if (!search) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
        error: 'Missing required fields : search query',
      };
    }
    try {
      const variables = { search, page, perPage, type: 'ANIME', isAdult: false };
      const response = await this.client.post(this.baseUrl, {
        query: searchQuery,
        variables,
      });
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          data: [],
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
        };
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
        startDate:
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
        error: error instanceof Error ? error.message : 'Internal Server Error ',
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime using its Anilist ID.
   * @param {number} id - The unique Anilist anime ID (required).
   * @returns  A promise that resolves to an object containing detailed anime information.
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

      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };

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
        status: response.data.data.Media.status,
        duration: response.data.data.Media.duration,
        score: response.data.data.Media.meanScore ?? response.data.data.media.averageScore,
        genres: response.data.data.Media.genres,
        episodes: response.data.data.Media.episodes,
        synopsis: response.data.data.Media.description,
        season: response.data.data.Media.season,
        startDate:
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
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20).
   * @param {Sort} [sort]  - The sorting order for results.(optional, defaults to POPULARITY_DESC )
   * @returns  A promise that resolves to an object containing an array of upcoming anime.
   */
  async fetchTopUpcoming(
    page: number = 1,
    perPage: number = 20,
    sort: Sort = 'POPULARITY_DESC',
    status: AnilistStatus = 'NOT_YET_RELEASED',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    try {
      const variables = { page, perPage, type: 'ANIME', status, isAdult: false, sort };
      const response = await this.client.post(this.baseUrl, {
        query: topQuery,
        variables,
      });
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
        };
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
        startDate:
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
        error: error instanceof Error ? error.message : 'Unknown Err',
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
      };
    }
  }
  /**
   * Fetches a list of the top airing anime.
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20).
   * @param {Sort} [sort]  - The sorting order for results.(optional, defaults to POPULARITY_DESC )
   * @returns  A promise that resolves to an object containing an array of top-airing anime.
   */
  async fetchTopAiring(
    page: number = 1,
    perPage: number = 20,
    sort: Sort = 'POPULARITY_DESC',
    status: AnilistStatus = 'RELEASING',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopUpcoming(page, perPage, sort, status);
  }

  /**
   * Fetches a list of the most popular anime.
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20).
   * @param {Format} [format] - The anime format to filter by (optional, defaults to TV).
   * @param {Sort} [sort]  - The sorting order for results.(optional, defaults to POPULARITY_DESC )
   * @returns A promise that resolves to an object containing an array of popular anime.
   */
  async fetchMostPopular(
    page: number = 1,
    perPage: number = 20,
    format: Format = 'TV',
    sort: Sort = 'POPULARITY_DESC',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    try {
      const variables = { page, perPage, type: 'ANIME', format, isAdult: false, sort };
      const response = await this.client.post(this.baseUrl, {
        query: popularAnimeQuery,
        variables,
      });

      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
        };
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
        startDate:
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
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20).
   * @param {Format} [format] - The anime format to filter by (optional, defaults to TV).
   * @param {Sort} [sort]  - The sorting order for results.(optional, defaults to SCORE_DESC )
   * @returns  A promise that resolves to an object containing an array of top-rated anime.
   */
  async fetchTopRatedAnime(
    page: number = 1,
    perPage: number = 20,
    format: Format = 'TV',
    sort: Sort = 'SCORE_DESC',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchMostPopular(page, perPage, format, sort);
  }

  /**
   * Fetches seasonal anime for a given year and season.
   * @param {Seasons} season - The target season (e.g., WINTER, SPRING, SUMMER, FALL) (required).
   * @param {number} seasonYear - The target year (e.g., 2023, 2024) (required).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage=20] - The number of results per page (optional, defaults to 20).
   * @param {Format} [format=Format.TV] - The anime format to filter by (optional, defaults to TV).
   * @returns  A promise that resolves to an object containing an array of seasonal anime.
   */
  async fetchSeasonalAnime(
    season: Seasons,
    seasonYear: number,
    page: number = 1,
    perPage: number = 20,
    format: Format = 'TV',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    if (!season || !seasonYear) {
      return {
        error: 'Missing a required param : season | seasonYear',
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        perPage: 0,
        data: [],
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
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
        };
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
        startDate:
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
   * Fetches a list of currently trending anime.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage=20] - The number of results per page (optional, defaults to 20).
   * @returns  A promise that resolves to an object containing an array of trending anime.
   */
  async fetchTrending(page: number = 1, perPage: number = 20): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    const variables = {
      page,
      perPage,
    };
    try {
      const response = await this.client.post(this.baseUrl, {
        query: mediaTrendQuery,
        variables,
      });
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
        };
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
        startDate:
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
   * Fetches anime titles related to a specific anime ID, such as sequels, prequels, or spin-offs.
   * @param {number} mediaId - The unique Anilist anime ID (required).
   * @returns  A promise that resolves to an object containing an array of related anime information.
   */
  async fetchRelatedAnime(mediaId: number): Promise<IResponse<IRelatedAnilistData[] | []>> {
    if (!mediaId)
      return {
        data: [],
        error: 'Missing a required param : season | seasonYear',
      };
    const variables = {
      mediaId,
      type: 'ANIME',
    };
    try {
      const response = await this.client.post(this.baseUrl, {
        query: relatedQuery,
        variables,
      });
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
        };

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
   * @param {number} mediaId - The unique Anilist anime ID (required).
   * @returns A promise that resolves to an object containing an array of anime characters and their voice actors.
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
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };
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
   * Fetches anime information along with a provider-specific anime ID. Kind of depends on provider availability
   * This is useful for linking Anilist entries to external streaming provider IDs.
   * @param {number} anilistId - The unique Anilist anime ID (required).
   * @param {AnimeProvider} [provider] - The anime provider to fetch data from (optional, defaults to HiAnime)
   * @returns  A promise that resolves to an object containing the provider-specific anime ID and core anime info.
   */
  async fetchProviderId(
    anilistId: number,
    provider: AnimeProvider = 'hianime',
  ): Promise<IMetaProviderIdResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        provider: null,
      };
    }
    try {
      switch (provider) {
        case 'hianime':
          const zoro = await this.fetchZoroProviderId(anilistId);
          if ('error' in zoro) {
            throw new Error(zoro.error);
          }
          return { data: zoro.data, provider: zoro.provider };
        case 'allanime':
          const allanime = await this.fetchAllAnimeProviderId(anilistId);
          if ('error ' in allanime) {
            throw new Error(allanime.error);
          }
          return { data: allanime.data, provider: allanime.provider };
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
   * Fetches anime information along with provider-specific episode details using the Anilist ID.
   * This is used to get streamable episodes from a given provider.
   * @param {number} anilistId - The unique Anilist ID of the anime (required).
   * @param {AnimeProvider} [provider] - The anime provider to fetch episodes from (optional, defaults to HiAnime)
   * @returns  A promise that resolves to an object containing anime info and its episodes from the specified provider.
   */

  async fetchAnimeProviderEpisodes(
    anilistId: number,
    provider: AnimeProvider = 'hianime',
  ): Promise<IMetaProviderEpisodesResponse<IMetaAnime | null>> {
    if (!anilistId) {
      return {
        error: 'Invalid or missing required parameter: anilistId!',
        data: null,
        providerEpisodes: [],
      };
    }
    try {
      switch (provider) {
        case 'hianime':
          const zoro = await this.fetchZoroProviderEpisodes(anilistId);
          if ('error' in zoro) {
            throw new Error(zoro.error);
          }
          return { data: zoro.data, providerEpisodes: zoro.providerEpisodes };
        case 'allanime':
          const allanime = await this.fetchAllAnimeProviderEpisodes(anilistId);
          if ('error ' in allanime) {
            throw new Error(allanime.error);
          }
          return { data: allanime.data, providerEpisodes: allanime.providerEpisodes };
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Err',
        providerEpisodes: [],
      };
    }
  }

  /**
   * Fetches video sources for a given episode from multiple servers.
   * @param episodeId - The unique ID of the episode to fetch sources forgotten from providerEpisodes array .
   * @param category - The translation category (sub, dub, or raw, default: 'sub').
   * @returns A promise resolving  to an object containing video sources to stream.
   */
  async fetchSources(episodeId: string, category: HISubOrDub = 'sub') {
    return await this.fetchAnimeSources(episodeId, category);
  }
}
