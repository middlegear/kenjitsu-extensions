import { Meta } from '../../models/base-meta.js';
import type {
  IAnimePaginated,
  IMetaInfoResponse,
  IMetaMovie,
  IMetaMovieEpisodes,
  IMetaMovieIdResponse,
  IMetaMovieInfo,
  IMetaMovieSeasons,
  IMovieProviderResults,
  IResponse,
  TimeWindow,
} from '../../models/types.js';

import { _getVidSrcMovieUrl, _getVidSrcTvUrl, type EmbedSrcResponse } from '../movies/embed/vidsrc.js';

/**
 * A class for interacting with The Movie Database (TMDb) API to search for and retrieve
 * information about TV shows and movies, including trending, popular, top-rated, seasonal data.
 */
export class TheMovieDatabase extends Meta {
  private readonly apiKey: string = 'b29bfe548cc2a3e4225effbd54ef0fda';
  private readonly baseUrl: string = 'https://api.themoviedb.org/3';

  constructor() {
    super();
  }

  /**
   * Reusable method to fetch paginated TV show data from TMDb API.
   * @param {string} endpoint - The API endpoint to fetch data from (e.g., '/search/tv').
   * @param {Record<string, string>} params - Query parameters for the API request.
   * @returns A promise that resolves to an object containing paginated TV show data.
   */
  private async fetchPaginatedData(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}${endpoint}`, {
        params: {
          language: 'en-US',
          api_key: this.apiKey,
          ...params,
        },
      });

      if (!response.data) {
        return {
          data: [],
          currentPage: 0,
          hasNextPage: false,
          lastPage: 0,
          totalResults: 0,
          error: response.statusText,
        };
      }

      const pagination = {
        currentPage: response.data.page,
        hasNextPage: response.data.total_pages > 1,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };

      const data = response.data.results.map((item: any) => ({
        tmdbId: item.id || null,
        name: item.name || item.original_name || null,
        posterImage: {
          small: item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : null,
          medium: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
          large: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
          original: item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : null,
        },
        coverImage: {
          small: item.backdrop_path ? `https://image.tmdb.org/t/p/w300${item.backdrop_path}` : null,
          medium: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
          large: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
          original: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
        },
        country: item.origin_country || null,
        language: item.original_language || null,
        startDate: item.first_air_date || null,
        summary: item.overview || null,
        genres: item.genre_ids || null,
        rating: item.vote_average || null,
      }));

      return {
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        lastPage: pagination.totalPages,
        totalResults: pagination.totalResults,
        data: data as IMetaMovie[],
      };
    } catch (error) {
      return {
        data: [],
        currentPage: 0,
        hasNextPage: false,
        lastPage: 0,
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reusable method to fetch paginated movie data from TMDb API.
   * @param {string} endpoint - The API endpoint to fetch data from (e.g., '/search/movie').
   * @param {Record<string, string>} params - Query parameters for the API request.
   * @returns A promise that resolves to an object containing paginated movie data.
   */
  private async fetchPaginatedMovieData(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}${endpoint}`, {
        params: {
          language: 'en-US',
          api_key: this.apiKey,
          ...params,
        },
      });

      if (!response.data) {
        return {
          data: [],
          currentPage: 0,
          hasNextPage: false,
          lastPage: 0,
          totalResults: 0,
          error: response.statusText,
        };
      }

      const pagination = {
        currentPage: response.data.page,
        hasNextPage: response.data.total_pages > 1,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };

      const data = response.data.results.map((item: any) => ({
        tmdbId: item.id || null,
        name: item.title || item.original_title || null,
        posterImage: {
          small: item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : null,
          medium: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
          large: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
          original: item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : null,
        },
        coverImage: {
          small: item.backdrop_path ? `https://image.tmdb.org/t/p/w300${item.backdrop_path}` : null,
          medium: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
          large: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
          original: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
        },
        language: item.original_language || null,
        startDate: item.release_date || null,
        summary: item.overview || null,
        genres: item.genre_ids || null,
        rating: item.vote_average || null,
      }));

      return {
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        lastPage: pagination.totalPages,
        totalResults: pagination.totalResults,
        data: data as IMetaMovie[],
      };
    } catch (error) {
      return {
        data: [],
        currentPage: 0,
        hasNextPage: false,
        lastPage: 0,
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Searches for TV shows based on the provided query string.
   * @param {string} query - The search query string (required).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of TV shows related to the search query.
   */
  async searchShows(query: string, page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    if (!query) {
      return {
        data: [],
        currentPage: 0,
        hasNextPage: false,
        lastPage: 0,
        totalResults: 0,
        error: 'Missing required parameter. Query',
      };
    }
    return this.fetchPaginatedData('/search/tv', {
      include_adult: 'false',
      page: String(page),
      query,
    });
  }

  /**
   * Fetches detailed information about a specific TV show using its TMDb ID.
   * @param {number} tmdbId - The unique TMDb ID for the TV show (required).
   * @returns A promise that resolves to an object containing comprehensive TV show information.
   */
  async fetchShowInfo(tmdbId: number): Promise<IMetaInfoResponse<IMetaMovieInfo | null>> {
    if (!tmdbId) {
      return {
        data: null,
        seasons: [],
        error: 'Missing required parameter. A tmdbId',
      };
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/tv/${tmdbId}`, {
        params: {
          language: 'en-US',
          api_key: this.apiKey,
        },
      });

      if (!response.data)
        return {
          data: null,
          seasons: [],
          error: response.statusText,
        };
      const data = {
        tmdbId: response.data.id || null,
        name: response.data.name || null,
        posterImage: {
          small: response.data.poster_path ? `https://image.tmdb.org/t/p/w185${response.data.poster_path}` : null,
          medium: response.data.poster_path ? `https://image.tmdb.org/t/p/w342${response.data.poster_path}` : null,
          large: response.data.poster_path ? `https://image.tmdb.org/t/p/w780${response.data.poster_path}` : null,
          original: response.data.poster_path ? `https://image.tmdb.org/t/p/original${response.data.poster_path}` : null,
        },
        coverImage: {
          small: response.data.backdrop_path ? `https://image.tmdb.org/t/p/w300${response.data.backdrop_path}` : null,
          medium: response.data.backdrop_path ? `https://image.tmdb.org/t/p/w780${response.data.backdrop_path}` : null,
          large: response.data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${response.data.backdrop_path}` : null,
          original: response.data.backdrop_path ? `https://image.tmdb.org/t/p/original${response.data.backdrop_path}` : null,
        },
        status: response.data.status || null,
        country: response.data.origin_country || null,
        language: response.data.original_language || null,
        episodes: response.data.number_of_episodes || null,
        seasons: response.data.number_of_seasons || null,
        rating: response.data.vote_average || null,
        genres: response.data.genres || null,
        summary: response.data.overview || null,
        startDate: response.data.first_air_date || null,
        lastAired: response.data.last_air_date || null,
        latestEpisode: response.data.last_episode_to_air
          ? {
              episodeId: response.data.last_episode_to_air.id,
              title: response.data.last_episode_to_air.name,
              episodeNumber: response.data.last_episode_to_air.episode_number,
              episodeType: response.data.last_episode_to_air.episode_type,
              season: response.data.last_episode_to_air.season_number,
              summary: response.data.last_episode_to_air.overview,
              rating: response.data.last_episode_to_air.vote_average,
              airDate: response.data.last_episode_to_air.air_date,
            }
          : null,
        nextEpisode: response.data.next_episode_to_air
          ? {
              episodeId: response.data.next_episode_to_air.id,
              title: response.data.next_episode_to_air.name,
              episodeType: response.data.next_episode_to_air.episode_type,
              episodeNumber: response.data.next_episode_to_air.episode_number,
              season: response.data.next_episode_to_air.season_number,
              summary: response.data.next_episode_to_air.overview,
              rating: response.data.next_episode_to_air.vote_average,
              airDate: response.data.next_episode_to_air.air_date,
            }
          : null,
      };
      const seasons = response.data.seasons.map((item: any) => ({
        airDate: item.air_date || null,
        id: item.id || null,
        name: item.name || null,
        rating: item.vote_average || null,
        summary: item.overview || null,
        seasonNumber: item.season_number || null,
        posterImage: {
          small: item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : null,
          medium: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
          large: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
          original: item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : null,
        },
      }));
      return { data: data as IMetaMovieInfo, seasons: seasons as IMetaMovieSeasons[] };
    } catch (error) {
      return { data: null, seasons: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetches episodes available in a specific season of a TV show.
   * @param {number} tmdbId - The unique TMDb ID for the TV show (required).
   * @param {number} season - The season number for which to fetch episodes (required).
   * @returns A promise that resolves to an object containing an array of episodes and their information for the specified season.
   */
  async fetchTvEpisodes(tmdbId: number, season: number): Promise<IResponse<IMetaMovieEpisodes[] | []>> {
    if (!tmdbId) {
      return { data: [], error: 'Missing required params: tmdbId!' };
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/tv/${tmdbId}/season/${season}`, {
        params: {
          api_key: this.apiKey,
        },
      });

      if (!response.data)
        return {
          data: [],
          error: response.statusText,
        };
      const episodes = response.data.episodes.map((item: any) => ({
        airDate: item.air_date || null,
        episodeNumber: item.episode_number || null,
        episodeType: item.episode_type || null,
        tmdbEpisodeId: item.id || null,
        title: item.name || null,
        summary: item.overview || null,
        rating: item.vote_average || null,
        seasonNumber: item.season_number || null,
        tmdbId: item.show_id || null,
        runtime: item.runtime || null,
        images: {
          small: item.still_path ? `https://image.tmdb.org/t/p/w185${item.still_path}` : null,
          medium: item.still_path ? `https://image.tmdb.org/t/p/w342${item.still_path}` : null,
          large: item.still_path ? `https://image.tmdb.org/t/p/w780${item.still_path}` : null,
          original: item.still_path ? `https://image.tmdb.org/t/p/original${item.still_path}` : null,
        },
      }));
      return { data: episodes as IMetaMovieEpisodes[] };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetches episode information available in a specific season of a TV show.
   * @param {number} tmdbId - The unique TMDb ID for the TV show (required).
   * @param {number} season - The season number for which to fetch episodes (optional, defaults to 1).
   * @param {number} episodeNumber - The episode number for which to fetch episode information (optional, defaults to 1).
   * @returns A promise that resolves to an object containing episode information.
   */
  async fetchEpisodeInfo(
    tmdbId: number,
    season: number,
    episodeNumber: number,
  ): Promise<IResponse<IMetaMovieEpisodes | null>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/tv/${tmdbId}/season/${season}/episode/${episodeNumber}`, {
        params: {
          api_key: this.apiKey,
        },
      });
      if (!response.data)
        return {
          data: null,
          error: response.statusText,
        };
      const episode = {
        airDate: response.data.air_date || null,
        title: response.data.name || null,
        summary: response.data.overview || null,
        rating: response.data.vote_average || null,
        seasonNumber: response.data.season_number || null,
        tmdbEpisodeId: response.data.id || null,
        runtime: response.data.runtime || null,
        images: {
          small: response.data.still_path ? `https://image.tmdb.org/t/p/w185${response.data.still_path}` : null,
          medium: response.data.still_path ? `https://image.tmdb.org/t/p/w342${response.data.still_path}` : null,
          large: response.data.still_path ? `https://image.tmdb.org/t/p/w780${response.data.still_path}` : null,
          original: response.data.still_path ? `https://image.tmdb.org/t/p/original${response.data.still_path}` : null,
        },
      };
      return {
        data: episode as IMetaMovieEpisodes,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetches trending TV shows based on a specified time window.
   * @param {TimeWindow} timeWindow - The time window to fetch trending shows (day or week) (optional, defaults to TimeWindow.Week).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of trending TV shows.
   */
  async fetchTrendingTv(timeWindow: TimeWindow = 'week', page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedData(`/trending/tv/${timeWindow}`, { page: String(page) });
  }

  /**
   * Fetches popular TV shows.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of popular TV shows.
   */
  async fetchPopularTv(page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedData('/tv/popular', { page: String(page) });
  }

  /**
   * Fetches top-rated TV shows.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of top-rated TV shows.
   */
  async fetchTopShows(page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedData('/tv/top_rated', { page: String(page) });
  }

  /**
   * Fetches currently airing TV shows.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of airing TV shows.
   */
  async fetchAiringTv(page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedData('/tv/on_the_air', { page: String(page) });
  }

  /**
   * Searches for movies based on the provided query string.
   * @param {string} query - The search query string (required).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of movies related to the search query.
   */
  async searchMovie(query: string, page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    if (!query) {
      return {
        data: [],
        currentPage: 0,
        hasNextPage: false,
        lastPage: 0,
        totalResults: 0,
        error: 'Missing required parameter. Query',
      };
    }
    return this.fetchPaginatedMovieData('/search/movie', {
      include_adult: 'false',
      page: String(page),
      query,
    });
  }

  /**
   * Fetches detailed information about a specific movie using its TMDb ID.
   * @param {number} tmdbId - The unique TMDb ID for the movie (required).
   * @returns A promise that resolves to an object containing comprehensive movie information.
   */
  async fetchMovieInfo(tmdbId: number): Promise<IResponse<IMetaMovie | null>> {
    if (!tmdbId) {
      return { data: null, error: 'Missing required params tmdbId!' };
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/movie/${tmdbId}`, {
        params: {
          api_key: this.apiKey,
        },
      });

      const data = {
        tmdbId: response.data.id || null,
        name: response.data.original_title || response.data.title || null,
        posterImage: {
          small: response.data.poster_path ? `https://image.tmdb.org/t/p/w185${response.data.poster_path}` : null,
          medium: response.data.poster_path ? `https://image.tmdb.org/t/p/w342${response.data.poster_path}` : null,
          large: response.data.poster_path ? `https://image.tmdb.org/t/p/w780${response.data.poster_path}` : null,
          original: response.data.poster_path ? `https://image.tmdb.org/t/p/original${response.data.poster_path}` : null,
        },
        coverImage: {
          small: response.data.backdrop_path ? `https://image.tmdb.org/t/p/w300${response.data.backdrop_path}` : null,
          medium: response.data.backdrop_path ? `https://image.tmdb.org/t/p/w780${response.data.backdrop_path}` : null,
          large: response.data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${response.data.backdrop_path}` : null,
          original: response.data.backdrop_path ? `https://image.tmdb.org/t/p/original${response.data.backdrop_path}` : null,
        },
        status: response.data.status || null,
        country: response.data.origin_country || null,
        language: response.data.original_language || null,
        rating: response.data.vote_average || null,
        genres: response.data.genres || null,
        budget: response.data.budget || null,
        collection: response.data.belongs_to_collection
          ? {
              id: response.data.belongs_to_collection.id,
              name: response.data.belongs_to_collection.name,
              posterImage: {
                small: response.data.belongs_to_collection.poster_path
                  ? `https://image.tmdb.org/t/p/w185${response.data.belongs_to_collection.poster_path}`
                  : null,
                medium: response.data.belongs_to_collection.poster_path
                  ? `https://image.tmdb.org/t/p/w342${response.data.belongs_to_collection.poster_path}`
                  : null,
                large: response.data.belongs_to_collection.poster_path
                  ? `https://image.tmdb.org/t/p/w780${response.data.belongs_to_collection.poster_path}`
                  : null,
                original: response.data.belongs_to_collection.poster_path
                  ? `https://image.tmdb.org/t/p/original${response.data.belongs_to_collection.poster_path}`
                  : null,
              },
              coverImage: {
                small: response.data.belongs_to_collection.backdrop_path
                  ? `https://image.tmdb.org/t/p/w300${response.data.belongs_to_collection.backdrop_path}`
                  : null,
                medium: response.data.belongs_to_collection.backdrop_path
                  ? `https://image.tmdb.org/t/p/w780${response.data.belongs_to_collection.backdrop_path}`
                  : null,
                large: response.data.belongs_to_collection.backdrop_path
                  ? `https://image.tmdb.org/t/p/w1280${response.data.belongs_to_collection.backdrop_path}`
                  : null,
                original: response.data.belongs_to_collection.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${response.data.belongs_to_collection.backdrop_path}`
                  : null,
              },
            }
          : null,
        summary: response.data.overview || null,
        startDate: response.data.release_date || null,
      };
      return { data: data as IMetaMovie };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetches trending movies based on a specified time window.
   * @param {TimeWindow} [timeWindow=TimeWindow.Week] - The time window to fetch trending movies (day or week) (optional, defaults to TimeWindow.Week).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of trending movies.
   */
  async fetchTrendingMovies(timeWindow: TimeWindow = 'week', page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData(`/trending/movie/${timeWindow}`, { page: String(page) });
  }

  /**
   * Fetches popular movies.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of popular movies.
   */
  async fetchPopularMovies(page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData('/movie/popular', { page: String(page) });
  }

  /**
   * Fetches top-rated movies.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of top-rated movies.
   */
  async fetchTopMovies(page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData('/movie/top_rated', { page: String(page) });
  }

  /**
   * Fetches movies that are currently in cinemas.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of movies currently releasing in cinemas.
   */
  async fetchReleasingMovies(page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData('/movie/now_playing', { page: String(page) });
  }

  /**
   * Fetches data on upcoming movies.
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns A promise that resolves to an object containing an array of upcoming movies.
   */
  async fetchUpcomingMovies(page: number = 1): Promise<IAnimePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData('/movie/upcoming', { page: String(page) });
  }

  /**
   * Fetches movie streaming sources using TMDB ID
   * @param {number} tmdbId - The unique TMDb ID for the movie (required).
   * @returns  A promise that resolves to an object containing array of available streaming sources.
   */
  async fetchMovieSources(tmdbId: number): Promise<EmbedSrcResponse> {
    return _getVidSrcMovieUrl(tmdbId);
  }

  /**
   * Fetches TV show streaming sources using TMDB ID
   * @param {number} tmdbId - The unique TMDb ID for the TV show (required).
   * @param {number} season - The season number for which to fetch episodes(required)
   * @param {number} episodeNumber - The episode number for which to fetch streaming sources (required)
   * @returns  A promise that resolves to an object containing array of available streaming sources.
   */
  async fetchTvSources(tmdbId: number, season: number, episodeNumber: number): Promise<EmbedSrcResponse> {
    return _getVidSrcTvUrl(tmdbId, season, episodeNumber);
  }

  /**
   * Fetches TV show information along with a provider-specific show ID.
   * This is useful for linking TMDb TV show entries to external streaming site IDs, such as FlixHQ.
   * @param {number} tmdbId - The unique TMDb ID for the TV show (required).
   * @returns  A promise that resolves to an object containing the provider-specific TV show ID and related information.
   */
  async fetchTvProviderId(tmdbId: number): Promise<IMetaMovieIdResponse<IMetaMovieInfo | null>> {
    try {
      const tvShowData = await this.fetchShowInfo(tmdbId);
      const title = tvShowData.data?.name;

      const titleSlug = this.createSlug(title as string);
      const flixResults = await this.searchFlixTv(titleSlug);

      return {
        data: tvShowData.data,
        provider: this.mapMovies(title as string, flixResults) as IMovieProviderResults[],
      };
    } catch (error) {
      return { data: null, provider: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetches movie information along with a provider-specific movie ID.
   * This is useful for linking TMDb movie entries to external streaming site IDs, such as FlixHQ.
   * @param {number} tmdbId - The unique TMDb ID for the movie (required).
   * @returns  A promise that resolves to an object containing the provider-specific movie ID and related information.
   */
  async fetchMovieProviderId(tmdbId: number): Promise<IMetaMovieIdResponse<IMetaMovie | null>> {
    try {
      const movieData = await this.fetchMovieInfo(tmdbId);
      const title = movieData.data?.name;
      const titleSlug = this.createSlug(title as string);

      const flixResults = await this.searchFlixMovies(titleSlug);

      return {
        data: movieData.data,
        provider: this.mapMovies(title as string, flixResults) as IMovieProviderResults[],
      };
    } catch (error) {
      return { data: null, provider: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
