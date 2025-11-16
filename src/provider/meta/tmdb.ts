import { BaseMovieMeta, type IMediaTitle } from '../../models/movie-meta.js';

import type { IResponse, IVideoSource } from '../../types/base.js';
import type {
  IMetaInfoResponse,
  IMetaMovie,
  IMetaMovieEpisodes,
  IMetaMovieIdResponse,
  IMetaMovieInfo,
  IMetaMoviePaginated,
  IMetaMovieSeasons,
  IMovieProviderResults,
} from '../../types/meta/meta-movie.js';

/**
 * A class for interacting with The Movie Database (TMDb) API to search for and retrieve
 * information about TV shows and movies, including trending, popular, top-rated, seasonal data,
 * episode information, and streaming source integration with external providers.
 *
 *
 */
export class TheMovieDatabase extends BaseMovieMeta {
  /** TMDb API key for authentication */
  private readonly apiKey: string = 'b29bfe548cc2a3e4225effbd54ef0fda';

  /** Base URL for the TMDb API */
  private readonly baseUrl: string = 'https://api.themoviedb.org/3';

  /**
   * Creates an instance of the TMDb API client.
   */
  constructor() {
    super();
  }

  /**
   * Reusable method to fetch paginated TV show data from TMDb API.
   *
   * @private
   * @param endpoint - The API endpoint to fetch data from (e.g., '/search/tv')
   * @param params - Query parameters for the API request
   * @returns Promise resolving to paginated TV show data with metadata
   */
  private async fetchPaginatedData(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}${endpoint}`, {
        params: {
          language: 'en-US',
          api_key: this.apiKey,
          ...params,
        },
        headers: {
          accept: 'application/json',
        },
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
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
        name: item.name || null,
        originalName: item.original_name || null,
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
        releaseDate: item.first_air_date || null,
        summary: item.overview || null,
        genres: item.genre_ids || null,
        rating: item.vote_average || null,
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        totalResults: pagination.totalResults,
        lastPage: pagination.totalPages,
        data: data as IMetaMovie[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reusable method to fetch paginated movie data from TMDb API.
   *
   * @private
   * @param endpoint - The API endpoint to fetch data from (e.g., '/search/movie')
   * @param params - Query parameters for the API request
   * @returns Promise resolving to paginated movie data with metadata
   */
  private async fetchPaginatedMovieData(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}${endpoint}`, {
        params: {
          language: 'en-US',
          api_key: this.apiKey,
          ...params,
        },
        headers: {
          accept: 'application/json',
        },
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
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
        name: item.title || null,
        originalName: item.original_title || null,
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
        releaseDate: item.release_date || null,
        summary: item.overview || null,
        genres: item.genre_ids || null,
        rating: item.vote_average || null,
      }));

      return {
        hasNextPage: pagination.hasNextPage,
        currentPage: pagination.currentPage,
        totalResults: pagination.totalResults,
        lastPage: pagination.totalPages,
        data: data as IMetaMovie[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Searches for TV shows based on the provided query string using TMDb API.
   *
   * @param query - The search query string (required)
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of TV shows matching the search query
   */
  async searchShows(query: string, page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
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
   *
   * @param tmdbId - The unique TMDb ID for the TV show (required)
   * @returns Promise resolving to comprehensive TV show information including seasons data
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
          append_to_response: `external_ids`,
        },
        headers: {
          accept: 'application/json',
        },
      });

      if (!response.data) {
        return {
          data: null,
          seasons: [],
          error: response.statusText,
        };
      }

      const data = {
        tmdbId: response.data.id || null,
        name: response.data.name || null,
        originalName: response.data.original_name || null,
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
        releaseDate: response.data.first_air_date || null,
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

        externalIds: {
          imdbId: response.data.external_ids.imdb_id || null,
          tvdbId: response.data.external_ids.tvdb_id || null,
          tvrageId: response.data.external_ids.tvrage_id || null,
          wikidataId: response.data.external_ids.wikidata_id || null,
          facebookId: response.data.external_ids.facebook_id || null,
          instagramId: response.data.external_ids.instagram_id || null,
          twitterId: response.data.external_ids.twitter_id || null,
        },
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
      return { error: error instanceof Error ? error.message : 'Unknown error', data: null, seasons: [] };
    }
  }

  /**
   * Fetches episodes available in a specific season of a TV show from TMDb.
   *
   * @param tmdbId - The unique TMDb ID for the TV show (required)
   * @param season - The season number for which to fetch episodes (required)
   * @returns Promise resolving to array of episodes with their detailed information for the specified season
   */
  async fetchTvEpisodes(tmdbId: number, season: number): Promise<IResponse<IMetaMovieEpisodes[] | []>> {
    if (!tmdbId) {
      return { error: 'Missing required params: tmdbId!', data: [] };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/tv/${tmdbId}/season/${season}`, {
        params: {
          api_key: this.apiKey,
        },
      });

      if (!response.data) return { error: response.statusText, data: [] };

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
      return { error: error instanceof Error ? error.message : 'Unknown error', data: [] };
    }
  }

  /**
   * Fetches detailed information about a specific episode from a TV show.
   *
   * @param tmdbId - The unique TMDb ID for the TV show (required)
   * @param season - The season number containing the episode (optional, defaults to 1)
   * @param episodeNumber - The episode number for which to fetch information (optional, defaults to 1)
   * @returns Promise resolving to detailed episode information including images and ratings
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

      if (!response.data) return { error: response.statusText, data: null };

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
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Fetches trending TV shows based on a specified time window from TMDb.
   *
   * @param timeWindow - The time window to fetch trending shows (day or week) (optional, defaults to 'week')
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of trending TV shows
   */
  async fetchTrendingTv(
    timeWindow: 'day' | 'week' = 'week',
    page: number = 1,
  ): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedData(`/trending/tv/${timeWindow}`, { page: String(page) });
  }

  /**
   * Fetches popular TV shows from TMDb.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of popular TV shows
   */
  async fetchPopularTv(page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedData('/tv/popular', { page: String(page) });
  }

  /**
   * Fetches top-rated TV shows from TMDb.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of top-rated TV shows
   */
  async fetchTopShows(page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedData('/tv/top_rated', { page: String(page) });
  }

  /**
   * Fetches currently airing TV shows from TMDb.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of currently airing TV shows
   */
  async fetchAiringTv(page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedData('/tv/on_the_air', { page: String(page) });
  }

  /**
   * Searches for movies based on the provided query string using TMDb API.
   *
   * @param query - The search query string (required)
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of movies matching the search query
   */
  async searchMovie(query: string, page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
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
   *
   * @param tmdbId - The unique TMDb ID for the movie (required)
   * @returns Promise resolving to comprehensive movie information including collection data
   */
  async fetchMovieInfo(tmdbId: number): Promise<IResponse<IMetaMovie | null>> {
    if (!tmdbId) {
      return { data: null, error: 'Missing required params tmdbId!' };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/movie/${tmdbId}`, {
        params: {
          api_key: this.apiKey,
          append_to_response: `external_ids`,
        },
        headers: {
          accept: 'application/json',
        },
      });

      if (!response.data) return { error: response.statusText, data: null };

      const data = {
        tmdbId: response.data.id || null,
        name: response.data.title || null,
        originalName: response.data.original_title || null,
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
        runtime: (response.data.runtime as number) || null,
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
        releaseDate: response.data.release_date || null,
        externalIds: {
          imdbId: response.data.external_ids.imdb_id || null,
          tvdbId: response.data.external_ids.tvdb_id || null,
          tvrageId: response.data.external_ids.tvrage_id || null,
          wikidataId: response.data.external_ids.wikidata_id || null,
          facebookId: response.data.external_ids.facebook_id || null,
          instagramId: response.data.external_ids.instagram_id || null,
          twitterId: response.data.external_ids.twitter_id || null,
        },
      };

      return { data: data as IMetaMovie };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', data: null };
    }
  }

  /**
   * Fetches trending movies based on a specified time window from TMDb.
   *
   * @param timeWindow - The time window to fetch trending movies (day or week) (optional, defaults to 'week')
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of trending movies
   */
  async fetchTrendingMovies(
    timeWindow: 'day' | 'week' = 'week',
    page: number = 1,
  ): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData(`/trending/movie/${timeWindow}`, { page: String(page) });
  }

  /**
   * Fetches popular movies from TMDb.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of popular movies
   */
  async fetchPopularMovies(page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData('/movie/popular', { page: String(page) });
  }

  /**
   * Fetches top-rated movies from TMDb.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of top-rated movies
   */
  async fetchTopMovies(page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData('/movie/top_rated', { page: String(page) });
  }

  /**
   * Fetches movies that are currently in cinemas from TMDb.
   *
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of movies currently releasing in cinemas
   */
  async fetchReleasingMovies(page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    return this.fetchPaginatedMovieData('/movie/now_playing', { page: String(page) });
  }

  /**
   * Fetches movie streaming sources using TMDB ID through VidSrc integration.
   *
   * @param tmdbId - The unique TMDb ID for the movie (required)
   * @returns Promise resolving to available streaming sources for the movie
   */
  async fetchMovieSources(tmdbId: number): Promise<IResponse<IVideoSource | null>> {
    return await this.vidsrc.fetchMovie(tmdbId);
  }

  /**
   * Fetches TV show streaming sources using TMDB ID through VidSrc integration.
   *
   * @param tmdbId - The unique TMDb ID for the TV show (required)
   * @param season - The season number for which to fetch episodes (required)
   * @param episodeNumber - The episode number for which to fetch streaming sources (required)
   * @returns Promise resolving to available streaming sources for the specific episode
   */
  async fetchTvSources(tmdbId: number, season: number, episodeNumber: number): Promise<IResponse<IVideoSource | null>> {
    return await this.vidsrc.fetchTvSources(tmdbId, season, episodeNumber);
  }

  /**
   * Fetches TV show information along with a provider-specific show ID.
   *
   * @param tmdbId - The unique TMDb ID for the TV show (required)
   * @returns Promise resolving to provider-specific TV show ID mapping with related information
   */
  async fetchTvProviderId(tmdbId: number): Promise<IMetaMovieIdResponse<IMetaMovieInfo | null>> {
    try {
      const tvShowData = await this.fetchShowInfo(tmdbId);
      const title = tvShowData.data?.name;

      const tmdbdata: IMediaTitle = {
        name: title as string,
        seasons: tvShowData.data?.latestEpisode?.season || tvShowData.data?.seasons,
        totalEpisodes: tvShowData.data?.latestEpisode?.episodeNumber,
      };

      const titleSlug = this.createSlug(title as string);

      const response = await this.himovies.search(titleSlug);

      let result = null;

      if (response && response.data && response.data.length > 0) {
        result = response.data
          .filter((item: any) => item.type === 'TV')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            seasons: item.seasons,
            totalEpisodes: item.totalEpisodes,
            provider: 'flixhq and himovies',
          }));
      }

      return {
        data: tvShowData.data,
        provider: this.mapMediaProviderId(tmdbdata, result, 'TV'),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', data: null, provider: null };
    }
  }

  /**
   * Fetches movie information along with a provider-specific movie ID.
   *
   * @param tmdbId - The unique TMDb ID for the movie (required)
   * @returns Promise resolving to provider-specific movie ID mapping with related information
   */
  async fetchMovieProviderId(tmdbId: number): Promise<IMetaMovieIdResponse<IMetaMovie | null>> {
    try {
      const movieData = await this.fetchMovieInfo(tmdbId);
      const title = movieData.data?.name;

      const titleSlug = this.createSlug(title as string);
      const tmdbdata: IMediaTitle = {
        name: title as string,
        releaseDate: movieData.data?.releaseDate,
        runtime: movieData.data?.runtime,
      };
      let result = null;
      const response = await this.himovies.search(titleSlug);
      if (response && response.data && response.data.length > 0) {
        result = response.data
          .filter((item: any) => item.type === 'Movie')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            releaseDate: item.releaseDate as number,
            duration: Number(item.duration.replace(/\D/g, '')),
            provider: 'flixhq and himovies',
          }));
      }
      return {
        data: movieData.data,
        provider: this.mapMediaProviderId(tmdbdata, result, 'Movie') as IMovieProviderResults,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', data: null, provider: null };
    }
  }

  /**
   * Searches for movies and shows based on the provided query string using TMDb API.
   *
   * @param query - The search query string (required)
   * @param year - The Search the first air date
   * @param page - The page number for pagination (optional, defaults to 1)
   * @returns Promise resolving to paginated list of TV shows matching the search query
   */
  async advancedMultiSearch(query: string, page: number = 1): Promise<IMetaMoviePaginated<IMetaMovie[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: 'Missing required parameter. Query',
      };
    }

    return this.fetchPaginatedData('/search/multi', {
      include_adult: 'true',
      page: String(page),

      query,
    });
  }
}
