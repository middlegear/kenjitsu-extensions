import { BaseClass, type ClientConfig } from '../../models/base.js';

import * as cheerio from 'cheerio';
import KwiK from '../../source-extractors/kwik.js';
import type { IBase, IBaseEpisodes, IResponse, ISourceBaseResponse, IVideoSource } from '../../types/base.js';
import type {
  IAnimeInfoResponse,
  IAnimeServerInfo,
  IBaseAnime,
  IBaseAnimeEpisodes,
  IBaseAnimeInfo,
  IBaseAnimePaginated,
  IBaseAnimeServerResponse,
  ISubOrDub,
} from '../../types/anime.js';

/**
 * A class for interacting with the Animepahe platform  to search for anime, fetch detailed information,
 * retrieve episode lists, get available streaming servers, and sources.
 */

export class Animepahe extends BaseClass {
  private readonly baseUrl: string;
  private readonly KwiK: KwiK;

  constructor(
    baseUrl: string = 'https://animepahe.pw',
    options: ClientConfig = {
      followRedirects: false,
    },
  ) {
    super(options);

    this.baseUrl = baseUrl;
    this.KwiK = new KwiK(options);
  }

  /**
   * Searches for anime based on the provided query string.
   * @param {string} query - The search query string (required).
   * @returns  A promise that resolves to an object containing an array of anime titles, pagination details, or an error message.
   */
  async search(query: string): Promise<IBaseAnimePaginated<IBaseAnime[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        perPage: 0,
        lastPage: 0,
        totalResults: 0,
        currentPage: 0,
        data: [],
        error: this.formatHttpError(400),
        status: 400,
      };
    }

    try {
      const response = await this.client.fetch(`${this.baseUrl}/api?m=search&q=${query}`, {
        method: 'GET',
        headers: this.headers(false),
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          perPage: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const data: IBaseAnime[] = result.data.map((item: any) => ({
        id: item.id,
        name: item.title,
        type: item.type,
        releaseDate: item.year,
        season: item.season,
        posterImage: item.poster,
        totalEpisodes: item.episodes,
      }));
      return {
        hasNextPage: result.last_page > 1,
        currentPage: result.current_page,
        perPage: result.per_page,
        totalResults: result.total,
        lastPage: result.last_page,
        data: data,
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
        status: 500,
      };
    }
  }

  /**
   *  Fetches recently updated anime. Mostly those that are airing
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @returns
   */
  async fetchRecentEpisodes(page: number = 1): Promise<IBaseAnimePaginated<IBaseEpisodes[] | []>> {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/api?m=airing&page=${page}`, {
        headers: this.headers(false),
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          perPage: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const data: IBaseAnimeEpisodes[] = result.data.map((item: any) => ({
        episodeId: `pahe-${item.anime_session}-$session$-${item.session}`,
        title: item.anime_title,
        thumbnail: item.snapshot,
        episodeNumber: item.episode,
      }));
      return {
        hasNextPage: result.last_page > 1,
        currentPage: result.current_page,
        perPage: result.per_page,
        totalResults: result.total,
        lastPage: result.last_page,
        data: data,
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
        status: 500,
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime including episodes.
   * @param {string} animeId - The unique identifier for the anime (required).
   */
  async fetchAnimeInfo(animeId: string | number): Promise<IAnimeInfoResponse<IBaseAnimeInfo | null>> {
    if (!animeId) {
      return {
        data: null,
        error: this.formatHttpError(400),
        status: 400,
        providerEpisodes: [],
      };
    }

    try {
      // 1. Initial Request to get the session redirect/url
      const response = await this.client.fetch(`${this.baseUrl}/a/${animeId}`, {
        method: 'GET',
        redirect: 'manual',
        headers: this.headers(false),
      });
      const redirectUrl = response.headers.get('location');

      const result = redirectUrl as string;

      const animesession = result.split('/').filter(Boolean).at(-1) as string;

      const [infoResponse, releaseRes] = await Promise.all([
        this.client.fetch(result, { method: 'GET', headers: this.headers(false) }),
        this.client.fetch(`${this.baseUrl}/api?m=release&id=${animesession}&sort=episode_asc&page=1`, {
          method: 'GET',
          headers: this.headers(animesession),
        }),
      ]);

      if (!infoResponse.ok || !releaseRes.ok) {
        return {
          data: null,
          providerEpisodes: [],
          error: infoResponse.statusText || releaseRes.statusText,
          status: infoResponse.status || releaseRes.status,
        };
      }

      const infoHtml = await infoResponse.text();
      const releaseResult = await releaseRes.json();

      const lastPage = releaseResult?.last_page ?? 1;
      let episodesList = [...(releaseResult?.data ?? [])];

      if (lastPage > 1) {
        const pageRequests = [];
        for (let page = 2; page <= lastPage; page++) {
          pageRequests.push(
            this.client.fetch(`${this.baseUrl}/api?m=release&id=${animesession}&sort=episode_asc&page=${page}`, {
              method: 'GET',
              headers: this.headers(animesession),
            }),
          );
        }

        const pagedResponses = await Promise.all(pageRequests);

        for (const res of pagedResponses) {
          if (res.ok) {
            const json = await res.json();
            if (json?.data) episodesList.push(...json.data);
          }
        }
      }

      const animeData = this.parseAnimeInfo(cheerio.load(infoHtml), animesession);

      if (Array.isArray(episodesList) && episodesList.length === 0) {
        return {
          data: null,
          providerEpisodes: [],
          error: 'No episodes found',
          status: 404,
        };
      }

      const providerEpisodes = episodesList
        .filter((item: any) => (item.episode ?? 0) >= 0)
        .sort((a: any, b: any) => (a.episode ?? 0) - (b.episode ?? 0))
        .map((item: any, index: number) => {
          const audio = (item.audio || '').toLowerCase();

          return {
            episodeId: `pahe-${animesession}-$session$-${item.session}-episode-${animeId}-${index + 1}`,
            episodeNumber: index + 1,
            title: item.title || null,
            thumbnail: item.snapshot || null,
            hasSub: audio.includes('chi') || audio.includes('kor') || audio.includes('jpn') || true,
            hasDub: audio.includes('eng'),
          };
        });

      return {
        data: animeData,
        providerEpisodes,
      };
    } catch (error: any) {
      return {
        data: null,
        providerEpisodes: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
        status: 500,
      };
    }
  }
  /**
   * Fetches episode data for a specific anime.
   * @param {string} animeId - The unique identifier for the anime (required).
   * @returns A promise that resolves to an object containing an array of episode information or an error message.
   */
  async fetchEpisodes(animeId: string | number): Promise<IResponse<IBaseAnimeEpisodes[] | []>> {
    if (!animeId) {
      return {
        data: [],
        error: this.formatHttpError(400),
        status: 400,
      };
    }

    try {
      const response = await this.client.fetch(`${this.baseUrl}/a/${animeId}`, {
        redirect: 'manual',
        headers: this.headers(false),
      });

      const redirectUrl = response.headers.get('location');

      const result = redirectUrl as string;

      const animesession = result.split('/').filter(Boolean).at(-1) as string;
      const releaseRes = await this.client.fetch(
        `${this.baseUrl}/api?m=release&id=${animesession}&sort=episode_asc&page=1`,
        {
          method: 'GET',
          headers: this.headers(animesession),
        },
      );
      const releaseResult = await releaseRes.json();

      const lastPage = releaseResult?.last_page ?? 1;
      let episodesList = [...(releaseResult?.data ?? [])];

      if (lastPage > 1) {
        const pageRequests = [];
        for (let page = 2; page <= lastPage; page++) {
          pageRequests.push(
            this.client.fetch(`${this.baseUrl}/api?m=release&id=${animesession}&sort=episode_asc&page=${page}`, {
              method: 'GET',
              headers: this.headers(animesession),
            }),
          );
        }

        const pagedResponses = await Promise.all(pageRequests);

        for (const res of pagedResponses) {
          if (res.ok) {
            const json = await res.json();
            if (json?.data) episodesList.push(...json.data);
          }
        }
      }

      if (Array.isArray(episodesList) && episodesList.length === 0) {
        return {
          data: [],
          error: 'No episodes found',
          status: 404,
        };
      }

      const providerEpisodes = episodesList
        .filter((item: any) => (item.episode ?? 0) >= 0)
        .sort((a: any, b: any) => (a.episode ?? 0) - (b.episode ?? 0))
        .map((item: any, index: number) => {
          const audio = (item.audio || '').toLowerCase();

          return {
            episodeId: `pahe-${animesession}-$session$-${item.session}-episode-${animeId}-${index + 1}`,
            episodeNumber: index + 1,
            title: item.title || null,
            thumbnail: item.snapshot || null,
            hasSub: audio.includes('chi') || audio.includes('kor') || audio.includes('jpn') || true,
            hasDub: audio.includes('eng'),
          };
        });

      return {
        data: providerEpisodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  /**
   * Fetches available streaming servers for a specific anime episode.
   * @param {string} episodeId - The unique identifier for the episode  (required).
   * @returns  A promise that resolves to an object containing available streaming server details (sub, dub, raw) or an error message.
   */
  async fetchServers(episodeId: string): Promise<IBaseAnimeServerResponse<IAnimeServerInfo | null>> {
    if (!episodeId) {
      return {
        data: null,
        download: null,
        error: this.formatHttpError(400),
        status: 400,
      };
    }
    const prefix = 'pahe-';

    if (!episodeId.startsWith(prefix)) {
      return {
        error: `Invalid episodeId format: expected to start with "${prefix}", got "${episodeId}"`,
        data: null,
        download: null,
        status: 400,
      };
    }

    const id = episodeId.slice(prefix.length);

    if (!id) {
      return {
        error: `Invalid episodeId: missing identifier after "${prefix}" in "${episodeId}"`,
        data: null,
        download: null,
        status: 400,
      };
    }

    const animeId = id.split('-$session$-').at(0);

    const url = id.replace('-$session$-', '/').split('-episode-').at(-2);
    if (!animeId) {
      return {
        error: `Invalid episodeId`,
        data: null,
        download: null,
        status: 400,
      };
    }

    try {
      const response = await this.client.fetch(`${this.baseUrl}/play/${url}`, {
        method: 'GET',
        headers: this.headers(animeId),
      });
      if (!response.ok) {
        return { error: response.statusText, data: null, download: null, status: response.status };
      }
      const result = await response.text();
      const { servers, download } = this.parseServers(cheerio.load(result));

      return { data: servers, download };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Error', data: null, download: null, status: 500 };
    }
  }

  /**
   * Fetches streaming sources for a given anime episode from a specified server and category.
   * @param {string} episodeId - The unique identifier for the episode (required).
   * @param {boolean} preferHls - The type of links to return defaults to true for hls.(false for mp4)
   * @param {ISubOrDub} version - The audio category (Subtitled or Dubbed) (optional, defaults to SubOrDub.SUB).
   * @returns A promise that resolves to an object containing streaming sources, headers,  or an error message.
   */
  async fetchSources(episodeId: string, version: ISubOrDub = 'sub'): Promise<ISourceBaseResponse<IVideoSource | null>> {
    try {
      const servers = await this.fetchServers(episodeId);
      if (servers.error) {
        return {
          headers: { Referer: null },
          data: null,
          error: servers.error,
          status: servers.status,
        };
      }

      const serverSource = servers.data;
      const server = this.findServerIds(serverSource as IAnimeServerInfo, version);
      const url = new URL(server.serverId, this.baseUrl);

      return await this.KwiK.extract(url, server.serverName, this.baseUrl);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Fatal Error',
        data: null,
        headers: { Referer: null },
      };
    }
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
   * @returns  An object containing parsed anime information.
   */
  private parseAnimeInfo($: cheerio.CheerioAPI, animeId: string): IBaseAnimeInfo {
    const externalLinks: { name: string | null; url: string | null }[] = [];
    $('.external-links a').each((index, element) => {
      const name = $(element).text().trim() || null;
      const url = $(element).attr('href') || null;

      externalLinks.push({ name, url });
    });
    const animeinfo: IBaseAnimeInfo = {
      anilistId: Number($('head').find('meta[name="anilist"]').attr('content')) || null,
      malId: Number($('head').find('meta[name="mal"]').attr('content')) || null,
      id: Number($('head').find('meta[name="id"]').attr('content')) || null,
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

      totalEpisodes:
        Number($('div.col-sm-4.anime-info').find('p:contains("Episodes:")').text().trim().split(':').at(1)) || null,
      duration: $('div.col-sm-4.anime-info').find('p:contains("Duration:")').text().trim().split(':').at(1) || null,
      genres:
        $('div.anime-genre ul li')
          .map((i, el) => $(el).find('a').attr('title'))
          .get() || null,
      externalLinks: externalLinks,
      score: null, //doesnt exist ?
    };

    return animeinfo;
  }

  /**
   * Parses HTML content to extract streaming server information for an episode.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @returns  An object containing streaming servers and download servers.
   */
  private parseServers($: cheerio.CheerioAPI) {
    const subSelector: cheerio.SelectorType = 'div#resolutionMenu button[data-audio="jpn"]';
    const chiSelector: cheerio.SelectorType = 'div#resolutionMenu button[data-audio="chi"]';
    const dubSelector: cheerio.SelectorType = 'div#resolutionMenu button[data-audio="eng"]';
    const servers: IAnimeServerInfo = {
      sub: [],
      dub: [],
      raw: [],
      episodeNumber: 0,
    };
    const download: IAnimeServerInfo = { sub: [], dub: [], raw: [], episodeNumber: 0 };

    const h1Text = $('div.theatre-info h1').text().trim();
    const match = h1Text.match(/-\s*(\d+)/);
    const episode = match ? parseInt(match[1], 10) : 0;

    servers.episodeNumber = episode;
    download.episodeNumber = episode;

    const extractQuality = (serverName: string): number => {
      const qualityMatch = serverName.match(/(\d+)p/);
      return qualityMatch ? parseInt(qualityMatch[1], 10) : 0;
    };

    const getHighestQuality = (serverArray: IAnimeServerInfo['sub']): IAnimeServerInfo['sub'] => {
      if (serverArray.length === 0) return [];

      const highest = serverArray.reduce((max, current) => {
        const currentQuality = extractQuality(current.serverName || '');
        const maxQuality = extractQuality(max.serverName || '');
        return currentQuality > maxQuality ? current : max;
      });

      return [highest];
    };

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

      servers.sub = getHighestQuality(servers.sub);
    }

    $(dubSelector).each((_, element) => {
      servers.dub.push({
        serverId: $(element).attr('data-src') || null,
        serverName: $(element).text().trim() || null,
        mediaId: $(element).attr('data-src')?.split('/').at(-1) || null,
      });
    });

    servers.dub = getHighestQuality(servers.dub);

    const downloadItems = $('#pickDownload a.dropdown-item');

    downloadItems.each((_, element) => {
      const $element = $(element);
      const hasEngBadge = $element.find('span.badge:contains("eng")').length > 0;

      const serverInfo = {
        serverId: $element.attr('href') || null,
        serverName: $element.text().trim() || null,
        mediaId: $element.attr('href')?.split('/').at(-1) || null,
      };

      if (hasEngBadge) {
        download.dub.push(serverInfo);
      } else {
        download.sub.push(serverInfo);
      }
    });

    download.sub = getHighestQuality(download.sub);
    download.dub = getHighestQuality(download.dub);

    return { servers, download };
  }

  /**
   * Finds available server IDs for a specific audio category from the parsed server data.
   * @private
   * @param {IServerInfo} servers - The parsed streaming server information.
   * @param {ISubOrDub} category - The audio category to filter servers for ('sub', 'dub', or 'raw').
   * @returns {Array<{serverId: string; serverName: string; downloadId: string | null}>} An array of server objects with IDs and download information.
   */
  private findServerIds(servers: IAnimeServerInfo, category: ISubOrDub): { serverId: string; serverName: string } {
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

    const server = servers[category][0];

    return {
      serverId: server.serverId! as string,
      serverName: server.serverName!,
    };
  }
}
