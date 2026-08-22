import * as cheerio from 'cheerio';
import { type ClientConfig } from '../../models/base.js';

import type {
  IBase,
  IBaseEpisodes,
  IBaseMediaInfo,
  IResponse,
  ISourceBaseResponse,
  IVideoSource,
} from '../../types/base.js';
import type { IAnimeInfoResponse, IBaseAnimeResponse } from '../../types/anime.js';
import { AnimeParser } from '../../models/animeparser.js';

/**
 * Anizone class for interacting with the Anizone anime streaming platform.
 * Extends Animeparser to provide functionality for searching anime, fetching anime details,
 * retrieving video sources for episodes, and fetching recent updates.
 * @extends AnimeParser
 */
export class Anizone extends AnimeParser {
  constructor(baseUrl: string = 'https://anizone.to', options: ClientConfig = {}) {
    super(baseUrl, options);
    this.baseUrl = baseUrl;
  }

  private unescapeAlpineJson(raw: string): string {
    return raw
      .replace(/\\u0022/g, '"')
      .replace(/\\{3}\//g, '/')
      .replace(/\\\\u/g, '\\u')
      .replace(/\\'/g, "'");
  }

  /**
   * Searches for anime on the Anizone platform using a query string.
   * @param {string} query - The search query for finding anime.
   * @returns - A promise resolving to an object containing search results or an error message.
   */
  async search(query: string): Promise<IResponse<IBase[] | []>> {
    if (!query) {
      return {
        data: [],
        error: this.formatHttpError(400),
        status: 400,
      };
    }

    try {
      const url = new URL(`${this.baseUrl}/anime`);
      url.searchParams.append('search', this.formatQuery(query));

      const response = await this.client.fetch(url.toString(), {
        method: 'GET',
      });
      if (!response.ok) {
        return { error: response.statusText, status: response.status, data: [] };
      }
      const result = await response.text();

      return this.parseSearchResults(cheerio.load(result));
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown err', data: [], status: 500 };
    }
  }

  /**
   * Fetches recent updates from the Anizone homepage, including recently added anime and latest episodes.
   * @returns - A promise resolving to an object containing arrays of recently added anime, latest episodes, or an error message.
   */
  async fetchUpdates(): Promise<IBaseAnimeResponse<IBaseEpisodes[] | []>> {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/`, { method: 'GET' });

      if (!response.ok) {
        return { error: response.statusText, status: response.status, data: [], recentlyAdded: [] };
      }
      const result = await response.text();
      return this.parseUpdates(cheerio.load(result));
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err',
        data: [],
        recentlyAdded: [],
        status: 500,
      };
    }
  }

  /**
   * Fetches detailed information and episode list for a specific anime.
   * @param {string} animeId - The unique identifier for the anime.
   * @returns - A promise resolving to an object containing anime details and episodes or an error message.
   */
  async fetchAnimeInfo(animeId: string): Promise<IAnimeInfoResponse<IBaseMediaInfo | null>> {
    if (!animeId) {
      return {
        data: null,
        error: this.formatHttpError(400),
        status: 400,
        providerEpisodes: [],
      };
    }

    try {
      const id = animeId.split('-').at(-1)!;
      const response = await this.client.fetch(`${this.baseUrl}/anime/${id}`, { method: 'GET' });
      if (!response.ok) {
        return {
          data: null,
          providerEpisodes: [],
          error: response.statusText,
          status: response.status,
        };
      }

      const html = await response.text();
      const { data, providerEpisodes: page1Episodes, error, status } = this.parseAnimeinfo(cheerio.load(html));

      if (!data) {
        return {
          data: null,
          providerEpisodes: [],
          error: error || 'Anime info is null',
          status: status || 404,
        };
      }

      let lastPageEpisodes: IBaseEpisodes[] = [];
      const maxPages = this.extractMaxPages(html);


      if (maxPages > 1) {
        lastPageEpisodes = await this.fetchEpisodePage(id, maxPages, data.id as string);
      }

      const realEpisodes = new Map<number, IBaseEpisodes>();
      [...page1Episodes, ...lastPageEpisodes].forEach(ep => {
        if (ep.episodeNumber !== null) realEpisodes.set(ep.episodeNumber, ep);
      });

      const highestKnownEpisode = Math.max(0, ...Array.from(realEpisodes.keys()));

      const providerEpisodes: IBaseEpisodes[] = [];
      for (let i = 1; i <= highestKnownEpisode; i++) {
        providerEpisodes.push(
          realEpisodes.get(i) ?? {
            episodeId: `${data.id}-episode-${i}`,
            episodeNumber: i,
            thumbnail: null,
            teaser: null,
            title: null,
            airDate: null,
          },
        );
      }


      const now = new Date();
      const releasedEpisodes = providerEpisodes.filter(ep => {
        if (!ep.airDate) return true;
        const d = new Date(ep.airDate);
        return isNaN(d.getTime()) || d <= now;
      });

      return { data, providerEpisodes: releasedEpisodes };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        providerEpisodes: [],
        status: 500,
      };
    }
  }


  private extractMaxPages(html: string): number {
    const match = html.match(/maxPages:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Fetches and parses a single episode-list page (page 2+).
   * Used as a fallback to get the last episode number.
   */
  private async fetchEpisodePage(id: string, page: number, animeInfoId: string): Promise<IBaseEpisodes[]> {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime/${id}?page=${page}`, { method: 'GET' });
      if (!response.ok) return [];
      const html = await response.text();
      return this.parseEpisodeList(cheerio.load(html), animeInfoId);
    } catch {
      return [];
    }
  }


