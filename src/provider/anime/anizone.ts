import * as cheerio from 'cheerio';
import { BaseClass, type ClientConfig } from '../../models/base.js';

import type {
  IAnizone,
  IAniZoneEpisodes,
  IAnizoneInfo,
  IAnizoneInfoResponse,
  IAnizoneUpdates,
} from '../../types/anime/anizone.js';
import type { IBase, IResponse, ISourceBaseResponse, IVideoSource } from '../../types/base.js';

/**
 * Anizone class for interacting with the Anizone anime streaming platform.
 * Extends BaseClass to provide functionality for searching anime, fetching anime details,
 * retrieving video sources for episodes, and fetching recent updates.
 * @extends BaseClass
 */
export class Anizone extends BaseClass {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'https://anizone.to', options: ClientConfig = {}) {
    super(options);
    this.baseUrl = baseUrl;
  }

  /**
   * Parses search results from the Anizone website to extract anime information.
   * @private
   * @param {cheerio.CheerioAPI} $ - Cheerio instance for parsing HTML.
   * @returns {IResponse<IAnizone[] | []>} - An object containing an array of parsed anime data or an empty array.
   */
  private parseSearchResults($: cheerio.CheerioAPI): IResponse<IAnizone[] | []> {
    const selector: cheerio.SelectorType =
      'div.grid.grid-cols-1.gap-4 > div.relative.overflow-hidden.h-26.rounded-lg.px-4.py-3.bg-slate-900.drop-shadow-lg';
    const anime: IAnizone[] = [];
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
    if (!Array.isArray(anime) || anime.length === 0) {
      return {
        data: [],
        error: 'No results found for that query ',
      };
    }
    return { data: anime };
  }

  /**
   * Parses anime information and episode data from the Anizone anime page.
   * @private
   * @param {cheerio.CheerioAPI} $ - Cheerio instance for parsing HTML.
   * @returns {IAnizoneInfoResponse<IAnizoneInfo | null>} - An object containing parsed anime info and episode data, or null if not found.
   */
  private parseAnimeinfo($: cheerio.CheerioAPI): IAnizoneInfoResponse<IAnizoneInfo | null> {
    const synopsisHtml = $('.text-sm.md\\:text-base.xl\\:text-lg > div').html();
    const infoSpans = $('.text-slate-100.text-xs.lg\\:text-base.flex.flex-wrap > span');
    const title = $('div.mx-auto img').attr('alt') || $('h1').text().trim();
    const id = $('div.flex.mt-8 a').attr('href')?.split('/')[4];

    const animeInfo: IAnizoneInfo = {
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
    const episodes: IAniZoneEpisodes[] = [];

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
  private parseUpdates($: cheerio.CheerioAPI): IAnizoneUpdates<IAniZoneEpisodes[] | []> {
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

    const latestEpisodes: IAniZoneEpisodes[] = [];
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

  /**
   * Searches for anime on the Anizone platform using a query string.
   * @param {string} query - The search query for finding anime.
   * @returns - A promise resolving to an object containing search results or an error message.
   */
  async search(query: string): Promise<IResponse<IAnizone[] | []>> {
    if (!query) {
      return { error: 'Missing required params: a query string', data: [] };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/anime`, {
        params: {
          search: this.formatQuery(query),
        },
      });
      if (!response.data) {
        return { error: response.statusText, data: [] };
      }
      return this.parseSearchResults(cheerio.load(response.data));
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown err', data: [] };
    }
  }

  /**
   * Fetches recent updates from the Anizone homepage, including recently added anime and latest episodes.
   * @returns - A promise resolving to an object containing arrays of recently added anime, latest episodes, or an error message.
   */

  async fetchUpdates(): Promise<IAnizoneUpdates<IAniZoneEpisodes[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/`);

      if (!response.data) {
        return { error: response.statusText, data: [], recentlyAdded: [] };
      }

      return this.parseUpdates(cheerio.load(response.data));
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown err',
        data: [],
        recentlyAdded: [],
      };
    }
  }

  /**
   * Fetches detailed information and episode list for a specific anime.
   * @param {string} animeId - The unique identifier for the anime.
   * @returns - A promise resolving to an object containing anime details and episodes or an error message.
   */
  async fetchAnimeInfo(animeId: string): Promise<IAnizoneInfoResponse<IAnizoneInfo | null>> {
    if (!animeId) {
      return { error: 'Missing required params animeId', data: null, providerEpisodes: [] };
    }

    try {
      const id = animeId.split('-').at(-1);
      const response = await this.client.get(`${this.baseUrl}/anime/${id}`);
      if (!response.data) {
        return { error: response.statusText, data: null, providerEpisodes: [] };
      }

      return this.parseAnimeinfo(cheerio.load(response.data));
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', data: null, providerEpisodes: [] };
    }
  }

  /**
   * Fetches video sources and related metadata for a specific episode.
   * @param {string} episodeId - The unique identifier for the episode.
   * @returns {Promise<ISourceBaseResponse<IVideoSource | null>>} - A promise resolving to an object containing video sources, headers, or an error message.
   */
  async fetchSources(episodeId: string): Promise<ISourceBaseResponse<IVideoSource | null>> {
    if (!episodeId) {
      return { error: 'Missing required params: episodeId', headers: { Referer: null }, data: null };
    }
    try {
      const match = episodeId.match(/([a-z0-9]+)-episode-(\d+)/i);
      if (!match) throw new Error('Invalid episodeId format');

      const id = `${match[1]}/${match[2]}`;

      const response = await this.client.get(`${this.baseUrl}/anime/${id}`);

      if (!response.data) {
        return { error: response.statusText || 'Unknown error', headers: { Referer: null }, data: null };
      }
      const { extractedData } = this.parseSources(cheerio.load(response.data));

      return {
        headers: { Referer: `${this.baseUrl}/` },
        data: extractedData,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', headers: { Referer: null }, data: null };
    }
  }
}
