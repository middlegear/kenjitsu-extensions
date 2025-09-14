import { Meta } from '../../models/base-meta.js';
import type {
  IAnimePaginated,
  IMetaAnime,
  IResponse,
  IMetaCharacters,
  JSort,
  IMetaEpisodes,
  IMetaProviderIdResponse,
  ITitle,
  IMetaProviderEpisodesResponse,
  Seasons,
  Format,
  AnimeProvider,
  ISubOrDub,
  HiAnimeServers,
} from '../../models/types.js';

/**
 * A class for interacting with the Jikan API (MyAnimeList unofficial API) to search for anime,
 * fetch detailed information, retrieve various top lists (airing, movies, popular, upcoming),
 * seasonal anime, character details, and episode information  from MyAnimeList.
 */
export class Jikan extends Meta {
  private readonly baseUrl: string = 'https://api.jikan.moe/v4';
  constructor() {
    super();
  }
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
        this.fetchAllAnimeEpisodes(initialResponse.provider?.id as string),
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
        this.fetchZoroEpisodes(initialResponse.provider?.id as string),
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
      const titles = mal.data?.title as ITitle;
      const userPref = titles?.english || titles?.romaji || titles?.native;
      const titleSlug = this.createSlug(userPref as string);

      const zoroResults = await this.searchZoro(titleSlug);

