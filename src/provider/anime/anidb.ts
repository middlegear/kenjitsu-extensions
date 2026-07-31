import * as cheerio from 'cheerio';

import type { ClientOptions } from '../../config/client.js';
import type { IBase, IBaseEpisodes, IResponse, ISourceBaseResponse, IVideoSource } from '../../types/base.js';
import type { IAnimeServerInfo, IAnimeServers, IBaseAnimeInfo, IBaseAnimePaginated, ISubOrDub } from '../../types/anime.js';
import { AnimeParser } from '../../models/animeparser.js';

export class AniDB extends AnimeParser {
  constructor(
    baseUrl: string = 'https://anidb.app',
    options: ClientOptions = {
      browser: 'okhttp4',
      rateLimit: {
        concurrency: 1,
        intervalMs: 1000,
        requestsPerInterval: 1,
      },
    },
  ) {
    super(baseUrl, options);
    this.baseUrl = baseUrl;
  }

  async fetchAtoZLists(page: number = 1): Promise<IBaseAnimePaginated<IBase[] | []>> {
    try {
      const finalUrl = page > 1 ? `az?page=${page}` : `az`;
      const response = await this.client.fetch(`${this.baseUrl}/${finalUrl}`, { method: 'GET' });
      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.text();

      return this.parseSearchResults(cheerio.load(result));
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }
  /**
   * Searches for anime by keyword.
   *
   * @param query Search keyword
   * @param page page number
   * @returns Search results with anime list
   */
  override async search(query: string, page: number = 1): Promise<IBaseAnimePaginated<IBase[] | []>> {
    if (!query) {
      return { hasNextPage: false, currentPage: 0, lastPage: 0, data: [], error: this.formatHttpError(400), status: 400 };
    }
    try {
      const finalUrl = page > 1 ? `browse?q=${query}&page=${page}` : `browse?q=${query}`;
      const response = await this.client.fetch(`${this.baseUrl}/${finalUrl}`, {
        method: 'GET',
      });
      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.text();

      return this.parseSearchResults(cheerio.load(result));
    } catch (error) {
      return {
        data: [],
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }

  override async fetchAnimeInfo(id: string): Promise<IResponse<IBaseAnimeInfo | null>> {
    if (!id) {
      return {
        data: null,
        error: this.formatHttpError(400),
        status: 400,
      };
    }
    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime/${id}`, {
        method: 'GET',
      });
      if (!response.ok) {
        return {
          data: null,
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.text();
      return this.parseAnimeInfo(cheerio.load(result));
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }

  async fetchEpisodes(id: string): Promise<IResponse<IBaseEpisodes[] | []>> {
    if (!id) {
      return {
        data: [],
        error: this.formatHttpError(400),
        status: 400,
      };
    }
    const numericId = id.split('-').at(-1);
    try {
      const response = await this.client.fetch(`${this.baseUrl}/api/frontend/anime/${numericId}/episodes`, {
        method: 'GET',
        // headers: {},
      });
      if (!response.ok) {
        return {
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const episodes: IBaseEpisodes[] = result.episodes.map((item: any) => ({
        episodeId: item.id,
        episodeNumber: item.number,
        isFiller: item.filler,
      }));

      const providerEpisodes = episodes
        .filter(item => (item.episodeNumber ?? 0) >= 0)
        .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
        .map((item, index) => ({
          episodeId: item.episodeId,
          episodeNumber: index + 1,
          title: item.title ?? null,
        }));

      return {
        data: providerEpisodes,
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }

  async fetchServers(episodeId: string): Promise<IResponse<IAnimeServerInfo | null>> {
    if (!episodeId) {
      return {
        data: null,
        error: this.formatHttpError(400),
        status: 400,
      };
    }
    try {
      const response = await this.client.fetch(`${this.baseUrl}/api/frontend/episode/${episodeId}/languages`, {
        method: 'GET',
      });
      if (!response.ok) {
        return {
          data: null,
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const servers: IAnimeServerInfo = {
        sub: [],
        dub: [],
        raw: [],
        episodeNumber: null,
      };

      if (result && Array.isArray(result.languages)) {
        result.languages.forEach((lang: any) => {
          const serverData: IAnimeServers = {
            serverId: lang.embed_url || null,
            serverName: lang.name,
            mediaId: null,
          };

          if (lang.code?.toLowerCase() === 'eng') {
            servers.dub.push(serverData);
          } else {
            servers.sub.push(serverData);
          }
        });
      }

      return {
        data: servers,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }

  override async fetchSources(
    episodeId: string,
    version: ISubOrDub = 'sub',
  ): Promise<ISourceBaseResponse<IVideoSource | null>> {
    if (!episodeId) {
      return {
        headers: { Referer: null },
        data: null,
        error: 'Missing required params: valid episodeId!',
        status: 400,
      };
    }
    try {
      const serverData = await this.fetchServers(episodeId);
      if (serverData.error || serverData.data === null) {
        return {
          headers: { Referer: null },
          data: null,
          error: serverData.error,
          status: serverData.status,
        };
      }
      const serverId = this.findServerIds(serverData.data, version);

      const response = await this.client.fetch(`${serverId.serverId}`, {
        method: 'GET',
      });
      if (!response.ok) {
        return {
          headers: { Referer: null },
          data: null,
          error: response.statusText,
          status: response.status,
        };
      }

      const embed = new URL(serverId.serverId);
      const result = await response.text();
      const sources = this.parseSources(cheerio.load(result));
      return {
        headers: { Referer: `${embed.origin}/` },
        data: sources,
      };
    } catch (error) {
      return {
        headers: { Referer: null },
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
        status: 500,
      };
    }
  }
  /**
   * Parses search  results from a Cheerio instance.
   * Extracts anime  from the provided HTML.
   * @param $ CheerioAPI instance
   * @returns An array containing an array of search results
   */
  private parseSearchResults($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = ' div.anime-grid > a';
    const result: IBase[] = [];
    $(selector).each((_, element) => {
      result.push({
        id: $(element).attr('href')?.split('/').at(-1) || null,
        name: $(element).attr('title') || null,
        posterImage: $(element).find('div > img').attr('src') || null,
        romaji: null,
        type: $(element).find('span.badge.badge-orange').text().trim() || null,
      });
    });

    const pageSpans = $('.text-muted .font-semibold');
    const currentPage = parseInt($(pageSpans.get(0)).text().trim(), 10);
    const lastPage = parseInt($(pageSpans.get(1)).text().trim(), 10);
    const hasNextPage = currentPage < lastPage;
    if (Array.isArray(result) && result.length === 0) {
      return { data: [], error: 'No results found', status: 404, hasNextPage: false, currentPage: 0, lastPage: 0 };
    }
    return { hasNextPage: hasNextPage, currentPage: currentPage, lastPage: lastPage, data: result };
  }

  /**
   * Parses detailed anime information from the watch/info page.
   * @param $ Cheerio instance
   * @returns An object  containing anime info results
   */
  private parseAnimeInfo($: cheerio.CheerioAPI) {
    const externalLinks = {
      mal: $('a[href*="myanimelist.net"]').attr('href') || null,
      anilist: $('a[href*="anilist.co"]').attr('href') || null,
      anidb: $('a[href*="anidb.net"]').attr('href') || null,
      kitsu: $('a[href*="kitsu.app"]').attr('href') || null,
    };

    const info: IBaseAnimeInfo = {
      id: $('link[rel="canonical"]').attr('href')?.split('/').at(-1) || null,
      name: $('h1').first().text().trim() || null,
      romaji: $('p.text-sm.text-muted').first().text().trim() || null,
      posterImage: $('.relative.w-full.overflow-hidden img').first().attr('src') || null,
      synopsis:
        $('h2')
          .filter((_, el) => $(el).text().trim() === 'Synopsis')
          .parent()
          .find('p')
          .text()
          .replace(/\s+/g, ' ')
          .trim() || null,

      genre: $('.filter-chip')
        .map((_, el) => $(el).text().trim())
        .get(),
      type: $('dt:contains("Type")').next('dd').text().trim() || null,
      status: $('dt:contains("Status")').next('dd').text().trim() || null,
      premiered: $('dt:contains("Season")').next('dd').text().trim() || null,
      releaseDate: $('dt:contains("Aired")').next('dd').text().trim() || null,
      duration: $('dt:contains("Duration")').next('dd').text().trim() || null,
      score:
        parseFloat(
          $('dt:contains("Score")')
            .next('dd')
            .text()
            .replace(/[^\d.]/g, ''),
        ) || null,

      studios: [$('dt:contains("Studios")').next('dd').text().trim()].filter(Boolean),
      producers: [],
      totalEpisodes: null,
      malId: externalLinks.mal?.match(/anime\/(\d+)/)?.[1] || null,
      anilistId: externalLinks.anilist?.match(/anime\/(\d+)/)?.[1] || null,
      anidbId: externalLinks.anidb?.match(/anime\/(\d+)/)?.[1] || null,
      kitsuId: externalLinks.kitsu?.match(/anime\/(\d+)/)?.[1] || null,
      externalLinks,
      relations: this.parseRelations($),
    };

    return {
      data: info,
    };
  }

  private parseRelations($: cheerio.CheerioAPI) {
    const relations: IBase[] = [];

    $('[x-show*="activeRel"]').each((_, section) => {
      const relationType = $(section)
        .attr('x-show')
        ?.match(/activeRel === '([^']+)'/)?.[1];

      if (!relationType) return;

      $(section)
        .find('a.anime-card')
        .each((_, card) => {
          const href = $(card).attr('href') || '';

          relations.push({
            id: href.split('/').at(-1) || null,
            name: $(card).find('p').last().text().trim(),
            poster: $(card).find('img').attr('src') || null,
            type: $(card).find('.badge-orange').first().text().trim() || null,
            score:
              parseFloat(
                $(card)
                  .find('.badge-gray')
                  .text()
                  .replace(/[^\d.]/g, ''),
              ) || null,
            relationType,
          });
        });
    });

    return relations;
  }

  /**
   * Finds available server IDs for a specific audio category from the parsed server data.
   * @private
   * @param servers - The parsed streaming server information.
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

  private parseSources($: cheerio.CheerioAPI) {
    const extractedData: IVideoSource = {
      sources: [],
    };
    $('script').each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent && scriptContent.includes('sources:')) {
        const regex = /sources:\s*(\[\s*\{[\s\S]*?\}\s*\])/;
        const match = scriptContent.match(regex);
        if (match && match[1]) {
          const rawArrayString = match[1];
          const itemRegex = /file:\s*'([^']+)',\s*type:\s*'([^']+)'/g;
          let itemMatch;

          while ((itemMatch = itemRegex.exec(rawArrayString)) !== null) {
            extractedData.sources.push({
              url: itemMatch[1],
              isM3u8: itemMatch[2] === 'hls',
              type: itemMatch[2],
            });
          }
          return false;
        }
      }
    });

    return extractedData;
  }
}