  private parseEpisodeList($: cheerio.CheerioAPI, animeInfoId: string): IBaseEpisodes[] {
    const episodes: IBaseEpisodes[] = [];

    $('ul.grid > li').each((_, el) => {
      const $el = $(el);
      const url = $el.find('a').attr('href') || null;

      const title = (() => {
        const xData = $el.attr('x-data') || '';
        const match = xData.match(/JSON\.parse\('(.*?)'\)/s);
        if (!match) return $el.find('h3').text().trim() || null;
        try {
          const titles = JSON.parse(this.unescapeAlpineJson(match[1]));
          return titles['1'] || titles['5'] || $el.find('h3').text().trim() || null;
        } catch {
          return $el.find('h3').text().trim() || null;
        }
      })();

      const episodeNumber = url ? url.split('/').at(-1) : null;
      episodes.push({
        episodeId: `${animeInfoId}-episode-${episodeNumber}`,
        episodeNumber: episodeNumber ? Number(episodeNumber) : null,
        thumbnail: $el.find('div.absolute img').attr('src') || null,
        teaser:
          $el
            .find('div.absolute img')
            .attr(':src')
            ?.match(/'([^']*teaser\.webp)'/)?.[1] || null,
        title,
        airDate:
          $el
            .find('span')
            .filter((i, span) => /^\d{4}-\d{2}-\d{2}$/.test($(span).text().trim()))
            .first()
            .text()
            .trim() || null,
      });
    });

