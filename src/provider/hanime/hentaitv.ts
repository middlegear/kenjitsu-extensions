// https://hentai.tv/?s=adam

import { BaseClass } from '../../models/base.js';
import * as cheerio from 'cheerio';
import type { IPaheEpisodes } from '../../types/anime/animepahe.js';
import type { IResponse, ISourceBaseResponse, IVideoSource } from '../../types/base.js';
export class HentaiTv extends BaseClass {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://hentai.tv') {
    super();
    this.baseUrl = baseUrl;
  }

  /**
   * Parses the search results page into a list of items.
   *
   * @private
   * @param {cheerio.CheerioAPI} $ - Loaded cheerio instance
   * @returns  Episodes search results (reversed order)
   */
  private parseSearch($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = 'section [data-results] > div.crsl-slde';

    const data: IPaheEpisodes[] = [];

    $(selector).each((_, element) => {
      data.push({
        episodeId: $(element).find('div a ').attr('href')?.split('/').at(-2) || null,
        title: $(element).find('div a ').text().trim() || null,
        thumbnail: $(element).find('div img').attr('src') || null,
        episodeNumber: Number($(element).find('div a ').text().trim().match(/\d+/g)) || null,
      });
    });
    if (Array.isArray(data) && data.length === 0) {
      return {
        error: 'No result found',
        data: [],
      };
    }
    return { data: data.reverse() };
  }
  /**
   * Parses video sources and subtitles from player page scripts.
   *
   * @private
   * @param {cheerio.CheerioAPI} $ - Loaded cheerio instance of the final player page
   * @returns  Object containing sources and subtitles arrays
   */
  private parseSources($: cheerio.CheerioAPI) {
    const scripts = $('script')
      .map((_, el) => $(el).html())
      .get()
      .join('\n');

    const extractedData: IVideoSource = {
      sources: [],
      subtitles: [],
    };

    // Extract sources - simple regex to get file and type
    const fileMatch = scripts.match(/file:\s*"([^"]+)"/);
    const typeMatch = scripts.match(/type:\s*"([^"]+)"/);

    if (fileMatch && typeMatch) {
      extractedData.sources.push({
        url: fileMatch[1],
        type: typeMatch[1],
        isM3u8: typeMatch[1] === 'hls' || fileMatch[1].endsWith('.m3u8'),
      });
    }

    // Extract all subtitle tracks
    const subtitleMatches = scripts.matchAll(
      /{[^}]*?"kind"[^}]*?"file"\s*:\s*"([^"]*)"\s*,[^}]*?"label"\s*:\s*"([^"]+)"[^}]*?"default"\s*:\s*(true|false)[^}]*?}/g,
    );

    for (const match of subtitleMatches) {
      extractedData.subtitles?.push({
        url: match[1],
        lang: match[2],
        default: match[3] === 'true',
      });
    }
    extractedData.subtitles = extractedData.subtitles?.filter(sub => sub.url && sub.url.trim() !== '');

    return extractedData;
  }

  /**
   * Searches for anime based on the provided query string.
   * @param {string} query - The search query string (required).
   * @returns  A promise that resolves to an object containing an array of anime titles and episodes, or an error message.
   */
  async search(query: string): Promise<IResponse<IPaheEpisodes[] | []>> {
    if (!query) throw new Error('Missing a search query string');
    try {
      const response = await this.client.get(`${this.baseUrl}/?s=${query.replaceAll(' ', '+')}`, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: `${this.baseUrl}/`,
        },
      });
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return this.parseSearch(cheerio.load(response.data));
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
  /**
   * Fetches streaming sources for a given anime episode from a specified server and category.
   * @param {string} episodeId - The unique identifier for the episode (required).

   * @returns  A promise that resolves to an object containing streaming sources, headers,  or an error message.
   */

  async fetchSources(episodeId: string): Promise<ISourceBaseResponse<IVideoSource | null>> {
    if (!episodeId) {
      throw new Error('Missing required parameter: episodeId');
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/hentai/${episodeId}/`, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
          Cookie: 'inter=1',
        },
      });
      if (!response.data) {
        throw new Error(response.statusText);
      }
      const match = response.data.match(/<iframe[^>]+src="([^"]+)"/i);

      const src = match?.[1] ?? null;

      const phpPlayer = await this.client.get(src, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!phpPlayer.data) {
        throw new Error(phpPlayer.statusText);
      }

      const playerUrl = phpPlayer.data.match(/data-id\s*=\s*"([^"]+)"/);
      const dataId = playerUrl?.[1] ?? null;
      const embedUrl = new URL(src);

      const finalVidUrl = await this.client.get(`https://nhplayer.com${dataId}`, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: src,
        },
      });

      if (!finalVidUrl.data) {
        throw new Error(finalVidUrl.statusText);
      }

      const extractedData = this.parseSources(cheerio.load(finalVidUrl.data));
      return {
        headers: { Referer: `${embedUrl.origin}/` },
        data: extractedData,
      };
    } catch (error) {
      return {
        headers: { Referer: null },
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
}
