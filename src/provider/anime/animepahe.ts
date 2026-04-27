import { BaseClass, type ClientConfig } from '../../models/base.js';

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
import type { IBase, IResponse, IServerInfo, ISourceBaseResponse, ISubOrDub, IVideoSource } from '../../types/base.js';

/**
 * A class for interacting with the Animepahe platform  to search for anime, fetch detailed information,
 * retrieve episode lists, get available streaming servers, and sources.
 */
export class Animepahe extends BaseClass {
  private readonly baseUrl: string;
  private readonly kwik: Kwik;
  constructor(baseUrl: string = 'https://animepahe.pw', options: ClientConfig = {}) {
    super(options);
    this.baseUrl = baseUrl;
    this.kwik = new Kwik(options);
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
  private parseAnimeInfo($: cheerio.CheerioAPI): IPaheInfo {
    const externalLinks: { name: string | null; url: string | null }[] = [];
    let extractedId: string | null = null;

    $('script').each((_, el) => {
      const scriptContent = $(el).html();
      if (scriptContent && scriptContent.includes('let id')) {
        const match = scriptContent.match(/let\s+id\s*=\s*"([^"]+)"/);
        if (match) {
          extractedId = match[1];
        }
      }
    });

    $('.external-links a').each((index, element) => {
      const name = $(element).text().trim() || null;
      const url = $(element).attr('href') || null;

      externalLinks.push({ name, url });
    });
    const animeinfo: IPaheInfo = {
      anilistId: Number($('head').find('meta[name="anilist"]').attr('content')) || null,
      malId: Number($('head').find('meta[name="mal"]').attr('content')) || null,
      id: $('head').find('meta[name="id"]').attr('content') || null,
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

    const extractQuality = (serverName: string): number => {
      const qualityMatch = serverName.match(/(\d+)p/);
      return qualityMatch ? parseInt(qualityMatch[1], 10) : 0;
    };

    const getHighestQuality = (serverArray: IServerInfo['sub']): IServerInfo['sub'] => {
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
   * @param {IServerInfo} download - The parsed download server information.
   * @param {ISubOrDub} category - The audio category to filter servers for ('sub', 'dub', or 'raw').
   * @returns {Array<{serverId: string; serverName: string; downloadId: string | null}>} An array of server objects with IDs and download information.
   * @throws {Error} If no servers are available for the specified category.
   */
  private findServerIds(
    servers: IServerInfo,
    download: IServerInfo,
    category: ISubOrDub,
  ): { serverId: string; serverName: string; referer: string }[] {
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

    const refererUrl = download[category]?.[0]?.serverId || '';

    return servers[category].map(s => {
      return {
        serverId: s.serverId! as string,
        serverName: s.serverName as string,
        referer: refererUrl as string,
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
        id: item.id,
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
  async fetchAnimeInfo(animeId: string | number): Promise<IPaheAnimeInfoResponse<IPaheInfo | null>> {
    if (!animeId) throw new Error('animeId cannot be empty');

    try {
      const response = await this.client.get(`${this.baseUrl}/a/${animeId}`, {
        headers: this.headers(false),
      });

      if (!response.data) {
        return { error: `Failed to build info url:${response.statusText}`, data: null, providerEpisodes: [] };
      }
      const html = response.data;

      const metaMatch = html.match(/url=['"]?([^'">]+)['"]?/i);
      const redirectUrl = metaMatch?.[1];

      const animesession = redirectUrl.split('/').at(-1);

      const [infoResponse, releaseRes] = await Promise.all([
        this.client.get(redirectUrl, {
          headers: this.headers(false),
        }),

        this.client.get(`${this.baseUrl}/api?m=release&id=${animesession}&sort=episode_asc&page=1`, {
          headers: this.headers(animesession),
        }),
      ]);

      if (!infoResponse.data) {
        return { error: infoResponse.statusText, data: null, providerEpisodes: [] };
      }

      const lastPage = releaseRes.data?.last_page ?? 1;
      let episodesList = releaseRes.data?.data ?? [];

      // 1. Fetch remaining pages if they exist
      if (lastPage > 1) {
        const pageRequests = [];
        for (let page = 2; page <= lastPage; page++) {
          pageRequests.push(
            this.client.get(`${this.baseUrl}/api?m=release&id=${animesession}&sort=episode_asc&page=${animesession}`, {
              headers: this.headers(animesession),
            }),
          );
        }
        const responses = await Promise.all(pageRequests);
        responses.forEach(res => {
          if (res.data?.data) episodesList.push(...res.data.data);
        });
      }

      if (episodesList.length === 0) {
        return {
          data: this.parseAnimeInfo(cheerio.load(infoResponse.data)),
          providerEpisodes: [],
          error: 'No episodes found',
        };
      }

      const providerEpisodes = episodesList
        .filter((item: any) => (item.episode ?? 0) > 0)
        .sort((a: any, b: any) => (a.episode ?? 0) - (b.episode ?? 0))
        .map((item: any, index: number) => ({
          episodeId: `pahe-${animesession}-$session$-${item.session}`,
          episodeNumber: index + 1,
          title: item.title || null,
          thumbnail: item.snapshot || null,
          hasSub:
            item.audio.toLowerCase().includes('chi') ||
            item.audio.toLowerCase().includes('kor') ||
            item.audio.toLowerCase().includes('jpn') ||
            true, // cant determine but most are subbed

          hasDub: item.audio.toLowerCase().includes('eng'),
        }));

      return {
        data: this.parseAnimeInfo(cheerio.load(infoResponse.data)),
        providerEpisodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: null,
        providerEpisodes: [],
      };
    }
  }

  /**
   * Fetches episode data for a specific anime.
   * @param {string} animeId - The unique identifier for the anime (required).
   * @returns A promise that resolves to an object containing an array of episode information or an error message.
   */
  async fetchEpisodes(animeId: number | string): Promise<IResponse<IPaheEpisodes[] | []>> {
    if (!animeId) {
      throw new Error('Missing required params: animeid');
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/a/${animeId}`, {
        headers: this.headers(false),
      });

      if (!response.data) {
        return { error: `Failed to build info url:${response.statusText}`, data: [] };
      }
      const html = response.data;

      const metaMatch = html.match(/url=['"]?([^'">]+)['"]?/i);
      const redirectUrl = metaMatch?.[1];

      const animesession = redirectUrl.split('/').at(-1);

      const releaseRes = await this.client.get(`${this.baseUrl}/api?m=release&id=${animesession}&sort=episode_asc&page=1`, {
        headers: this.headers(animesession),
      });

      const last_page = releaseRes.data?.last_page ?? 1;
      let episodes: any[] = releaseRes.data?.data ?? [];

      if (last_page > 1) {
        const pageRequests = [];
        for (let page = 2; page <= last_page; page++) {
          pageRequests.push(
            this.client.get(`${this.baseUrl}/api?m=release&id=${animesession}&sort=episode_asc&page=${page}`, {
              headers: this.headers(animesession),
            }),
          );
        }

        const responses = await Promise.all(pageRequests);
        for (const res of responses) {
          episodes.push(...(res.data.data ?? []));
        }
      }

      if (episodes.length === 0) {
        return {
          data: [],
          error: 'No episodes found',
        };
      }

      let formattedEpisodes = episodes.map((item: any) => ({
        episodeId: `pahe-${animesession}-$session$-${item.session}`,
        originalEpisodeNumber: item.episode ?? null,
        episodeNumber: item.episode ?? null,
        title: item.title || null,
        thumbnail: item.snapshot || null,
        hasSub:
          item.audio.toLowerCase().includes('chi') ||
          item.audio.toLowerCase().includes('kor') ||
          item.audio.toLowerCase().includes('jpn') ||
          true, // cant determine but most are subbed

        hasDub: item.audio.toLowerCase().includes('eng'),
      }));

      formattedEpisodes.sort((a, b) => {
        const numA = a.originalEpisodeNumber ?? Infinity;
        const numB = b.originalEpisodeNumber ?? Infinity;
        return numA - numB;
      });

      formattedEpisodes = formattedEpisodes.map((ep, index) => ({
        ...ep,
        episodeNumber: index + 1,
      }));

      formattedEpisodes = formattedEpisodes.filter(ep => ep.originalEpisodeNumber == null || ep.originalEpisodeNumber > 0);

      formattedEpisodes = formattedEpisodes.map((ep, index) => ({
        ...ep,
        episodeNumber: index + 1,
      }));

      return {
        data: formattedEpisodes as IPaheEpisodes[],
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
   * @param {ISubOrDub} version - The audio category (Subtitled or Dubbed) (optional, defaults to SubOrDub.SUB).
   * @returns A promise that resolves to an object containing streaming sources, headers,  or an error message.
   */
  async fetchSources(episodeId: string, version: ISubOrDub = 'sub'): Promise<ISourceBaseResponse<IVideoSource | null>> {
    try {
      const servers = await this.fetchServers(episodeId);
      if (servers.error) throw new Error(servers.error);

      const serverIds = this.findServerIds(servers.data as IServerInfo, servers.download as IServerInfo, version);

      const extractionPromises = serverIds.map(async s => {
        const url = new URL(s.serverId, this.baseUrl);

        return this.kwik.extract(url, s.serverName, this.baseUrl);
      });

      const results = await Promise.allSettled(extractionPromises);

      const fulfilled: IVideoSource[] = [];
      const rejectedReasons: string[] = [];

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          fulfilled.push(result.value);
        } else if (result.status === 'rejected') {
          rejectedReasons.push(result.reason?.message || String(result.reason));
        }
      }

      if (fulfilled.length === 0 && rejectedReasons.length > 0) {
        throw new Error(`All extractions failed: ${rejectedReasons.join('; ')}`);
      }

      const merged = {
        sources: fulfilled.flatMap(item => item.sources || []),
      };

      // 4. Resolve Referer logic
      let firstServerOrigin: string | null = null;
      if (serverIds.length > 0) {
        const refererUrl = serverIds[0].referer as string;
        firstServerOrigin = `${new URL(refererUrl).origin}/`;
      }

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
