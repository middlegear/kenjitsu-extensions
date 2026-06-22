import * as cheerio from 'cheerio';
import { BaseClass, type ClientConfig } from '../../models/base.js';

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
 * Extends BaseClass to provide functionality for searching anime, fetching anime details,
 * retrieving video sources for episodes, and fetching recent updates.
 */
export class Anizone extends AnimeParser {
  constructor(baseUrl: string = 'https://anizone.to', options: ClientConfig = {}) {
    super(baseUrl, options);
    this.baseUrl = baseUrl;
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
      const id = animeId.split('-').at(-1);
      const response = await this.client.fetch(`${this.baseUrl}/anime/${id}`, { method: 'GET' });
      if (!response.ok) {
        return {
          data: null,
          providerEpisodes: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.text();
      return this.parseAnimeinfo(cheerio.load(result));
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        providerEpisodes: [],
        status: 500,
      };
    }
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
    const selector: cheerio.SelectorType =
      'div.grid.grid-cols-1.gap-4 > div.relative.overflow-hidden.h-26.rounded-lg.px-4.py-3.bg-slate-900.drop-shadow-lg';
    const anime: IBase[] = [];
    $(selector).each((_, element) => {
      const title =
        $(element).find('div.h-6.inline.truncate > a').text().trim() ||
        $(element).find('div.absolute.-inset-y-0.-right-0.w-80 > img').attr('alt') ||
        null;
      const id =
        $(element).find('div.h-6.inline.truncate > a').attr('href')?.split('/').at(-1) ||
        $(element).attr('wire:key')?.split('-').at(-1) ||
        null;

      anime.push({
        id: title ? `${this.createSlug(title)}-${id}` : id || null,
        name: title,
        // romaji: $(element).find('div.absolute.-inset-y-0.-right-0.w-80 > img').attr('alt') || null,
        posterImage: $(element).find('div.absolute.-inset-y-0.-right-0.w-80 > img').attr('src') || null,
        ...(() => {
          const infoSpans = $(element)
            .find('div.inline.text-xs.h-4.line-clamp-1 span')
            .map((_, el) => $(el).text().trim())
            .get();
          const genres = $(element)
            .find('div.flex.flex-wrap.gap-2.line-clamp-1.h-6 a')
            .map((_, el) => $(el).text().trim())
            .get()
            .filter(g => g.toLowerCase() !== 'manga');
          return {
            type: infoSpans[0] ? (infoSpans[0].toLowerCase().includes('tv') ? 'TV' : infoSpans[0]) : null,
            releaseDate: infoSpans[1] || null,
            status: infoSpans[3] || null,
            genres: genres || null,
            totalEpisodes: infoSpans[2] ? parseInt(infoSpans[2].replace(/\D/g, ''), 10) : null,
          };
        })(),
      });
    });
    if (Array.isArray(anime) && anime.length === 0) {
      return {
        data: [],
        error: 'No results found for that query ',
        status: 404,
      };
    }
    return { data: anime };
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
    const title = $('div.mx-auto img').attr('alt') || $('h1').text().trim();
    const id = $('div.flex.mt-8 a').attr('href')?.split('/')[4];

    const animeInfo: IBaseMediaInfo = {
      id: `${this.createSlug(title)}-${id}` || null,
      name: title || null,
      // romaji: $('div.mx-auto img').attr('alt') || null,
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
    const episodes: IBaseEpisodes[] = [];

    $('ul.grid > li').each((_, el) => {
      const $el = $(el);
      const url = $el.find('a').attr('href') || null;
      const title = $el.find('h3').text().trim() || null;
      const episodeNumber = url ? url.split('/').at(-1) : null;
      episodes.push({
        episodeId: `${animeInfo.id}-episode-${episodeNumber}`,
        episodeNumber: episodeNumber ? Number(episodeNumber) : null,
        thumbnail: $el.find('div.absolute img').attr('src') || null,

        teaser:
          $el
            .find('div.absolute img')
            .attr(':src')
            ?.match(/'([^']*teaser\.webp)'/)?.[0] ||
          $el
            .find('div.absolute img')
            .attr(':src')
            ?.match(/'([^']*teaser\.webp)'/)?.[1] ||
          null,
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
    if (animeInfo === null) {
      return {
        data: null,
        error: 'Anime info is null',
        status: 404,
        providerEpisodes: [],
      };
    }
    if (Array.isArray(episodes) && episodes.length === 0) {
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
    const player = $('media-player');
    const videoUrl = player.attr('src') || null;
    const poster = player.find('media-poster').attr('src') || null;

    const subtitles: {
      url: string | null;
      lang: string | null;
      default: boolean;
    }[] = [];
    player.find('track[kind="subtitles"]').each((_, el) => {
      const $el = $(el);
      subtitles.push({
        url: $el.attr('src') || null,
        lang: $el.attr('label') || null,
        default: $el.is('[default]'),
      });
    });

    const chapters = player.find('track[kind="chapters"]').attr('src') || null;
    const thumbnails = player.find('media-video-layout').attr('thumbnails') || null;
    const extractedData: IVideoSource = {
      subtitles: [],
      sources: [],
      tracks: [],
      posterImage: null,
    };
    if (videoUrl) {
      extractedData.sources.push({
        url: videoUrl,
        isM3u8: videoUrl.includes('m3u8'),
        type: videoUrl.includes('m3u8') ? 'hls' : 'Unknown',
      });
    }
    if (subtitles && Array.isArray(subtitles)) {
      extractedData.subtitles = subtitles;
    }

    if (chapters) {
      extractedData.tracks?.push({
        url: chapters,
        type: 'chapters',
      });
    }
    if (thumbnails) {
      extractedData.tracks?.push({
        url: thumbnails,
        type: 'thumbnails',
      });
    }
    extractedData.posterImage = poster;
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
        error: 'Latest  episodes is empty',
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