    return episodes;
  }

  /**
   * Fetches video sources and related metadata for a specific episode.
   * @param {string} episodeId - The unique identifier for the episode.
   * @returns {Promise<ISourceBaseResponse<IVideoSource | null>>} - A promise resolving to an object containing video sources, headers, or an error message.
   */
  async fetchSources(episodeId: string): Promise<ISourceBaseResponse<IVideoSource | null>> {
    if (!episodeId) {
      return { error: 'Missing required params: episodeId', headers: { Referer: null }, data: null, status: 400 };
    }
    try {
      const match = episodeId.match(/([a-z0-9]+)-episode-(\d+)/i);
      if (!match) {
        return {
          error: 'Invalid episodeId format',
          status: 400,
          headers: { Referer: null },
          data: null,
        };
      }

      const id = `${match[1]}/${match[2]}`;

      const response = await this.client.fetch(`${this.baseUrl}/anime/${id}`, { method: 'GET' });

      if (!response.ok) {
        return {
          error: response.statusText || 'Unknown error',
          status: response.status,
          headers: { Referer: null },
          data: null,
        };
      }
      const result = await response.text();
      const { extractedData } = this.parseSources(cheerio.load(result));

      return {
        headers: { Referer: `${this.baseUrl}/` },
        data: extractedData,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', headers: { Referer: null }, data: null };
    }
  }

  /**
   * Parses search results from the Anizone website to extract anime information.
   * @private
   * @param {cheerio.CheerioAPI} $ - Cheerio instance for parsing HTML.
   * @returns - An object containing an array of parsed anime data or an empty array.
   */
  private parseSearchResults($: cheerio.CheerioAPI) {
    const container = $('div[x-data*="items: JSON.parse("]').first();
    const xData = container.attr('x-data') || '';

    const anime: IBase[] = [];

    const jsonMatch = xData.match(/items:\s*JSON\.parse\('(.*?)'\)\s*,/s);

    if (!jsonMatch) {
      return {
        data: [],
        error: 'No results found for that query',
        status: 404,
      };
    }

    let items: any[] = [];
    try {
      items = JSON.parse(this.unescapeAlpineJson(jsonMatch[1]));
    } catch {
      return {
        data: [],
        error: 'No results found for that query',
        status: 404,
      };
    }

    items.forEach(item => {
      const titleList = item.title_list || {};
      const name = titleList['1'] || titleList['10'] || titleList['5'] || item.main_title || null;
      const romaji = titleList['5'] || item.main_title || null;

      const genres = (item.tags || []).map((t: any) => t.name).filter((g: string) => g?.toLowerCase() !== 'manga');

      anime.push({
        id: name ? `${this.createSlug(name)}-${item.slug}` : item.slug || null,
        name,
        romaji,
        posterImage: item.cover || null,
        type: item.type ? (item.type.toLowerCase().includes('tv') ? 'TV' : item.type) : null,
        releaseDate: item.start_year != null ? String(item.start_year) : null,
        totalEpisodes: typeof item.episode_count === 'number' ? item.episode_count : null,
        status: item.is_ongoing ? 'Ongoing' : 'Completed',
        genres: genres.length ? genres : null,
      });
    });

    if (anime.length === 0) {
      return {
        data: [],
        error: 'No results found for that query',
        status: 404,
      };
    }

    return {
      data: anime,
    };
  }

  /**
   * Parses anime information and episode data from the Anizone anime page.
   * @private
   * @param {cheerio.CheerioAPI} $ - Cheerio instance for parsing HTML.
   * @returns - An object containing parsed anime info and episode data, or null if not found.
   */
  private parseAnimeinfo($: cheerio.CheerioAPI) {
    const synopsisHtml = $('.text-sm.md\\:text-base.xl\\:text-lg > div').html();
    const infoSpans = $('.text-slate-100.text-xs.lg\\:text-base.flex.flex-wrap > span');
    const xData = $('main > div[x-data]').attr('x-data') || '';

    const titles = (() => {
      const match = xData.match(/JSON\.parse\('(.*?)'\)/);

      if (!match) {
        return {
          name: $('h1').text().trim() || null,
          romaji: $('h1').text().trim() || null,
        };
      }

      try {
        const parsed = JSON.parse(this.unescapeAlpineJson(match[1]));

        return {
          name: parsed['1'] || parsed['10'] || parsed['5'] || null,
          romaji: parsed['5'] || null,
        };
      } catch {
        return {
          name: $('h1').text().trim() || null,
          romaji: $('h1').text().trim() || null,
        };
      }
    })();

    const id = $('div.flex.mt-8 a').attr('href')?.split('/')[4];
    const title = titles.name;
    const romaji = titles.romaji;

    const animeInfo: IBaseMediaInfo = {
      id: `${this.createSlug(title)}-${id}` || null,
      name: title || null,
      romaji: romaji,
      type: $(infoSpans[0]).find('.inline-block').text().trim().toLowerCase().includes('tv')
        ? 'TV'
        : $(infoSpans[0]).find('.inline-block').text().trim() || null,
      status: $(infoSpans[1]).find('.inline-block').text().trim() || null,
      posterImage: $('div.mx-auto img').attr('src') || null,
      coverImage: $('div.absolute img').attr('src') || null,
      totalEpisodes: (() => {
        const text = $(infoSpans[2]).find('.inline-block').text().trim();
        return text ? parseInt(text.replace(/\D/g, ''), 10) : null;
      })(),
      releaseDate: Number($(infoSpans[3]).find('.inline-block').text().trim()) || null,
      synopsis: synopsisHtml
        ? synopsisHtml
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/\n\s*\n/g, '\n')
            .trim()
        : 'N/A',
      genres:
        $('.flex-wrap.gap-2.justify-center.lg\\:justify-start a')
          .map((_, el) => $(el).text().trim())
          .get()
          .filter(g => g.toLowerCase() !== 'manga') || null,
    };

    // Use the shared parseEpisodeList method for page 1
    const episodes = this.parseEpisodeList($, animeInfo.id as string);

    if (animeInfo === null) {
      return {
        data: null,
        error: 'Anime info is null',
        status: 404,
        providerEpisodes: [],
      };
    }
    if (episodes.length === 0) {
      return {
        data: null,
        error: 'Provider episodes is empty',
        status: 404,
        providerEpisodes: [],
      };
    }
    return { data: animeInfo, providerEpisodes: episodes };
  }

  /**
   * Parses video sources, subtitles, and other media data from an episode page.
   * @private
   * @param {cheerio.CheerioAPI} $ - Cheerio instance for parsing HTML.
   * @returns  - An object containing parsed video source data.
   */
  private parseSources($: cheerio.CheerioAPI): { extractedData: IVideoSource } {
    const extractedData: IVideoSource = {
      subtitles: [],
      sources: [],
      tracks: [],
      posterImage: null,
    };

    const playerAttr = $('div[x-data^="vidstackPlayer("]').attr('x-data') || '';
    const jsonMatch = playerAttr.match(/vidstackPlayer\(JSON\.parse\('(.*?)'\)\)/s);

    if (!jsonMatch) {
      return { extractedData };
    }

    let data: {
      src?: string;
      snapshot?: string;
      storyboard?: string;
      chapter?: string;
      subtitles?: {
        title?: string;
        format?: string;
        language?: string;
        default?: boolean;
        forced?: string;
        file?: string;
      }[];
    } = {};

    try {
      data = JSON.parse(this.unescapeAlpineJson(jsonMatch[1]));
    } catch {
      return { extractedData };
    }

    if (data.src) {
      extractedData.sources.push({
        url: data.src,
        isM3u8: data.src.includes('m3u8'),
        type: data.src.includes('m3u8') ? 'hls' : 'Unknown',
      });
    }

    if (Array.isArray(data.subtitles)) {
      extractedData.subtitles = data.subtitles
        .filter(sub => sub.language === 'en')
        .map(sub => ({
          url: sub.file || null,
          lang: sub.title || null,
          default: !!sub.default,
        }));
    }

    if (data.chapter) {
      extractedData.tracks?.push({
        url: data.chapter,
        type: 'chapters',
      });
    }

    if (data.storyboard) {
      extractedData.tracks?.push({
        url: data.storyboard,
        type: 'thumbnails',
      });
    }

    extractedData.posterImage = data.snapshot || null;

    return { extractedData };
  }

  /**
   * Parses recent updates from the Anizone homepage, including recently added anime and latest episodes.
   * @private
   * @param {cheerio.CheerioAPI} $ - Cheerio instance for parsing HTML.
   * @returns  - An object containing arrays of recently added anime and latest episodes.
   */
  private parseUpdates($: cheerio.CheerioAPI) {
    const recentlyAdded: IBase[] = [];

    const latestAnimeBlock = 'div.swiper-wrapper.flex div.space-y-3.pb-6.swiper-slide';

    $(latestAnimeBlock).each((_, el) => {
      const id = $(el).find('a').first().attr('href')?.split('/').at(-1) || null;
      const title = $(el).find('a[title]').attr('title') || $(el).find('img').attr('alt');

      recentlyAdded.push({
        id: title ? `${this.createSlug(title)}-${id}` : null,
        name: title || null,
        posterImage: $(el).find('a > img').attr('src') || null,
      });
    });

    const latestEpisodes: IBaseEpisodes[] = [];
    const latestBlockEpisodes = $('div.md\\:w-2\\/3.lg\\:w-3\\/4 ul');
    latestBlockEpisodes.find('li').each((_, el) => {
      const $el = $(el);
      const episodeNumber = $el.find('a.group').attr('href')?.split('/').at(-1);
      const animeId = $el.find('div .title').first().attr('href')?.split('/').at(-1);
      const title = $el.find('div .title').first().text().trim() || null;
      const teaserMatch = $el
        .find('img')
        .attr(':src')
        ?.match(/'([^']*teaser\.webp)'/);
      latestEpisodes.push({
        episodeId: title ? `${this.createSlug(title)}-${animeId}-episode-${episodeNumber}` : null,
        episodeNumber: episodeNumber ? Number(episodeNumber) : null,
        title: $el.find('div .title').last().text().trim() || null,
        thumbnail: $el.find('img').attr('src') || null,
        teaser: teaserMatch ? teaserMatch[1] : null,
        airDate: $el.find('.flex.flex-row.text-xs span').eq(0).text().trim() || null,
      });
    });

    if (Array.isArray(latestEpisodes) && latestEpisodes.length === 0) {
      return {
        data: [],
        error: 'Latest episodes is empty',
        status: 404,
        recentlyAdded: [],
      };
    }
    if (Array.isArray(recentlyAdded) && recentlyAdded.length === 0) {
      return {
        data: [],
        error: 'Recently added is empty',
        status: 404,
        recentlyAdded: [],
      };
    }
    return { data: latestEpisodes, recentlyAdded };
  }

  private formatQuery = (title: string): string => {
    let decoded = title.trim();
    const isEncoded = /%[0-9A-Fa-f]{2}/.test(decoded);

    if (isEncoded) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        // fallback to original if malformed
      }
    }

    return decoded;
  };
}
