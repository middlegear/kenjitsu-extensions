/**
 * AllAnime class for interacting with the AllAnime API to search for anime,
 * fetch episodes, servers, and video sources.
 */
import { BaseClass } from '../../models/base.js';
import { InternalAK, InternalDefaultHls, InternalSMP4, InternalYtMP4 } from '../../source-extractors/allanime/index.js';
import FileMoon from '../../source-extractors/filemoon.js';
import MP4Upload from '../../source-extractors/mp4upload.js';
import Okru from '../../source-extractors/okru.js';
import type {
  AllAnimeServers,
  AllAnimeSourceResponseMap,
  IAllAnime,
  IAllAnimeEpisodes,
  IAllAnimeServers,
} from '../../types/anime/allanime.js';
import type { IBasePaginated, IResponse, ISubOrDub, IVideoSource } from '../../types/base.js';

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
  private decryptSource(input: string): string {
    // If the string doesn't start with "-", return as-is
    if (!input.startsWith('-')) return input;

    // Get the part after the last "-"
    const encryptedPart = input.substring(input.lastIndexOf('-') + 1);

    // Split into pairs of hex characters
    const hexPairs = encryptedPart.match(/.{1,2}/g);
    if (!hexPairs) return input; // fallback

    // Convert each hex pair → byte → XOR with 56 → char
    const decrypted = hexPairs
      .map(pair => parseInt(pair, 16)) // hex → number
      .map(num => num ^ 56) // XOR with 56
      .map(num => String.fromCharCode(num))
      .join('');

    return decrypted;
  }

  /**
   * Searches for anime based on a query string and pagination.
   * @param query - The search query string.
   * @param page - The page number for paginated results (default: 1).
   * @returns A promise resolving to paginated anime search results.
   * @throws Error if the search query is empty.
   */
  async search(query: string, page: number = 1): Promise<IBasePaginated<IAllAnime[] | []>> {
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

      if (!response.data) {
        return { hasNextPage: false, currentPage: 0, data: [], error: response.statusText };
      }
      const anime: IAllAnime[] = response.data.data.shows.edges.map((item: any) => ({
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

      if (!episodeResponse.data) {
        return { error: episodeResponse.statusText || 'No episodes available.', data: [] };
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
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  /**
   * Fetches available servers for a specific episode.
   * @param id - The episode ID in the format 'allanime-<showId>-episode-<episodeNumber>'.
   * @param category - The translation type (sub, dub, or raw, default: 'sub').
   * @returns A promise resolving to a list of servers or an error.
   */
  async fetchServers(id: string, category: ISubOrDub = 'sub'): Promise<IResponse<IAllAnimeServers[] | []>> {
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

      if (!serverResponse.data) {
        return { error: serverResponse.statusText, data: [] };
      }

      let sourceUrls = serverResponse.data.data.episode.sourceUrls;
      if (!sourceUrls) {
        throw new Error(`No servers found for ${id}.`);
      }

      const serverIdMap: Record<string, string> = {
        ok: 'okru',
        // 'fm-hls': 'filemoon', // disabled for reseaons that the stream is IP bound and tokenised  //fm-hls
        mp4: 'mp4upload',
        's-mp4': 'Internal-S-mp4',
        // vg: 'listeamed', // unsupported server uses  aaaencode (idk)
        default: 'Internal-default-hls',
        ak: 'Internal-AK', /// has separate audio and video streams
        // 'luf-mp4': 'Internal-Luf-Mp4', //might be similar to smp4 doesnt work better to just disable it
        'yt-mp4': 'Internal-Yt-mp4', ///http://127.0.0.1:8080?url=https://tools.fast4speed.rsvp//media9/videos/LYKSutL2PaAjYyXWz/sub/23?v=22&headers={"Referer":"https://allmanga.to/"}
      };
      const allowed = ['ok', 'mp4', 's-mp4', 'ak', 'yt-mp4', 'default'];
      const servers = sourceUrls
        .filter((src: { sourceName: string }) => allowed.includes(src.sourceName.toLowerCase()))
        .map((src: { sourceUrl: string; type: string; sourceName: string }) => {
          const key = src.sourceName.toLowerCase();

          let url = this.decryptSource(src.sourceUrl);

          if (url.startsWith('/apivtwo/clock')) {
            url = url.replace('/apivtwo/clock', 'https://blog.allanime.day/apivtwo/clock.json');
          }

          return {
            serverUrl: url,
            type: src.type,
            serverName: src.sourceName,
            serverId: serverIdMap[key] || key,
          };
        });

      return { data: servers };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Error', data: [] };
    }
  }

  /**
   * Fetches video sources for a given episode from multiple servers.
   * @param episodeId - The ID of the episode to fetch sources for.
   * @param category - The translation category (sub, dub, or raw, default: 'sub').
   * @returns A promise resolving to a map of server IDs to their video source responses.
   */
  async fetchSources(episodeId: string, category: ISubOrDub = 'sub'): Promise<AllAnimeSourceResponseMap> {
    const { data, error } = await this.fetchServers(episodeId, category);

    if (!data) {
      throw new Error(error ?? `No servers found for episode: ${episodeId}`);
    }

    const extractors: Record<AllAnimeServers, (url: URL) => Promise<IVideoSource | null>> = {
      mp4upload: url => new MP4Upload().extract(url),
      // filemoon: url => new FileMoon().extract(url),
      okru: url => new Okru().extract(url),
      'Internal-AK': url => new InternalAK().extract(url),
      'Internal-default-hls': url => new InternalDefaultHls().extract(url),
      'Internal-S-mp4': url => new InternalSMP4().extract(url),
      'Internal-Yt-mp4': url => new InternalYtMP4().extract(url),
    };

    const results = await Promise.all(
      data.map(async ({ serverId, serverUrl }) => {
        try {
          const url = new URL(serverUrl);
          const refererOrigin =
            serverId === 'mp4upload'
              ? `https://www.${url.hostname}/`
              : serverId === 'Internal-Yt-mp4'
                ? 'https://blog.allanime.day/'
                : `${url.origin}/`;

          const extractor = extractors[serverId as AllAnimeServers];
          if (!extractor) {
            return null;
          }

          const extracted = await extractor(url);
          if (!extracted) {
            return null;
          }

          return {
            serverId,
            value: { headers: { Referer: refererOrigin }, data: extracted },
          };
        } catch (err) {
          return null;
        }
      }),
    );

    const response = results.reduce<AllAnimeSourceResponseMap>((acc, result) => {
      if (result && result.value.data) {
        acc[result.serverId as AllAnimeServers] = result.value;
      }
      return acc;
    }, {} as AllAnimeSourceResponseMap);

    const hasValidSource = Object.keys(response).length > 0;
    if (!hasValidSource) {
      throw new Error(`No streams available for episode: ${episodeId}.`);
    }

    return response;
  }
}
