import { BaseClass } from '../../models/base.js';

import * as cheerio from 'cheerio';
import Kwik from '../../source-extractors/kwik.js';
import type {
  IPaheAnime,
  IPaheAnimeInfoResponse,
  IPaheEpisodes,
  IPaheInfo,
  IPahePaginated,
  IPaheServersResponse,
} from '../../types/anime/animepahe.js';
import type { IResponse, IServerInfo, ISourceBaseResponse, ISubOrDub, IVideoSource } from '../../types/base.js';

/**
 * A class for interacting with the Animepahe platform  to search for anime, fetch detailed information,
 * retrieve episode lists, get available streaming servers, and sources.
 */
export class Animepahe extends BaseClass {
  private readonly baseUrl: string;
  constructor(baseUrl: string = 'https://animepahe.si') {
    super();
    this.baseUrl = baseUrl;
  }

  private headers(id: string | false) {
    return {
      Cookie: '__ddg2_=;',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: id ? `${this.baseUrl}/anime/${id}` : `${this.baseUrl}`,
    };
  }

  /**
   * Parses HTML content to extract detailed anime information.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @param {string} animeId - The unique identifier for the anime.
   * @returns {IPaheInfo} An object containing parsed anime information.
   */
  private parseAnimeInfo($: cheerio.CheerioAPI, animeId: string): IPaheInfo {
    const animeinfo: IPaheInfo = {
      anilistId: Number($('head').find('meta[name="anilist"]').attr('content')) || null,
      malId: Number($('head').find('meta[name="myanimelist"]').attr('content')) || null,
      id: `${animeId}`,
      name: ($('header.anime-header').find('a.fa.fa-link.text-white').attr('title') || '')
        .replace(/^Bookmark\s+/i, '')
        .trim(),
      romaji:
        $('header.anime-header')
          .find('h2.japanese')
          .text()
          .replace(/^Bookmark\s+/i, '')
          .trim() || null,
      posterImage: $('div.anime-poster > a').attr('href') || null,
      altnames: $('div.col-sm-4.anime-info').find('p:contains("Japanese")').text().split(':').at(1)?.trim() || null,
      japanese: $('div.col-sm-4.anime-info').find('p:contains("Japanese")').text().split(':').at(1)?.trim() || null,
      type: $('div.col-sm-4.anime-info').find('p:contains("Type")').text().split(':').at(1)?.trim() || null,
      status: $('div.col-sm-4.anime-info').find('p:contains("Status:")').text().split(':').at(1)?.trim() || null,
      releaseDate:
        $('div.col-sm-4.anime-info').find('p:contains("Aired:")').text().split(':').at(1)?.trim().replace(/\s+/g, ' ') ||
        null,
      studios: $('div.col-sm-4.anime-info').find('p:contains("Studio:")').text().split(':').at(1)?.trim() || null,
      synopsis: $('div.anime-synopsis').text().trim() || null,
      score: null,
      producers: null,
      episodes: {
        sub: Number($('div.col-sm-4.anime-info').find('p:contains("Episodes:")').text().trim().split(':').at(1)) || null,
        dub: null,
      },
      totalEpisodes:
        Number($('div.col-sm-4.anime-info').find('p:contains("Episodes:")').text().trim().split(':').at(1)) || null,
      duration: $('div.col-sm-4.anime-info').find('p:contains("Duration:")').text().trim().split(':').at(1) || null,
      genres:
        $('div.anime-genre ul li')
          .map((i, el) => $(el).find('a').attr('title'))
          .get() || null,
    };

    return animeinfo;
  }

