import {
  _fetchAtoZList,
  _fetchFavourites,
  _fetchHomePage,
  _fetchMostPopular,
  _fetchRecentlyAdded,
  _fetchRecentlyCompleted,
  _fetchRecentlyUpdated,
  _fetchTopAiring,
  fetchAnimeInfo,
  fetchEpisodeSources,
  fetchServers,
  getEpisodes,
  getSearchSuggestions,
  searchAnime,
} from './hianime.js';
import type {
  ZoroAnimeInfo,
  SearchResponse,
  EpisodeInfoRes,
  ServerInfoResponse,
  HianimeSourceResponse,
  Home,
  HianimeRepetitiveSections,
  AtoZRes,
  SearchSuggestionsResponse,
} from './hianime.js';
import { HiAnimeServers } from './types.js';
import { SubOrDub } from '../../index.js';

/**
 * A class for interacting with the HiAnime platform (hianime.to) to search for anime, fetch detailed information,
 * retrieve episode lists, get available streaming servers, and fetch curated anime lists.
 */
export class HiAnime {
  /**
   * Searches for anime based on the provided query string.
   * @param {string} query - The search query string (required).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns {Promise<SearchResponse>} A promise that resolves to an object containing an array of anime titles, pagination details, or an error message.
   */
  async search(query: string, page: number = 1): Promise<SearchResponse> {
    return searchAnime(query, page);
  }

  /**
   * Searches for anime based on the provided query string(suggestions).
   * @param {string} query - The search query string (required).
   * @returns {Promise<SearchResponse>} A promise that resolves to an object containing an array of anime titles, or an error message.
   */
  async searchSuggestions(query: string): Promise<SearchSuggestionsResponse> {
    return getSearchSuggestions(query);
  }

  /**
   * Fetches detailed information about a specific anime.
   * @param {string} animeId - The unique identifier for the anime (e.g., "naruto-123") (required).
   * @returns {Promise<ZoroAnimeInfo>} A promise that resolves to an object containing anime details, related seasons, characters, recommendations, or an error message.
   */
  async fetchInfo(animeId: string): Promise<ZoroAnimeInfo> {
    return fetchAnimeInfo(animeId);
  }

  /**
   * Fetches episode data for a specific anime.
   * @param {string} animeId - The unique identifier for the anime (e.g., "naruto-123") (required).
   * @returns {Promise<EpisodeInfoRes>} A promise that resolves to an object containing an array of episode information or an error message.
   */
  async fetchEpisodes(animeId: string): Promise<EpisodeInfoRes> {
    return getEpisodes(animeId);
  }

  /**
   * Fetches available streaming servers for a specific anime episode.
   * @param {string} episodeId - The unique identifier for the episode (e.g., "naruto-123-episode-1") (required).
   * @returns {Promise<ServerInfoResponse>} A promise that resolves to an object containing available streaming server details (sub, dub, raw) or an error message.
   */
  async fetchEpisodeServers(episodeId: string): Promise<ServerInfoResponse> {
    return fetchServers(episodeId);
  }

  /**
   * Fetches streaming sources for a given anime episode from a specified server and category.
   * @param {string} episodeId - The unique identifier for the episode (e.g., "naruto-123-episode-1") or a direct server URL (required).
   * @param {HiAnimeServers} [server=HiAnimeServers.HD2] - The streaming server to use (optional, defaults to HiAnimeServers.HD2). Note: HiAnimeServers.HD1 may return a 403 error due to CORS restrictions; use a proxy or switch to HD2 or HD3.
   * @param {SubOrDub} [category=SubOrDub.SUB] - The audio category (Subtitled or Dubbed) (optional, defaults to SubOrDub.SUB).
   * @returns {Promise<HianimeSourceResponse>} A promise that resolves to an object containing streaming sources, headers, sync data (AniList/MAL IDs), or an error message.
   */
  async fetchSources(
    episodeId: string,
    server: HiAnimeServers = HiAnimeServers.HD2,
    category: SubOrDub = SubOrDub.SUB,
  ): Promise<HianimeSourceResponse> {
    return fetchEpisodeSources(episodeId, server, category);
  }

  /**
   * Fetches curated lists from the HiAnime homepage.
   * @returns {Promise<Home>} A promise that resolves to an object containing arrays of spotlight, trending, top airing, most popular, favorites, recently completed, recently added, recently updated anime, and top anime rankings, or an error message.
   */
  async fetchHome(): Promise<Home> {
    return _fetchHomePage();
  }

  /**
   * Fetches a paginated list of the current top airing anime.
   * @param {number} page - The page number for pagination (required).
   * @returns {Promise<HianimeRepetitiveSections>} A promise that resolves to an object containing a list of top airing anime, pagination details, top anime rankings, or an error message.
   */
  async fetchTopAiring(page: number): Promise<HianimeRepetitiveSections> {
    return _fetchTopAiring(page);
  }

  /**
   * Fetches a paginated list of the most popular anime.
   * @param {number} page - The page number for pagination (required).
   * @returns {Promise<HianimeRepetitiveSections>} A promise that resolves to an object containing a list of popular anime, pagination details, top anime rankings, or an error message.
   */
  async fetchMostPopular(page: number): Promise<HianimeRepetitiveSections> {
    return _fetchMostPopular(page);
  }

  /**
   * Fetches a paginated list of the most favorited anime.
   * @param {number} page - The page number for pagination (required).
   * @returns {Promise<HianimeRepetitiveSections>} A promise that resolves to an object containing a list of favorited anime, pagination details, top anime rankings, or an error message.
   */
  async fetchMostFavourites(page: number): Promise<HianimeRepetitiveSections> {
    return _fetchFavourites(page);
  }

  /**
   * Fetches a paginated list of recently completed anime.
   * @param {number} page - The page number for pagination (required).
   * @returns {Promise<HianimeRepetitiveSections>} A promise that resolves to an object containing a list of recently completed anime, pagination details, top anime rankings, or an error message.
   */
  async fetchRecentlyCompleted(page: number): Promise<HianimeRepetitiveSections> {
    return _fetchRecentlyCompleted(page);
  }

  /**
   * Fetches a paginated list of recently added anime.
   * @param {number} page - The page number for pagination (required).
   * @returns {Promise<HianimeRepetitiveSections>} A promise that resolves to an object containing a list of recently added anime, pagination details, top anime rankings, or an error message.
   */
  async fetchRecentlyAdded(page: number): Promise<HianimeRepetitiveSections> {
    return _fetchRecentlyAdded(page);
  }

  /**
   * Fetches a paginated list of recently updated anime.
   * @param {number} page - The page number for pagination (required).
   * @returns {Promise<HianimeRepetitiveSections>} A promise that resolves to an object containing a list of recently updated anime, pagination details, top anime rankings, or an error message.
   */
  async fetchRecentlyUpdated(page: number): Promise<HianimeRepetitiveSections> {
    return _fetchRecentlyUpdated(page);
  }

  /**
   * Fetches a list of anime titles sorted alphabetically.
   * @param {string} [sort] - A letter (A-Z) or "0-9" to filter anime by starting character (optional).
   * @returns {Promise<AtoZRes>} A promise that resolves to an object containing a list of anime titles, pagination details, or an error message.
   */
  async fetchAtoZList(sort?: string): Promise<AtoZRes> {
    return _fetchAtoZList(sort);
  }
}
