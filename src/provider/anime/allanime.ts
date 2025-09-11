/**
 * AllAnime class for interacting with the AllAnime API to search for anime,
 * fetch episodes, servers, and video sources.
 */
import { BaseClass } from '../../models/base-anime.js';
import type {
  AllAnimeServers,
  AllAnimeSourceResponseMap,
  HISubOrDub,
  IAllAnimeEpisodes,
  IAllAnimeServers,
  IAnimePaginated,
  IBaseAnime,
  IResponse,
  IVideoSource,
} from '../../models/types.js';
import FileMoon from '../../source-extractors/filemoon.js';
import MP4Upload from '../../source-extractors/mp4upload.js';
import Okru from '../../source-extractors/okru.js';

/**
 * Class to handle interactions with the AllAnime API.
 * @extends BaseClass
 */
export class AllAnime extends BaseClass {
  /**
   * Base URL for the AllAnime API.
   * @private
   */
  private readonly baseUrl: string = 'https://api.allanime.day/api';

  /**
   * Initializes the AllAnime class.
   */
  constructor() {
    super();
  }

  /**
   * Number of items per page for search results.
   * @private
   */
  private readonly pageSize: number = 26;

  /**
   * GraphQL query for searching anime shows.
   * @private
   */
  private SearchQuery = `
  query ($search: SearchInput, $limit: Int, $page: Int,  $countryOrigin: VaildCountryOriginEnumType) {
    shows(search: $search, limit: $limit, page: $page, countryOrigin: $countryOrigin) {
      edges {
        _id
        name
        englishName
        nativeName
        thumbnail
        slugTime
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

  /**
   * GraphQL query for fetching episode details for a specific show.
   * @private
   */
  private EpisodesQuery = `
    query ($_id: String!) {
      show(
        _id: $_id
      ) {
        _id
        availableEpisodesDetail
      }
    }
`;

  /**
   * GraphQL query for fetching streaming sources for a specific episode.
   * @private
   */
  private StreamsQuery = `
    query(
      $showId: String!,
      $translationType: VaildTranslationTypeEnumType!,
      $episodeString: String!
    ) {
      episode(
        showId: $showId
        translationType: $translationType
        episodeString: $episodeString
      ) {
        sourceUrls
      }
    }
`;

  /**
   * Searches for anime based on a query string and pagination.
   * @param query - The search query string.
   * @param page - The page number for paginated results (default: 1).
   * @returns A promise resolving to paginated anime search results.
   * @throws Error if the search query is empty.
   */
  async search(query: string, page: number = 1): Promise<IAnimePaginated<IBaseAnime[] | []>> {
    if (query.length === 0) {
      throw new Error('Search query cannot be empty.');
    }
    const payload = {
      variables: {
        search: {
          query: query,
          allowAdult: false,
          allowUnknown: false,
        },
        limit: this.pageSize,
        page: page,
        countryOrigin: 'ALL',
      },
      query: this.SearchQuery,
    };
    try {
      const response = await this.client.post(this.baseUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const anime: IBaseAnime[] = response.data.data.shows.edges.map((item: any) => ({
        id: item._id,
        romaji: item.name,
        name: item.englishName,
        native: item.nativeName,
        posterImage: item.thumbnail,
        // slugTime: item.slugTime,
      }));
      return {
        hasNextPage: response.data.data.shows.pageInfo.hasNextPage,
        currentPage: page,
        data: anime,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches episode details for a specific anime by its ID.
   * @param id - The ID of the anime show.
   * @returns A promise resolving to a list of episodes or an error.
   * @throws Error if the ID is empty.
   */
  async fetchEpisodes(id: string): Promise<IResponse<IAllAnimeEpisodes[] | []>> {
    if (id.length === 0) {
      throw new Error('id cannot be empty.');
    }
    const buildPayload = (query: string, variables: object) => ({
      query,
      variables,
    });
    try {
      const episodePayload = buildPayload(this.EpisodesQuery, { _id: id });
      const episodeResponse = await this.client.post(this.baseUrl, episodePayload);
      const available = episodeResponse.data.data.show.availableEpisodesDetail;
      if (!available) {
        return { data: [], error: 'No episodes available.' };
      }
      const allEpisodes = new Set([...(available.sub || []), ...(available.dub || []), ...(available.raw || [])]);
      const episodes = Array.from(allEpisodes)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(ep => ({
          episodeNumber: parseInt(ep),
          episodeId: `allanime-${id}-episode-${ep}`,
          hasSub: available.sub?.includes(ep) || false,
          hasDub: available.dub?.includes(ep) || false,
          hasRaw: available.raw?.includes(ep) || false,
        }));
      return { data: episodes };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches available servers for a specific episode.
   * @param id - The episode ID in the format 'allanime-<showId>-episode-<episodeNumber>'.
   * @param category - The translation type (sub, dub, or raw, default: 'sub').
   * @returns A promise resolving to a list of servers or an error.
   */
  async fetchServers(id: string, category: HISubOrDub = 'sub'): Promise<IResponse<IAllAnimeServers[] | []>> {
    const buildPayload = (query: string, variables: object) => ({
      query,
      variables,
    });
    const showId = id.split('-').at(1);
    const episode = id.split('-').at(-1);
    try {
      const serverPayload = buildPayload(this.StreamsQuery, {
        showId: showId,
        translationType: category,
        episodeString: String(episode),
      });
      const serverResponse = await this.client.post(this.baseUrl, serverPayload);
      let sourceUrls = serverResponse.data.data.episode.sourceUrls;
      if (!sourceUrls) {
        throw new Error(`No servers found for ${id}.`);
      }
      const serverIdMap: Record<string, string> = {
        ok: 'okru',
        'fm-hls': 'filemoon',
        mp4: 'mp4upload',
        // vg: 'listeamed', unsupported server
      };
      const allowed = ['ok', 'fm-hls', 'mp4'];
      const servers = sourceUrls
        .filter((src: { sourceName: string }) => allowed.includes(src.sourceName.toLowerCase()))
        .map((src: { sourceUrl: string; type: string; sourceName: string }) => {
          const key = src.sourceName.toLowerCase();
          return {
            serverUrl: src.sourceUrl,
            type: src.type,
            serverName: src.sourceName,
            serverId: serverIdMap[key] || key,
          };
        });
      return { data: servers };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches video sources for a given episode from multiple servers.
   * @param episodeId - The ID of the episode to fetch sources for.
   * @param category - The translation category (sub, dub, or raw, default: 'sub').
   * @returns A promise resolving to a map of server IDs to their video source responses.
   */
  async fetchSources(episodeId: string, category: HISubOrDub = 'sub'): Promise<AllAnimeSourceResponseMap> {
    const { data, error } = await this.fetchServers(episodeId, category);
    if (!data || error) {
      return {};
    }

    const results = await Promise.all(
      data.map(async ({ serverId, serverUrl }) => {
        try {
          const url = new URL(serverUrl);

          const refererOrigin = serverId === 'mp4upload' ? `https://www.${url.hostname}/` : `${url.origin}/`;

          const extractors: { [key: string]: () => Promise<IVideoSource | null> } = {
            mp4upload: () => new MP4Upload().extract(url),
            filemoon: () => new FileMoon().extract(url),
            okru: () => new Okru().extract(url),
          };

          const data = await (extractors[serverId as AllAnimeServers]?.() ?? null);
          return {
            serverId: serverId as AllAnimeServers,
            value: data
              ? { headers: { Referer: refererOrigin }, data }
              : { headers: { Referer: null }, data: null, error: `Unsupported server: ${serverId}` },
          };
        } catch (error) {
          return {
            serverId: serverId as AllAnimeServers,
            value: {
              headers: { Referer: null },
              data: null,
              error: error instanceof Error ? error.message : 'Unknown Error',
            },
          };
        }
      }),
    );

    return results.reduce((acc, { serverId, value }) => ({ ...acc, [serverId]: value }), {} as AllAnimeSourceResponseMap);
  }
}