      return {
        data: mal.data,
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
      const titles = mal.data?.title as ITitle;
      const userPref = titles?.english || titles?.romaji || titles?.native;
      const titleSlug = this.createSlug(userPref as string);
      const allanimeResults = await this.searchAllAnime(titleSlug);

      return {
        data: mal.data,
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
   * Searches for anime titles based on the provided query string.
   * @param {string} query - The search query string (required).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage=20] - The number of results per page (optional, defaults to 20, maximum 25).
   * @returns  A promise that resolves to an object containing an array of anime results related to the search query.
   */
  async search(query: string, page: number = 1, perPage: number = 20): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        lastPage: 0,
        totalResults: 0,
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
      if (!response.data)
        return {
          error: 'Server returned an empty response',
          hasNextPage: false,
          totalResults: 0,
          lastPage: 0,
          currentPage: 0,
          perPage: 0,
          data: [],
        };
      const pagination = {
        hasNextPage: response.data.pagination.has_next_page,
        lastPage: response.data.pagination.last_visible_page,
        currentPage: page,
        total: response.data.pagination.items.total,
        perPage: response.data.pagination.items.per_page,
      };
      const search: IMetaAnime[] = response.data.data.map((item: any) => ({
        malId: item.mal_id,
        title: {
          romaji: item.title,
          english: item.title_english,
          native: item.title_japanese,
        },
        image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,
        startDate:
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
        totalResults: pagination.total,
        lastPage: pagination.lastPage,
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        data: search as IMetaAnime[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime using its MyAnimeList (MAL) ID.
   * @param {number} malId - The unique MyAnimeList (MAL) ID for the anime (required).
   * @returns  A promise that resolves to an object containing comprehensive detailed anime information.
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
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };
      const animeInfo: IMetaAnime = {
        malId: response.data.data.mal_id,
        title: {
          romaji: response.data.data.title,
          english: response.data.data.title_english,
          native: response.data.data.title_japanese,
        },
        image: response.data.data.images.jpg.large_image_url ?? response.data.data.images.webp.large_image_url,
        bannerImage: response.data.data.images.jpg.large_image_url ?? response.data.data.images.webp.large_image_url,
        trailer: response.data.data.trailer.embed_url ?? response.data.data.trailer.url,
        episodes: response.data.data.episodes,

        startDate:
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
        status: response.data.data.status,
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
   * Fetches characters associated with a specific anime.
   * @param {number} malId - The unique MyAnimeList (MAL) ID for the anime (required).
   * @returns A promise that resolves to an object containing an array of anime characters.
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
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
        };
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
        data: res,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        data: [],
      };
    }
  }
  /**
   * Fetches the anime list for the current season.
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20, maximum 25).
   * @param {Format} [format] - The format type to filter by (optional, defaults to TV).
   * @returns  A promise that resolves to an object containing the list of current seasonal anime.
   */
  async fetchCurrentSeason(
    page: number,
    perPage: number,
    format: Format = 'TV',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    if (!format) {
      return {
        error: 'Missing required parameter : Format!',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
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
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          totalResults: 0,
          lastPage: 0,
          currentPage: 0,
          perPage: 0,
          data: [],
        };

      const res = response.data;
      const pagination = {
        hasNextPage: res.pagination.has_next_page,
        lastPage: res.pagination.last_visible_page,
        currentPage: page,
        total: res.pagination.items.total,
        perPage: res.pagination.items.per_page,
      };
      const currentSeason: IMetaAnime[] = res.data.map((item: any) => ({
        malId: item.mal_id,
        title: {
          romaji: item.title,
          english: item.title_english,
          native: item.title_japanese,
        },
        image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,
        startDate:
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
        totalResults: pagination.total,
        lastPage: pagination.lastPage,
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        data: currentSeason,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    }
  }

  /**
   * Fetches the anime list for the upcoming season.
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20, maximum 25).
   * @param {Format} [format] - The format type to filter by (optional, defaults to TV).
   * @returns A promise that resolves to an object containing the list of upcoming season's anime.
   */
  async fetchNextSeason(
    page: number = 1,
    perPage: number = 20,
    format: Format = 'TV',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    if (!format) {
      return {
        error: 'Missing required parameter : Format!',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
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
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          totalResults: 0,
          lastPage: 0,
          currentPage: 0,
          perPage: 0,
          data: [],
        };
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
        image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,
        startDate:
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
        totalResults: pagination.total,
        lastPage: pagination.lastPage,
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        data: NextSeason as IMetaAnime[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    }
  }
  /**
   * Fetches seasonal anime for a given year and season.
   * @param {Seasons} season - The target season (e.g., WINTER, SPRING, SUMMER, FALL) (required).
   * @param {number} year - The target year (e.g., 2023, 2024) (required).
   * @param {Format} [format] - The anime format to filter by (optional, defaults to TV).
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20, maximum 25).
   * @returns  A promise that resolves to an object containing the list of seasonal anime.
   */
  async fetchSeasonalAnime(
    season: Seasons,
    year: number,
    format: Format = 'TV',
    page: number = 1,
    perPage: number = 20,
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    if (!year || !season) {
      return {
        error: 'Missing required parameter : year or season',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
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
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          totalResults: 0,
          lastPage: 0,
          currentPage: 0,
          perPage: 0,
          data: [],
        };

      const res = response.data;
      const pagination = {
        hasNextPage: res.pagination.has_next_page,
        lastPage: res.pagination.last_visible_page,
        currentPage: page,
        total: res.pagination.items.total,
        perPage: res.pagination.items.per_page,
      };

      const Season: IMetaAnime[] = res.data.map((item: any) => ({
        malId: item.mal_id,
        title: {
          romaji: item.title,
          english: item.title_english,
          native: item.title_japanese,
        },
        image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,

        startDate:
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
        totalResults: pagination.total,
        lastPage: pagination.lastPage,
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        data: Season as IMetaAnime[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    }
  }
  /**
   * Fetches a list of the most anticipated upcoming anime.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage=20] - The number of results per page (optional, defaults to 20, maximum 25).
   * @returns  A promise that resolves to an object containing an array of upcoming anime resources.
   */
  async fetchTopUpcoming(page: number = 1, perPage: number = 20): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/top/anime`, {
        params: {
          filter: 'upcoming',
          sfw: 'true',
          page: String(page),
          limit: String(perPage),
        },
      });
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          totalResults: 0,
          lastPage: 0,
          currentPage: 0,
          perPage: 0,
          data: [],
        };
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
        image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,

        startDate:
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
        totalResults: pagination.total,
        lastPage: pagination.lastPage,
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        data: topAnime as IMetaAnime[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
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
   * @returns  A promise that resolves to an object containing an array of top-rated anime.
   */
  async fetchTopAnime(
    page: number = 1,
    perPage: number = 20,
    format: Format = 'TV',
    sort: JSort = 'rating',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
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
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          hasNextPage: false,
          totalResults: 0,
          lastPage: 0,
          currentPage: 0,
          perPage: 0,
          data: [],
        };
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
        image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
        trailer: item.trailer.embed_url ?? item.trailer.url,
        episodes: item.episodes,

        startDate:
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
        totalResults: pagination.total,
        lastPage: pagination.lastPage,
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        data: topAnime as IMetaAnime[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    }
  }

  /**
   * Fetches a list of the top airing anime.
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20, maximum 25).
   * @param {Format} [format] - The format type to filter by (optional, defaults to TV).
   * @returns A promise that resolves to an object containing the list of top airing anime.
   */
  async fetchTopAiring(
    page: number = 1,
    perPage: number = 20,
    format: Format = 'TV',
    sort: JSort = 'airing',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopAnime(page, perPage, format, sort);
  }

  /**
   * Fetches a list of the top  anime by category.
   *  @param {Format} [format] - The anime format type to filter by (required).
   * @param {JSort} [sort] -  The sorting order for results (required).
   * @param {number} [page] - The page number for pagination (required).
   * @param {number} [perPage] - The number of results per page (required, maximum 25).
   * @returns A promise that resolves to an object containing the list of top anime by category.
   */
  async fetchTopCategory(
    format: Format,
    sort: JSort,
    page: number,
    perPage: number,
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopAnime(page, perPage, format, sort);
  }

  /**
   * Fetches a list of the most popular anime.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20, maximum 25).
   * @param {Format} [format] - The format type to filter by (optional, defaults to TV).
   * @returns  A promise that resolves to an object containing the list of most popular anime.
   */
  async fetchMostPopular(
    page: number = 1,
    perPage: number = 20,
    format: Format = 'TV',
    sort: JSort = 'bypopularity',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopAnime(page, perPage, format, sort);
  }

  /**
   * Fetches a list of the top anime movies.
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @param {number} [perPage] - The number of results per page (optional, defaults to 20, maximum 25).
   * @returns   A promise that resolves to an object containing the list of top anime movies..
   */
  async fetchTopMovies(
    page: number = 1,
    perPage: number = 20,
    format: Format = 'MOVIE',
    sort: JSort = 'bypopularity',
  ): Promise<IAnimePaginated<IMetaAnime[] | []>> {
    return this.fetchTopAnime(page, perPage, format, sort);
  }

  /**
   * Fetches the episode list for a given anime directly from MyAnimeList (MAL).
   * @param {number} malId - The unique MyAnimeList (MAL) ID for the anime (required).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns  A promise that resolves to an object containing the anime episodes list.
   */
  async fetchEpisodes(malId: number, page: number = 1): Promise<IAnimePaginated<IMetaEpisodes[] | []>> {
    if (!malId) {
      return {
        error: 'Missing required parameter : Malid!',
        data: [],
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/anime/${malId}/episodes`, {
        params: {
          page: String(page),
        },
      });
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
        };
      const pagination = {
        hasNextPage: response.data.pagination.has_next_page,
        lastPage: response.data.pagination.last_visible_page,
        currentPage: page,
      };

      const data: IMetaEpisodes[] = response.data.data.map((item: any) => ({
        number: item.mal_id,
        url: item.url,
        title: {
          english: item.title,
          romaji: item.title_romanji,
          japanese: item.title_japanese,
        },
        filler: item.filler,
        recap: item.recap,
        score: item.score,
      }));
      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        data: data as IMetaEpisodes[],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        hasNextPage: false,
        lastPage: 0,
        currentPage: 0,
        data: [],
      };
    }
  }

  /**
   * Fetches detailed information about a specific episode from MyAnimeList (MAL).
   * @param {number} malId - The unique MyAnimeList (MAL) ID for the anime (required).
   * @param {number} episodeNumber - The specific episode number (required).
   * @returns  A promise that resolves to an object containing the detailed episode information.
   */
  async fetchEpisodeInfo(malId: number, episodeNumber: number): Promise<IResponse<IMetaEpisodes | null>> {
    if (!malId && !episodeNumber) {
      return {
        error: 'Missing required parameter : Malid! || episodeNumber',
        data: null,
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/anime/${malId}/episodes/${episodeNumber}`);
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };
      const data: IMetaEpisodes = {
        number: response.data.data.mal_id,
        url: response.data.data.url,
        title: {
          english: response.data.data.title,
          romaji: response.data.data.title_romanji,
          japanese: response.data.data.title_japanese,
        },
        duration: Number(response.data.data.duration) / 60 || null,
        filler: response.data.data.filler,
        recap: response.data.data.recap,
        synopsis: response.data.data.synopsis,
      };
      return {
        data: data,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err ',
        data: null,
      };
    }
  }

  /**
   * Fetches anime information along with a provider-specific anime ID. Kind of depends on provider availability
   * This is useful for linking MAL entries to external streaming provider IDs.
   * @param {number} malId - The unique mal anime ID (required).
   * @param {AnimeProvider} [provider] - The anime provider to fetch data from (optional, defaults to HiAnime)
   * @returns  A promise that resolves to an object containing the provider-specific anime ID and core anime info.
   */
  async fetchProviderId(
    malId: number,
    provider: AnimeProvider = 'hianime',
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
   * This is used to get streamable episodes from a given provider.
   * @param {number} malId - The unique MAL ID of the anime (required).
   * @param {AnimeProvider} [provider] - The anime provider to fetch episodes from (optional, defaults to HiAnime)
   * @returns  A promise that resolves to an object containing anime info and its episodes from the specified provider.
   */

  async fetchAnimeProviderEpisodes(
    malId: number,
    provider: AnimeProvider = 'hianime',
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
  async fetchAllAnimeProviderSources(episodeId: string, category: ISubOrDub = 'sub') {
    return await this.fetchAllAnimeSources(episodeId, category);
  }

  /**
   * Fetches video sources for a given episodeId.
   * @param episodeId - The unique ID of the episode to fetch sources forgotten from providerEpisodes array .
   * @param category - The translation category (sub, dub, or raw, default: 'sub').
   * @param  server - The streaming server to use (optional, defaults to hd-2). Note: hd-1 may return a 403 error due to CORS restrictions; use a proxy or switch to hd-2 or hd-3
   * @returns A promise resolving  to an object containing video sources to stream.
   */
  async fetchHianimeProviderSources(episodeId: string, category: ISubOrDub = 'sub', server: HiAnimeServers = 'hd-2') {
    return await this.fetchZoroSources(episodeId, server, category);
  }
}
