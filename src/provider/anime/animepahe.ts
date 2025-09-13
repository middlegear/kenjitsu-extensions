import { BaseClass } from '../../models/base-anime.js';
import type {
  HIServerInfo,
  HISourceResponse,
  HISubOrDub,
  IAnime,
  IAnimeInfo,
  IAnimePaginated,
  IEpisodes,
  IPaheServersResponse,
  IResponse,
  IVideoSource,
} from '../../models/types.js';
import * as cheerio from 'cheerio';
import Kwik from '../../source-extractors/kwik.js';

/**
 * A class for interacting with the Animepahe platform  to search for anime, fetch detailed information,
 * retrieve episode lists, get available streaming servers, and sources.
 */
export class Animepahe extends BaseClass {
  private readonly baseUrl: string = 'https://animepahe.si';
  constructor() {
    super();
  }

  private headers(id: string | false) {
    return {
      Cookie: '__ddg2_=;',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: id ? `${this.baseUrl}/anime/${id}` : `${this.baseUrl}`,
    };
  }

  private parseAnimeInfo($: cheerio.CheerioAPI, animeId: string): IResponse<IAnimeInfo> {
    const animeinfo: IAnimeInfo = {
      anilistId: Number($('head').find('meta[name="anilist"]').attr('content')) || null,
      malId: Number($('head').find('meta[name="myanimelist"]').attr('content')) || null,
      id: `${animeId}`,
      name: $('header.anime-header').find('a.fa.fa-link.text-white').attr('title') || null,
      romaji: $('header.anime-header').find('h2.japanese').text().trim() || null,
      posterImage: $('div.anime-poster > a').attr('href') || null,
      altnames: $('div.col-sm-4.anime-info').find('p:contains("Japanese")').text().trim().split(':').at(1)?.trim() || null,
      japanese: $('div.col-sm-4.anime-info').find('p:contains("Japanese")').text().trim().split(':').at(1)?.trim() || null,
      type: $('div.col-sm-4.anime-info').find('p:contains("Type")').text().trim().split(':').at(1)?.trim() || null,
      status: $('div.col-sm-4.anime-info').find('p:contains("Status:")').text().trim().split(':').at(1)?.trim() || null,
      startDate: $('div.col-sm-4.anime-info').find('p:contains("Aired:")').text().trim().split(':').at(1)?.trim() || null,
      studios: $('div.col-sm-4.anime-info').find('p:contains("Studio:")').text().trim().split(':').at(1)?.trim() || null,
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

    return { data: animeinfo };
  }

  private parseServers($: cheerio.CheerioAPI) {
    const subSelector: cheerio.SelectorType = 'div#resolutionMenu button[data-audio="jpn"]';
    const dubSelector: cheerio.SelectorType = 'div#resolutionMenu button[data-audio="eng"]';
    const servers: HIServerInfo = {
      sub: [],
      dub: [],
      raw: [],
      episodeNumber: 0,
    };
    const download: HIServerInfo = { sub: [], dub: [], raw: [], episodeNumber: 0 };

    const h1Text = $('div.theatre-info h1').text().trim();
    const match = h1Text.match(/-\s*(\d+)/);
    const episode = match ? parseInt(match[1], 10) : 0;

    servers.episodeNumber = episode;
    download.episodeNumber = episode;

    $(subSelector).each((_, element) => {
      servers.sub.push({
        serverId: $(element).attr('data-src') || null,
        serverName: $(element).text().trim() || null,
        mediaId: $(element).attr('data-src')?.split('/').at(-1) || null,
      });
    });

    $(dubSelector).each((_, element) => {
      servers.dub.push({
        serverId: $(element).attr('data-src') || null,
        serverName: $(element).text().trim() || null,
        mediaId: $(element).attr('data-src')?.split('/').at(-1) || null,
      });
    });

    /// download servers
    $('#pickDownload a:not(:has(span.badge-warning))').each((_, element) => {
      const href = $(element).attr('href') || null;
      download.sub.push({
        serverId: href,
        serverName: $(element).text().trim() || null,
        mediaId: href ? href.split('/').at(-1) || null : null,
      });
    });

    $('#pickDownload a:has(span.badge-warning)').each((_, element) => {
      const href = $(element).attr('href') || null;
      download.dub.push({
        serverId: href,
        serverName: $(element).text().trim() || null,
        mediaId: href ? href.split('/').at(-1) || null : null,
      });
    });

    return { servers, download };
  }

  private findServerIds(
    servers: HIServerInfo,
    download: HIServerInfo,
    category: HISubOrDub,
  ): { serverId: string; serverName: string; downloadId: string | null }[] {
    const availableCategories: string[] = [];
    if (servers.sub?.length > 0) availableCategories.push('sub');
    if (servers.dub?.length > 0) availableCategories.push('dub');
    if (servers.raw?.length > 0) availableCategories.push('raw');

    if (!servers[category] || servers[category].length === 0) {
      const suggestionMessage =
        availableCategories.length > 0
          ? ` Available categories: ${availableCategories.join(' or ')}.`
          : ' No servers available in any category right now.';
      throw new Error(`Category '${category}' has no servers.${suggestionMessage}`);
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
  async search(query: string): Promise<IAnimePaginated<IAnime[] | []>> {
    if (!query) {
      throw new Error('Query cannot be empty');
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/api?m=search&q=${query}`, {
        headers: this.headers(false),
      });

      const data: IAnime[] = response.data.data.map((item: any) => ({
        id: item.session,
        name: item.title,
        type: item.type,
        posterImage: item.poster,
        totalEpisodes: item.episodes,
      }));
      return {
        hasNextPage: response.data.last_page > 1,
        perPage: response.data.per_page,
        currentPage: response.data.current_page,
        totalResults: response.data.total,
        lastPage: response.data.last_page,
        data: data as IAnime[],
      };
    } catch (error) {
      return {
        hasNextPage: false,
        perPage: 0,
        currentPage: 0,
        totalResults: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime.
   * @param {string} animeId - The unique identifier for the anime (e.g., "bleach-806") (required).
   * @returns  A promise that resolves to an object containing anime details, or an error message.
   */
  async fetchAnimeInfo(animeId: string): Promise<IResponse<IAnimeInfo | null>> {
    if (!animeId) {
      throw new Error('AnimeId cannot be empty');
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/anime/${animeId}`, { headers: this.headers(false) });
      return this.parseAnimeInfo(cheerio.load(response.data), animeId);
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown Error' };
    }
  }

  /**
   * Fetches episode data for a specific anime.
   * @param {string} animeId - The unique identifier for the anime (required).
   * @returns  A promise that resolves to an object containing an array of episode information or an error message.
   */

  async fetchEpisodes(animeId: string): Promise<IResponse<IEpisodes[] | []>> {
    if (!animeId) {
      throw new Error('Missing required params: animeid');
    }
    try {
      const {
        data: { last_page, data },
      } = await this.client.get(`${this.baseUrl}/api?m=release&id=${animeId}&sort=episode_asc&page=1`, {
        headers: this.headers(animeId),
      });

      let episodes = data.map((item: any) => ({
        episodeId: `pahe-${animeId}/${item.session}`,
        episodeNumber: item.episode || null,
        title: item.title || null,
        thumbnail: item.snapshot || null,
        // duration: item.duration,
        // url: `${this.baseUrl}/play/${id}/${item.session}`,
      }));

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
              episodeId: `pahe-${animeId}/${item.session}`,
              episodeNumber: item.episode || null,
              title: item.title || null,
              thumbnail: item.snapshot || null,
              // duration: item.duration,
              // url: `${this.baseUrl}/play/${id}/${item.session}`,
            })),
          );
        }
      }

      return { data: episodes as IEpisodes[] };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown Error' };
    }
  }

  /**
   * Fetches available streaming servers for a specific anime episode.
   * @param {string} episodeId - The unique identifier for the episode  (required).
   * @returns  A promise that resolves to an object containing available streaming server details (sub, dub, raw) or an error message.
   */
  async fetchServers(episodeId: string): Promise<IPaheServersResponse<HIServerInfo | null>> {
    if (!episodeId) {
      throw new Error('Missing required parameter: episodeId');
    }
    const url = episodeId.includes('pahe') ? episodeId.split('pahe-').at(1) : null;
    if (!url) {
      throw new Error(`Invalid episodeId format: expected "pahe-" part in "${episodeId}"`);
    }

    const animeId = url.split('/').at(0);
    if (!animeId) {
      throw new Error(`Invalid episodeId`);
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/play/${url}`, { headers: this.headers(animeId) });
      const { servers, download } = this.parseServers(cheerio.load(response.data));

      return { data: servers, download };
    } catch (error) {
      return { data: null, download: null, error: error instanceof Error ? error.message : 'Unknown Error' };
    }
  }

  /**
   * Fetches streaming sources for a given anime episode from a specified server and category.
   * @param {string} episodeId - The unique identifier for the episode (required).
   * @param {HISubOrDub} category  - The audio category (Subtitled or Dubbed) (optional, defaults to SubOrDub.SUB).
   * @returns  A promise that resolves to an object containing streaming sources, headers,  or an error message.
   */
  async fetchSources(episodeId: string, category: HISubOrDub = 'sub'): Promise<HISourceResponse<IVideoSource | null>> {
    try {
      const servers = await this.fetchServers(episodeId);
      if ('error' in servers) {
        throw new Error(servers.error);
      }

      const serverIds = this.findServerIds(servers.data as HIServerInfo, servers.download as HIServerInfo, category);

      const promises = serverIds.map(s => {
        const url = new URL(s.serverId, this.baseUrl);
        return new Kwik().extract(url, s.serverName, this.baseUrl);
      });

      const results = await Promise.allSettled(promises);

      const fulfilled = results
        .filter((r): r is PromiseFulfilledResult<IVideoSource> => r.status === 'fulfilled')
        .map(r => r.value);

      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').map(r => r.reason);

      if (rejected.length > 0) {
        throw new Error(`Some server extractions failed: ${rejected.map(e => String(e)).join('; ')}`);
      }

      const highestDownloadId = serverIds.find(s => s.downloadId)?.downloadId || null;

      const merged: IVideoSource = {
        sources: fulfilled.flatMap(item => item.sources || []),
        subtitles: fulfilled.flatMap(item => item.subtitles || []),
        download: highestDownloadId || null,
      };

      const firstServerOrigin = serverIds.length > 0 ? `${new URL(serverIds[0].serverId).origin}/` : null;

      return {
        headers: { Referer: firstServerOrigin },
        data: merged,
      };
    } catch (error) {
      return {
        data: null,
        headers: { Referer: null },
        error: error instanceof Error ? error.message : 'Fatal Error',
      };
    }
  }
}
