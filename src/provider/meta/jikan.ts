import { BaseAnimeMeta } from '../../models/anime-meta.js';
import type { IResponse } from '../../types/base.js';

import type {
  IMetaAnime,
  IMetaAnimePaginated,
  IMetaCharacters,
  Seasons,
  JSort,
  IMetaFormat,
} from '../../types/meta/meta-anime.js';
import type { ClientOptions } from '../../config/client.js';

/**
 * A class for interacting with the Jikan API (MyAnimeList unofficial API) to search for anime,
 * fetch detailed information, retrieve various top lists (airing, movies, popular, upcoming),
 * seasonal anime, character details, and episode information from MyAnimeList.
 *
 *
 */
export class Jikan extends BaseAnimeMeta {
  /** Base URL for the Jikan API (MyAnimeList unofficial API) */
  private readonly baseUrl: string = 'https://api.jikan.moe/v4';

  constructor(
    options: ClientOptions = {
      rateLimit: {
        intervalMs: 1000,
        requestsPerInterval: 1,
      },
    },
  ) {
    super(options);
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
        error: 'Missing required fields',
        status: 400,
      };
    }

    try {
      const searchParams = new URLSearchParams({
        q: query,
        page: String(page),
        limit: String(perPage),
      }).toString();

      const response = await this.client.fetch(`${this.baseUrl}/anime?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
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
        hasNextPage: result.pagination.has_next_page,
        lastPage: result.pagination.last_visible_page,
        currentPage: page,
        perPage: result.pagination.items.per_page,
      };

      const search: IMetaAnime[] = result.data.map((item: any) => ({
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
        status: 500,
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
        status: 400,
      };
    }

    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime/${malId}/full`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
          status: response.status,
        };
      }

      const result = await response.json();
      const animeInfo: IMetaAnime = {
        malId: result.data.mal_id,
        title: {
          romaji: result.data.title,
          english: result.data.title_english,
          native: result.data.title_japanese,
        },
        image:
          result.data.images.webp.large_image_url ||
          result.data.images.jpg.large_image_url ||
          result.data.images.jpg.image_url ||
          result.data.images.webp.image_url ||
          result.data.images.webp.small_image_url ||
          result.data.images.jpg.small_image_url,

        trailer: result.data.trailer.embed_url ?? result.data.trailer.url,
        episodes: result.data.episodes,

        releaseDate:
          result.data.aired.prop && result.data.aired.prop.from.year
            ? new Date(
                result.data.aired.prop.from.year,
                result.data.aired.prop.from.month - 1,
                result.data.aired.prop.from.day,
              ).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : result.data.aired.from || 'Unknown',

        endDate:
          result.data.aired.prop && result.data.aired.prop.to.year
            ? new Date(
                result.data.aired.prop.to.year,
                result.data.aired.prop.to.month - 1,
                result.data.aired.prop.to.day,
              ).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : result.data.aired.to || 'Unknown',
        format: result.data.type,
        status: result.data.status || null,
        genres: result.data.genres.map((item2: any) => item2.name),
        duration: result.data.duration,
        score: result.data.score,
        synopsis: result.data.synopsis,
        season: result.data.season,
        studio: result.data.studios,
        producers: result.data.producers,
      };

      return {
        data: animeInfo,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        data: null,
        status: 500,
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
        status: 400,
      };
    }

    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime/${malId}/characters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
          status: response.status,
        };
      }
      const result = await response.json();
      const res: IMetaCharacters[] = result.data.map((item: any) => ({
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
        status: 500,
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
        status: 400,
      };
    }

    try {
      const params = new URLSearchParams({
        filter: format.toLowerCase(),
        page: String(page),
        sfw: 'true',
        limit: String(perPage),
      });

      const response = await this.client.fetch(`${this.baseUrl}/seasons/now?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
          status: response.status,
        };
      }

      const res = await response.json();
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
        status: 500,
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
        status: 400,
      };
    }

    try {
      const params = new URLSearchParams({
        filter: format.toLowerCase(),
        sfw: 'true',
        page: String(page),
        limit: String(perPage),
      }).toString();

      const response = await this.client.fetch(`${this.baseUrl}/seasons/upcoming?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
          status: response.status,
        };
      }

      const res = await response.json();
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
        status: 500,
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
      const queryParams = new URLSearchParams({
        filter: format,
        sfw: 'true',
        page: String(page),
        limit: String(perPage),
      }).toString();

      const response = await this.client.fetch(`${this.baseUrl}/seasons/${year}/${season.toLowerCase()}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
          status: response.status,
        };
      }

      const res = await response.json();
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

      const queryString = new URLSearchParams(params).toString();

      const response = await this.client.fetch(`${this.baseUrl}/top/anime?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          perPage: 0,
          data: [],
          error: response.statusText || 'Server returned an empty response',
          status: response.status,
        };
      }

      const res = await response.json();
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
        status: 500,
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
}
