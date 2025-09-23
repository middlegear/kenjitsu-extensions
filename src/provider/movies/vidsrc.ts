import { BaseClass } from '../../models/base-anime.js';
import * as cheerio from 'cheerio';
import type { IMovieServers, IResponse, IVideoSource } from '../../models/types.js';

export class VidSrc extends BaseClass {
  private readonly baseUrl: string = 'https://vidsrc.io';
  private readonly cloudnestraUrl: string = 'https://cloudnestra.com';
  private readonly subtitlesUrl: string = 'https://sub.wyzie.ru';

  constructor() {
    super();
  }

  private parseServerHash($: cheerio.CheerioAPI) {
    const servers: IMovieServers[] = [];

    $('div.serversList > div.server').each((i, element) => {
      const name = $(element)
        .text()
        .toLowerCase()
        .replace(/\s*pro/i, '')
        .trim();
      const hash = $(element).attr('data-hash');

      servers.push({
        serverName: name,
        serverId: hash as string,
      });
    });

    return servers;
  }

  private parseIframe($: cheerio.CheerioAPI) {
    const scriptContent = $('script')
      .filter(function () {
        const html = $(this).html() || '';

        return html.includes('function loadIframe');
      })
      .html();

    if (scriptContent) {
      const regex = /src:\s*'(.*?)'/;
      const match = scriptContent.match(regex);

      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  private findServerId(servers: IMovieServers[], server: 'cloudstream') {
    const availableServers = servers.map(s => s.serverName || 'unknown');
    const serverIndex = servers.findIndex(s => (s.serverName || '').toLowerCase() === server.toLowerCase());
    if (serverIndex === -1) {
      throw new Error(
        `Server '${server}' not found '. ` + `Try one of the available servers: ${availableServers.join(', ')}.`,
      );
    }

    return servers[serverIndex].serverId as string;
  }
  private parseM3u8($: cheerio.CheerioAPI) {
    const playerScript = $('script').filter((_, el) => {
      const content = $(el).html();
      return content?.includes('new Playerjs') ?? false;
    });

    const scriptContent = playerScript.length > 0 ? playerScript.html() : null;

    if (!scriptContent) {
      return {
        file: null,
        cuid: null,
      };
    }

    const fileRegex = /file:\s*'(.*?)'/;
    const cuidRegex = /cuid:\s*"(.*?)"/;

    const fileMatch = scriptContent.match(fileRegex);
    // const cuidMatch = scriptContent.match(cuidRegex);

    return {
      file: fileMatch?.[1] ?? null,
      // cuid: cuidMatch?.[1] ?? null,
    };
  }

  /**
   *  Fetches srcp data
   * @param serverId the server hash
   * @returns
   */
  private async fetchRCP(serverId: string) {
    try {
      const rcpresponse = await this.client.get(`${this.cloudnestraUrl}/rcp/${serverId}`, {
        headers: {
          Referer: `${this.baseUrl}/`,
        },
      });

      if (!rcpresponse.data) {
        return { error: rcpresponse.statusText };
      }

      const iframe = this.parseIframe(cheerio.load(rcpresponse.data));

      const srcp = await this.client.get(`${this.cloudnestraUrl}/${iframe}`, {
        headers: {
          Referer: `${this.cloudnestraUrl}/rcp/${serverId}`,
        },
      });

      if (!srcp.data) {
        return { error: srcp.statusText };
      }

      return srcp.data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Err' };
    }
  }

  private async fetchMediaHash(tmdbId: number, season?: number, episode?: number, server: 'cloudstream' = 'cloudstream') {
    try {
      let url: string;
      season && episode
        ? (url = `${this.baseUrl}/embed/${tmdbId}/${season}-${episode}/`)
        : (url = `${this.baseUrl}/embed/${tmdbId}/`);

      const response = await this.client.get(url);

      const servers = this.parseServerHash(cheerio.load(response.data));

      const serverId = this.findServerId(servers, server);

      const rcp = await this.fetchRCP(serverId);

      return rcp;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Err' };
    }
  }

  async fetchMovie(tmdbId: number): Promise<IResponse<IVideoSource | null>> {
    if (!tmdbId) {
      return { data: null, error: 'Missing required params: tmdbid' };
    }

    try {
      const response = await this.fetchMediaHash(tmdbId);

      const result = this.parseM3u8(cheerio.load(response));

      const extractedData: IVideoSource = {
        sources: [],
        subtitles: [],
      };
      const subtitlesRes = await this.client.get(`${this.subtitlesUrl}/search?id=${tmdbId}`);
      extractedData.subtitles = subtitlesRes.data.map((item: any) => ({
        url: item.url,
        lang: item.display,
        default: item.language === 'en',
      }));

      if (result.file) {
        extractedData.sources.push({
          url: result.file,
          isM3U8: result.file.endsWith('.m3u8'),
          type: result.file.endsWith('.m3u8') ? 'hls' : 'unknown',
        });
      }

      return { data: extractedData };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Err', data: null };
    }
  }

  async fetchTvSources(tmdbId: number, season: number, episodeNumber: number): Promise<IResponse<IVideoSource | null>> {
    //
    const required = {
      tmdbId,
      season,
      episodeNumber,
    };
    for (const [key, value] of Object.entries(required)) {
      if (value == null || value === 0) {
        return { data: null, error: `Missing required param: ${key}` };
      }
    }
    try {
      const response = await this.fetchMediaHash(tmdbId, season, episodeNumber);

      const result = this.parseM3u8(cheerio.load(response));

      const extractedData: IVideoSource = {
        sources: [],
        subtitles: [],
      };
      const subtitlesRes = await this.client.get(
        `${this.subtitlesUrl}/search?id=${tmdbId}&season=${season}&episode=${episodeNumber}`,
      );
      extractedData.subtitles = subtitlesRes.data.map((item: any) => ({
        url: item.url,
        lang: item.display,
        default: item.language === 'en',
      }));

      if (result.file) {
        extractedData.sources.push({
          url: result.file,
          isM3U8: result.file.endsWith('.m3u8'),
          type: result.file.endsWith('.m3u8') ? 'hls' : 'unknown',
        });
      }

      return { data: extractedData };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown Err', data: null };
    }
  }
}