  /**
   * Parses HTML content to extract streaming server information for an episode.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @returns {{servers: HIServerInfo; download: HIServerInfo}} An object containing streaming servers and download servers.
   */
  private parseServers($: cheerio.CheerioAPI) {
    const subSelector: cheerio.SelectorType = 'div#resolutionMenu button[data-audio="jpn"]';
    const chiSelector: cheerio.SelectorType = 'div#resolutionMenu button[data-audio="chi"]';
    const dubSelector: cheerio.SelectorType = 'div#resolutionMenu button[data-audio="eng"]';
    const servers: IServerInfo = {
      sub: [],
      dub: [],
      raw: [],
      episodeNumber: 0,
    };
    const download: IServerInfo = { sub: [], dub: [], raw: [], episodeNumber: 0 };

    const h1Text = $('div.theatre-info h1').text().trim();
    const match = h1Text.match(/-\s*(\d+)/);
    const episode = match ? parseInt(match[1], 10) : 0;

    servers.episodeNumber = episode;
    download.episodeNumber = episode;

    // Check which selector actually has elements
    let selectorToUse =
      subSelector && $(subSelector).length > 0 ? subSelector : chiSelector && $(chiSelector).length > 0 ? chiSelector : null;

    if (selectorToUse) {
      $(selectorToUse).each((_, element) => {
        servers.sub.push({
          serverId: $(element).attr('data-src') || null,
          serverName: $(element).text().trim() || null,
          mediaId: $(element).attr('data-src')?.split('/').at(-1) || null,
        });
      });

      // Slice to first 3 sub servers
      servers.sub = servers.sub.slice(0, 3);
    }

    $(dubSelector).each((_, element) => {
      servers.dub.push({
        serverId: $(element).attr('data-src') || null,
        serverName: $(element).text().trim() || null,
        mediaId: $(element).attr('data-src')?.split('/').at(-1) || null,
      });
    });

    // Slice to first 3 dub servers
    servers.dub = servers.dub.slice(0, 3);

    /// download servers
    const chiDownloadSelector: cheerio.SelectorType = '#pickDownload a.dropdown-item:has(span:contains("chi"))';
    const dubDownloadSelector: cheerio.SelectorType = '#pickDownload a.dropdown-item:has(span:contains("eng"))';
    const subDownloadSelector: cheerio.SelectorType = '#pickDownload a.dropdown-item:has(span:contains("BD"))';
    const altSubDownloadSelector: cheerio.SelectorType = '#pickDownload a.dropdown-item';

    let downloadSubSelector;
    downloadSubSelector =
      subDownloadSelector && $(subDownloadSelector).length > 0
        ? subDownloadSelector
        : chiDownloadSelector && $(chiDownloadSelector).length > 0
          ? chiDownloadSelector
          : altSubDownloadSelector;

    if (downloadSubSelector) {
      $(downloadSubSelector).each((_, element) => {
        download.sub.push({
          serverId: $(element).attr('href') || null,
          serverName: $(element).text().trim() || null,
          mediaId: $(element).attr('href')?.split('/').at(-1) || null,
        });
      });

      // Slice to first 3 download sub servers
      download.sub = download.sub.slice(0, 3);
    }

    $(dubDownloadSelector).each((_, element) => {
      download.dub.push({
        serverId: $(element).attr('href') || null,
        serverName: $(element).text().trim() || null,
        mediaId: $(element).attr('href')?.split('/').at(-1) || null,
      });
    });

    // Slice to first 3 download dub servers
    download.dub = download.dub.slice(0, 3);

    return { servers, download };
  }

  /**
   * Finds available server IDs for a specific audio category from the parsed server data.
   * @private
   * @param {IServerInfo} servers - The parsed streaming server information.
   * @param {IServerInfo} download - The parsed download server information.
   * @param {ISubOrDub} category - The audio category to filter servers for ('sub', 'dub', or 'raw').
   * @returns {Array<{serverId: string; serverName: string; downloadId: string | null}>} An array of server objects with IDs and download information.
   * @throws {Error} If no servers are available for the specified category.
   */
  private findServerIds(
    servers: IServerInfo,
    download: IServerInfo,
    category: ISubOrDub,
  ): { serverId: string; serverName: string; downloadId: string | null }[] {
    const availableVersions: string[] = [];
    if (servers.sub?.length > 0) availableVersions.push('sub');
    if (servers.dub?.length > 0) availableVersions.push('dub');
    if (servers.raw?.length > 0) availableVersions.push('raw');

    if (!servers[category] || servers[category].length === 0) {
      const suggestionMessage =
        availableVersions.length > 0
          ? ` Available versions: ${availableVersions.join(' or ')}.`
          : ' No servers available in any version right now.';
      throw new Error(`Version '${category}' has no servers.${suggestionMessage}`);
    }

    const parseQuality = (name?: string | null): number => {
      const match = name?.match(/(\d{3,4})p/i);
      return match ? parseInt(match[1], 10) : 0;
    };

    const highestDownload = download[category]
      ?.slice()
      .sort((a, b) => parseQuality(b.serverName) - parseQuality(a.serverName))[0];

    return servers[category].map(s => {
      const qualityMatch = s.serverName?.match(/(\d{3,4}p)/i);
      return {
        serverId: s.serverId! as string,
        serverName: qualityMatch ? qualityMatch[1] : 'unknown',
        downloadId: highestDownload?.serverId as string,
      };
    });
  }

