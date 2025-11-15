/**
 * AllAnime class for interacting with the AllAnime API to search for anime,
 * fetch episodes, servers, and video sources.
 */
import { BaseClass } from '../../models/base.js';
import { InternalAK, InternalDefaultHls, InternalSMP4, InternalYtMP4 } from '../../source-extractors/allanime/index.js';
import FileMoon from '../../source-extractors/filemoon.js';
import MP4Upload from '../../source-extractors/mp4upload.js';
import Okru from '../../source-extractors/okru.js';
import type { AllAnimeServers, IAllAnime, IAllAnimeEpisodes, IAllAnimeServersInfo } from '../../types/anime/allanime.js';
import type { IBasePaginated, IResponse, ISourceBaseResponse, ISubOrDub, IVideoSource } from '../../types/base.js';
import type { IMovieServers } from '../../types/movies/movie.js';

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
  private readonly pageSize: number = 30;

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
        englishName
        nativeName
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
  private findServerId(
    servers: IAllAnimeServersInfo[],
    preferred: AllAnimeServers,
    version: ISubOrDub = 'sub',
  ): IAllAnimeServersInfo {
    const availableNames = servers.map(s => `${s.serverName} (${s.type})`).join(', ') || 'none';

    // Server priority: preferred first, then best quality
    const serverPriority: AllAnimeServers[] = [
      preferred,
      // 'okru',
      'internal-default-hls',
      'internal-ak',
      'internal-s-mp4',
      'internal-yt-mp4',
      'mp4upload',
    ];

    const uniqueServers = serverPriority.filter((v, i, a) => a.indexOf(v) === i);

    let selected: IAllAnimeServersInfo | undefined;
    let usedServer: AllAnimeServers | null = null;

    // Try each server in priority order
    for (const serverName of uniqueServers) {
      selected = servers.find(
        s =>
          (s.serverName || '').toLowerCase() === serverName.toLowerCase() ||
          (s.serverId || '').toLowerCase() === serverName.toLowerCase(),
      );

      if (selected) {
        usedServer = serverName as AllAnimeServers;
        break;
      }
    }

    if (!selected) {
      throw new Error(
        `No playable server found.\n` +
          `Requested: '${preferred}' (${version})\n` +
          `Tried servers: ${uniqueServers.join(' → ')}\n` +
          `Available: ${availableNames}`,
      );
    }

    // Warn if fallback
    if (usedServer !== preferred) {
      console.warn(
        `Fallback → Server: '${preferred}' → '${usedServer}'\n` +
          `Selected: ${selected.serverName} (${selected.type})\n` +
          `URL: ${selected.serverUrl}`,
      );
    } else {
      console.info(`Preferred server selected: ${selected.serverName}`);
    }

    return selected;
  }
  /**
   * Searches for anime based on a query string and pagination.
   * @param query - The search query string.
   * @param page - The page number for paginated results (default: 1).
   * @returns A promise resolving to paginated anime search results.
   * @throws Error if the search query is empty.
   */
  async search(query: string): Promise<IResponse<IAllAnime[] | []>> {
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
        page: 1,
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
        return { data: [], error: response.statusText };
      }
      const anime: IAllAnime[] = response.data.data.shows.edges.map((item: any) => ({
        id: `${this.createSlug(item.name || item.englishName || item.nativeName)}-${item._id}`,
        romaji: item.name,
        name: item.englishName,
        native: item.nativeName,
        posterImage: item.thumbnail,
        // slugTime: item.slugTime,
      }));
      return {
        data: anime,
      };
    } catch (error) {
      return {
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

    const mediaId = id.split('-').at(-1);
    try {
      const episodePayload = buildPayload(this.EpisodesQuery, { _id: mediaId });
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
          episodeId: `${id}-episode-${ep}`,
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
  async fetchServers(id: string, category: ISubOrDub = 'sub'): Promise<IResponse<IMovieServers[] | []>> {
    const buildPayload = (query: string, variables: object) => ({
      query,
      variables,
    });

    const match = id.match(/([a-z0-9]+)-episode-(\d+)/i);
    if (!match) throw new Error('Invalid episodeId format');

    const showId = `${match[1]}`;
    const episode = `${match[2]}`;

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
        // ok: 'okru', disabled for similar reasons as filemoon
        // 'fm-hls': 'filemoon', // disabled for reseaons that the stream is IP bound and tokenised  //fm-hls
        mp4: 'mp4upload',
        's-mp4': 'internal-s-mp4',
        // vg: 'listeamed', // unsupported server uses  aaaencode (idk)
        default: 'internal-default-hls',
        ak: 'internal-ak', /// has separate audio and video streams
        // 'luf-mp4': 'Internal-Luf-Mp4', //might be similar to smp4 doesnt work better to just disable it
        'yt-mp4': 'internal-yt-mp4', ///http://127.0.0.1:8080?url=https://tools.fast4speed.rsvp//media9/videos/LYKSutL2PaAjYyXWz/sub/23?v=22&headers={"Referer":"https://allmanga.to/"}
      };
      const allowed = ['mp4', 's-mp4', 'ak', 'yt-mp4', 'default'];
      const servers = sourceUrls
        .filter((src: { sourceName: string }) => allowed.includes(src.sourceName.toLowerCase()))
        .map((src: { sourceUrl: string; type: string; sourceName: string }) => {
          const key = src.sourceName.toLowerCase();

          let url = this.decryptSource(src.sourceUrl);

          if (url.startsWith('/apivtwo/clock')) {
            url = url.replace('/apivtwo/clock', 'https://blog.allanime.day/apivtwo/clock.json');
          }

          return {
            serverName: src.sourceName, // swapped this with servername remember to clean this up
            serverId: serverIdMap[key] || key,
          };
        });

      return { data: servers };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Error', data: [] };
    }
  }

  private async fetchServersInternal(
    id: string,
    category: ISubOrDub = 'sub',
  ): Promise<IResponse<IAllAnimeServersInfo[] | []>> {
    const buildPayload = (query: string, variables: object) => ({
      query,
      variables,
    });

    const match = id.match(/([a-z0-9]+)-episode-(\d+)/i);
    if (!match) throw new Error('Invalid episodeId format');

    const showId = `${match[1]}`;
    const episode = `${match[2]}`;

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
        // ok: 'okru',
        // 'fm-hls': 'filemoon', // disabled for reseaons that the stream is IP bound and tokenised  //fm-hls
        mp4: 'mp4upload',
        's-mp4': 'internal-s-mp4',
        // vg: 'listeamed', // unsupported server uses  aaaencode (idk)
        default: 'internal-default-hls',
        ak: 'internal-ak', /// has separate audio and video streams
        // 'luf-mp4': 'Internal-Luf-Mp4', //might be similar to smp4 doesnt work better to just disable it
        'yt-mp4': 'internal-yt-mp4', ///http://127.0.0.1:8080?url=https://tools.fast4speed.rsvp//media9/videos/LYKSutL2PaAjYyXWz/sub/23?v=22&headers={"Referer":"https://allmanga.to/"}
      };
      const allowed = ['mp4', 's-mp4', 'ak', 'yt-mp4', 'default'];
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

  private getReferer(serverId: AllAnimeServers, url: URL): string {
    if (serverId === 'mp4upload') return `https://www.${url.hostname}/`;
    if (serverId === 'internal-yt-mp4') return 'https://blog.allanime.day/';
    return `${url.origin}/`;
  }

  /**
   
   * Fetches streaming sources for a given anime episode from a specified server and category.
   * @param {string} episodeId - The unique identifier for the episode (required).
   * @param {HISubOrDub} version  - The audio category (Subtitled or Dubbed) (optional, defaults to SubOrDub.SUB).
   * @param {string}  server - The streaming server to use (optional, defaults to okru).
   * @returns  A promise that resolves to an object containing streaming sources, headers, or an error message.
   */
  async fetchSources(
    episodeId: string,
    server: AllAnimeServers = 'internal-ak',
    version: ISubOrDub = 'sub',
  ): Promise<ISourceBaseResponse<IVideoSource | null>> {
    const { data: availableServers, error } = await this.fetchServersInternal(episodeId, version);

    if (!availableServers?.length) {
      throw new Error(error ?? `No streaming servers found for episode ${episodeId}`);
    }

    const extractionPriority: AllAnimeServers[] = [
      server,
      // 'okru',
      'internal-default-hls',
      'internal-s-mp4',
      'internal-yt-mp4',
      'internal-ak',
      'mp4upload',
    ].filter((id, index, arr) => arr.indexOf(id) === index) as AllAnimeServers[];

    const extractorRegistry: Record<AllAnimeServers, (url: URL) => Promise<IVideoSource | null>> = {
      // okru: url => new Okru().extract(url),
      mp4upload: url => new MP4Upload().extract(url),
      'internal-ak': url => new InternalAK().extract(url),
      'internal-default-hls': url => new InternalDefaultHls().extract(url),
      'internal-s-mp4': url => new InternalSMP4().extract(url),
      'internal-yt-mp4': url => new InternalYtMP4().extract(url),
    };

    for (const serverId of extractionPriority) {
      const serverInfo = availableServers.find(s => s.serverId === serverId);
      if (!serverInfo) continue; // server 404
      const extract = extractorRegistry[serverId];
      if (!extract) {
        console.warn(`[skip] No extractor defined for server "${serverId}" (${serverInfo.serverName})`);
        continue;
      }

      const url = new URL(serverInfo.serverUrl);
      const refererHeader = this.getReferer(serverId, url);

      console.info(`[attempt] ${serverInfo.serverName} (${serverId})`);

      try {
        const videoSource = await extract(url);

        if (videoSource) {
          console.info(`[success] Selected server: ${serverId}`);
          return {
            headers: { Referer: refererHeader },
            data: videoSource,
          };
        }
      } catch (err: any) {
        console.error(`[error] ${serverId} → ${err.message ?? err}`);
      }
    }

    const attemptedServers = extractionPriority.filter(id => availableServers.some(s => s.serverId === id));

    const readableServerList = availableServers.map(s => `${s.serverName} (${s.serverId})`).join(', ');

    throw new Error(
      `Unable to extract a playable source for episode ${episodeId}\n` +
        `Tried: ${attemptedServers.join(' → ')}\n` +
        `Available servers: ${readableServerList}`,
    );
  }
}