  /**
   * Searches for anime based on the provided query string.
   * @param {string} query - The search query string (required).
   * @returns  A promise that resolves to an object containing an array of anime titles, pagination details, or an error message.
   */
  async search(query: string): Promise<IPahePaginated<IPaheAnime[] | []>> {
    if (!query) {
      throw new Error('Query cannot be empty');
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/api?m=search&q=${query}`, {
        headers: this.headers(false),
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          perPage: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
        };
      }
      const data: IPaheAnime[] = response.data.data.map((item: any) => ({
        id: item.session,
        name: item.title,
        type: item.type,
        releaseDate: item.year,
        season: item.season,
        posterImage: item.poster,
        totalEpisodes: item.episodes,
      }));
      return {
        hasNextPage: response.data.last_page > 1,
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        totalResults: response.data.total,
        lastPage: response.data.last_page,
        data: data as IPaheAnime[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        perPage: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   *  Fetches recently updated anime. Mostly those that are airing
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @returns
   */
  async fetchRecentEpisodes(page: number = 1): Promise<IPahePaginated<IPaheEpisodes[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/api?m=airing&page=${page}`, {
        headers: this.headers(false),
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          perPage: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
        };
      }

      const data: IPaheEpisodes[] = response.data.data.map((item: any) => ({
        episodeId: `pahe-${item.anime_session}-$session$-${item.session}`,
        title: item.anime_title,
        thumbnail: item.snapshot,
        episodeNumber: item.episode,
      }));
      return {
        hasNextPage: response.data.last_page > 1,
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        totalResults: response.data.total,
        lastPage: response.data.last_page,
        data: data as IPaheEpisodes[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        perPage: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime including episodes.
   * @param {string} animeId - The unique identifier for the anime (required).
   * @returns  A promise that resolves to an object containing anime details, or an error message.
   */
  async fetchAnimeInfo(animeId: string): Promise<IPaheAnimeInfoResponse<IPaheInfo | null>> {
    if (!animeId) {
      throw new Error('animeId cannot be empty');
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/anime/${animeId}`, { headers: this.headers(false) });

      if (!response.data) {
        return { error: response.statusText, data: null, providerEpisodes: [] };
      }

      const releaseRes = await this.client.get(`${this.baseUrl}/api?m=release&id=${animeId}&sort=episode_asc&page=1`, {
        headers: this.headers(animeId),
      });

      const last_page = releaseRes.data?.last_page ?? 1;
      const episodesList = releaseRes.data?.data ?? [];

      let episodes = episodesList.map((item: any) => ({
        episodeId: `pahe-${animeId}-$session$-${item.session}`,
        episodeNumber: item.episode || null,
        title: item.title || null,
        thumbnail: item.snapshot || null,
      }));

      if (episodes.length === 0) {
        return {
          data: this.parseAnimeInfo(cheerio.load(response.data), animeId),
          providerEpisodes: [],
          error: 'No episodes found',
        };
      }

      if (last_page > 1) {
        const pageRequests = [];
        for (let page = 2; page <= last_page; page++) {
          pageRequests.push(
            this.client.get(`${this.baseUrl}/api?m=release&id=${animeId}&sort=episode_asc&page=${page}`, {
              headers: this.headers(animeId),
            }),
          );
        }

        const responses = await Promise.all(pageRequests);

        for (const res of responses) {
          episodes.push(
            ...res.data.data.map((item: any) => ({
              episodeId: `pahe-${animeId}-$session$-${item.session}`,
              episodeNumber: item.episode || null,
              title: item.title || null,
              thumbnail: item.snapshot || null,
              // duration: item.duration,
              // url: `${this.baseUrl}/play/${id}/${item.session}`,
            })),
          );
        }
      }

      return {
        data: this.parseAnimeInfo(cheerio.load(response.data), animeId),
        providerEpisodes: episodes,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Error', data: null, providerEpisodes: [] };
    }
  }

  /**
   * Fetches episode data for a specific anime.
   * @param {string} animeId - The unique identifier for the anime (required).
   * @returns  A promise that resolves to an object containing an array of episode information or an error message.
   */

  async fetchEpisodes(animeId: string): Promise<IResponse<IPaheEpisodes[] | []>> {
    if (!animeId) {
      throw new Error('Missing required params: animeid');
    }
    try {
      const releaseRes = await this.client.get(`${this.baseUrl}/api?m=release&id=${animeId}&sort=episode_asc&page=1`, {
        headers: this.headers(animeId),
      });

      const last_page = releaseRes.data?.last_page ?? 1;
      const episodesList = releaseRes.data?.data ?? [];

      let episodes = episodesList.map((item: any) => ({
        episodeId: `pahe-${animeId}-$session$-${item.session}`,
        episodeNumber: item.episode || null,
        title: item.title || null,
        thumbnail: item.snapshot || null,
      }));

      if (episodes.length === 0) {
        return {
          data: [],
          error: 'No episodes found',
        };
      }

      if (last_page > 1) {
        const pageRequests = [];
        for (let page = 2; page <= last_page; page++) {
          pageRequests.push(
            this.client.get(`${this.baseUrl}/api?m=release&id=${animeId}&sort=episode_asc&page=${page}`, {
              headers: this.headers(animeId),
            }),
          );
        }

        const responses = await Promise.all(pageRequests);

        for (const res of responses) {
          episodes.push(
            ...res.data.data.map((item: any) => ({
              episodeId: `pahe-${animeId}-$session$-${item.session}`,
              episodeNumber: item.episode || null,
              title: item.title || null,
              thumbnail: item.snapshot || null,
              // duration: item.duration,
              // url: `${this.baseUrl}/play/${id}/${item.session}`,
            })),
          );
        }
      }

      return { data: episodes as IPaheEpisodes[] };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Error', data: [] };
    }
  }

  /**
   * Fetches available streaming servers for a specific anime episode.
   * @param {string} episodeId - The unique identifier for the episode  (required).
   * @returns  A promise that resolves to an object containing available streaming server details (sub, dub, raw) or an error message.
   */
  async fetchServers(episodeId: string): Promise<IPaheServersResponse<IServerInfo | null>> {
    if (!episodeId) {
      throw new Error('Missing required parameter: episodeId');
    }
    const prefix = 'pahe-';

    if (!episodeId.startsWith(prefix)) {
      throw new Error(`Invalid episodeId format: expected to start with "${prefix}", got "${episodeId}"`);
    }

    const id = episodeId.slice(prefix.length);

    if (!id) {
      throw new Error(`Invalid episodeId: missing identifier after "${prefix}" in "${episodeId}"`);
    }

    const animeId = id.split('-$session$-').at(0);
    const url = id.replace('-$session$-', '/');
    if (!animeId) {
      throw new Error(`Invalid episodeId`);
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/play/${url}`, { headers: this.headers(animeId) });
      if (!response.data) {
        return { error: response.statusText, data: null, download: null };
      }
      const { servers, download } = this.parseServers(cheerio.load(response.data));

      return { data: servers, download };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Error', data: null, download: null };
    }
  }

  /**
   * Fetches streaming sources for a given anime episode from a specified server and category.
   * @param {string} episodeId - The unique identifier for the episode (required).
   * @param {ISubOrDub} category  - The audio category (Subtitled or Dubbed) (optional, defaults to SubOrDub.SUB).
   * @returns  A promise that resolves to an object containing streaming sources, headers,  or an error message.
   */
  async fetchSources(episodeId: string, category: ISubOrDub = 'sub'): Promise<ISourceBaseResponse<IVideoSource | null>> {
    try {
      const servers = await this.fetchServers(episodeId);
      if (servers.error) {
        throw new Error(servers.error);
      }

      const serverIds = this.findServerIds(servers.download as IServerInfo, servers.data as IServerInfo, category);

      const fulfilled: IVideoSource[] = [];
      const rejected: any[] = [];

      // --- Sequential Processing ---
      for (const s of serverIds) {
        try {
          const url = new URL(s.serverId, this.baseUrl);
          const result = await new Kwik().extractMP4(url, s.serverName, this.baseUrl);

          if (result) {
            //@ts-ignore
            fulfilled.push(result);
          }
        } catch (err) {
          rejected.push(err);
        }
      }

      // Handle errors if none succeeded or if you want strict error reporting
      if (rejected.length > 0 && fulfilled.length === 0) {
        throw new Error(`All extractions failed: ${rejected.map(e => String(e)).join('; ')}`);
      }

      const highestDownloadId = serverIds.find(s => s.downloadId)?.downloadId || null;

      const merged: IVideoSource = {
        sources: fulfilled.flatMap(item => item.sources || []),
        download: highestDownloadId || null,
      };

      const firstServerOrigin = serverIds.length > 0 ? `${new URL(serverIds[0].serverId).origin}/` : null;

      return {
        headers: { Referer: firstServerOrigin },
        data: merged,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Fatal Error',
        data: null,
        headers: { Referer: null },
      };
    }
  }
}
