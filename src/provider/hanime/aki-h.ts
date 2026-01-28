// https://aki-h.com/

import { BaseClass } from '../../models/base.js';
import * as cheerio from 'cheerio';

import type {
  AKiAnime,
  AKiHomeResponse,
  AKiHSpotlight,
  IAKiEpisodes,
  IAKiInfo,
  IAKiInfoResponse,
} from '../../types/hnaime/aki-h.js';

import type { IResponse, ISourceBaseResponse, IVideoSource } from '../../types/base.js';

export class AkiH extends BaseClass {
  private baseUrl: string;

  /**
   * Creates an instance of the AkiH scraper.
   * @param baseUrl - Base URL of the website (defaults to https://aki-h.com)
   */
  constructor(baseUrl: string = 'https://aki-h.com') {
    super();
    this.baseUrl = baseUrl;
  }

  /**
   * Parses the homepage HTML and extracts:
   * - Spotlight/carousel items
   * - Recently updated anime
   * - Most popular anime (sidebar)
   *
   * @param $ - Loaded cheerio instance
   * @returns Structured homepage data
   * @private
   */
  private parseHome($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = 'div#slider  div.deslide-item';
    const data: AKiHSpotlight[] = [];
    $(selector).each((_, element) => {
      data.push({
        spotlight: $(element).find('div.deslide-item-content > div.desi-sub-text').text().trim() || null,
        id:
          $(element).find('div.deslide-item-content > div.desi-buttons > a.btn-secondary').attr('href')?.split('/').at(-2) ||
          null,

        name: $(element).find('div.deslide-item-content > div.desi-head-title').text().trim() || null,
        native: $(element).find('div.deslide-item-content > div.desi-head-title').attr('data-jname') || null,
        type:
          $(element).find('div.deslide-item-content > div.sc-detail > div.scd-item:has(.fa-play-circle)').text().trim() ||
          null,

        releaseDate:
          $(element).find('div.deslide-item-content > div.sc-detail > div.scd-item:has(.fa-calendar)').text().trim() || null,
        quality:
          $(element)
            .find('div.deslide-item-content > div.sc-detail > div.scd-item:has(.quality)')
            .map((i, el) => $(el).text().trim())
            .get() || [],
        synopsis: $(element).find('div.deslide-item-content > div.desi-description').text().trim() || null,
        posterImage: $(element).find('div.deslide-cover-img > img.film-poster-img').attr('data-src') || null,
      });
    });
    const recentlyUpdated: AKiAnime[] = [];
    const recentlyUpdatedSelector: cheerio.SelectorType =
      'div#main-content section.block_area:first div.tab-content div.flw-item ';

    $(recentlyUpdatedSelector).each((_, element) => {
      recentlyUpdated.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(-2) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        native: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        type: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        totalEpisodes:
          Math.max(...($(element).find('div.fd-infor span.fdi-item:first').text().match(/\d+/g) || [0]).map(Number)) || null,
      });
    });

    const mostPopular: AKiAnime[] = [];

    const mostPopularSelector: cheerio.SelectorType = 'div#main-sidebar  li';

    $(mostPopularSelector).each((_, element) => {
      mostPopular.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(-2) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        native: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        totalEpisodes:
          Math.max(...($(element).find('div.fd-infor span.fdi-item:first').text().match(/\d+/g) || [0]).map(Number)) || null,
      });
    });
    return { data, mostPopular, recentlyUpdated };
  }

  /**
   * Parses search results HTML and extracts list of matching anime.
   *
   * @param $ - Loaded cheerio instance of the search results
   * @returns Object containing array of found anime
   * @private
   */
  private parseSearch($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = 'div.tab-content div.film_list-wrap div.flw-item';

    const data: AKiAnime[] = [];

    $(selector).each((_, element) => {
      data.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(-2) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        native: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        type: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        totalEpisodes:
          Math.max(...($(element).find('div.fd-infor span.fdi-item:first').text().match(/\d+/g) || [0]).map(Number)) || null,
      });
    });

    if (Array.isArray(data) && data.length === 0) {
      return {
        error: 'No result found',
        data: [],
      };
    }
    return { data };
  }

  /**
   * Parses anime detail/info page including metadata and episode list.
   *
   * @param $ - Loaded cheerio instance of anime info page
   * @returns Anime metadata + list of episodes
   * @private
   */

  private parseAnimeInfo($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = '.ani_detail-stage .anis-content ';
    const section = $(selector);

    const animeInfo: IAKiInfo = {
      id: section?.find('.film-buttons .btn')?.attr('href')?.split('/')?.at(-2) || null,
      name: $(selector)?.find('.anisc-detail .film-name.dynamic-name')?.text()?.trim() || null,
      native:
        $(`div.item.item-title:has(.item-head:contains("Japanese:")) .name`).text().trim() ||
        $(selector).find('h2.film-name.dynamic-name').attr('data-jname') ||
        null,

      releaseDate: $(`div.item.item-title:has(.item-head:contains("Aired:")) .name`).text().trim() || null,

      status: $(`div.item.item-title:has(.item-head:contains("Status:")) .name`).text().trim() || null,

      posterImage: section?.find('div.film-poster > img.film-poster-img.lazyload')?.attr('data-src') || null,
      genres:
        $(`div.item.item-list:has(.item-head:contains("Genres:")) a`)
          .map((i, el) => $(el).text().replace('Genres:', '').replace(/\s+/g, '').trim())
          .get() || null,
      studios:
        $(`div.item.item-title:has(.item-head:contains("Studios:")) .name`)
          .map((i, el) => $(el).text().trim())
          .get() || null,

      synopsis: section?.find('.anisc-info .text').text().trim() || null,

      type: $(`div.item.item-title:has(.item-head:contains("Category:")) .name`).text().trim() || null,
    };

    const episodesSelector: cheerio.SelectorType = 'div.block_area-content div.live_content >  div.live__-wrap > div.item';

    const episodes: IAKiEpisodes[] = [];
    $(episodesSelector).each((_, element) => {
      const title = $(element).find('a').attr('title') || null;
      episodes.push({
        title: title,
        episodeId: title
          ? `${title.toLowerCase().replace(/ /g, '-').replace('watch-', '')}-token-${$(element).find('a').attr('href')?.split('/').at(-2) || null}`
          : $(element).find('a').attr('href')?.split('/').at(-2) || null,
        thumbnail:
          $(element).find('img.live-thumbnail-img').attr('data-src') ||
          $(element).find('img.live-thumbnail-blur').attr('data-src') ||
          null,
      });
    });
    return { data: animeInfo, providerEpisodes: episodes };
  }

  /**
   * Fetches and parses the homepage (spotlight + recent + popular sections).
   * @returns Promise containing spotlight items, recently updated, most popular anime, or error information
   */
  async fetchHomePage(): Promise<AKiHomeResponse<AKiAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}`);

      if (!response.data) {
        return {
          error: response.statusText,
          data: [],
          mostPopular: [],
          recentlyUpdated: [],
        };
      }
      return this.parseHome(cheerio.load(response.data));
    } catch (error) {
      return {
        data: [],
        mostPopular: [],
        recentlyUpdated: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Searches for anime based on the provided query string.
   * @param {string} query - The search query string (required).
   * @returns  A promise that resolves to an object containing an array of anime titles, pagination details, or an error message.
   */
  async search(query: string): Promise<IResponse<AKiAnime[] | []>> {
    if (!query) {
      return { error: 'Missing a search query', data: [] };
    }
    const params = new URLSearchParams();
    params.append('q', `${query}`);
    try {
      const response = await this.client.post(`${this.baseUrl}/search/`, params.toString(), {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${this.baseUrl}/`,
          Origin: `${this.baseUrl}`,
        },
      });

      if (!response.data) {
        return {
          error: response.statusText,
          data: [],
        };
      }
      ////https://aki-h.com/search/?q=adam&page=1 we might have pagination look into this
      return this.parseSearch(cheerio.load(response.data));
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
  /**
   * Fetches detailed information about a specific anime including episodes.
   * @param {string} id - The unique identifier for the anime (required).
   * @returns  A promise that resolves to an object containing anime details, or an error message.
   */
  async fetchAnimeInfo(id: string): Promise<IAKiInfoResponse<IAKiInfo | null>> {
    if (!id) {
      return { error: 'Missing required params, animeid', data: null, providerEpisodes: [] };
    }
    try {
      const url = `${this.baseUrl}/${id}/`;

      const response = await this.client.get(url, {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          Referer: `${this.baseUrl}/`,
        },
      });
      if (!response.data) {
        return {
          error: response.statusText,
          data: null,
          providerEpisodes: [],
        };
      }
      return this.parseAnimeInfo(cheerio.load(response.data));
    } catch (error) {
      return {
        data: null,
        providerEpisodes: [],
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

    const token = episodeId.includes('-token-') ? episodeId.split('-token-').at(1) : null;
    if (!token) {
      throw new Error(`Invalid episodeId: "${episodeId}"`);
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/watch/${token}/`);
      if (!response.data) {
        throw new Error(response.statusText);
      }
      const regex = /window\.displayvideo\((\d+),\s*(\d+)\)/;
      const match = response.data.match(regex);

      let videoId;
      if (match) {
        const numbers = [parseInt(match[1]), parseInt(match[2])];
        videoId = Math.max(...numbers);
        console.log(' (Video ID):', videoId);
      }

      const iframeUrl = await this.client.get(`${this.baseUrl}/video/${videoId}/`, {
        headers: {
          Referer: `${this.baseUrl}/watch/${token}/`,
        },
      });

      if (!iframeUrl.data) {
        throw new Error(iframeUrl.statusText);
      }

      const regexIframe = /'url':\s*'([^']+)'/;
      const matchIframe = iframeUrl.data.match(regexIframe);

      let iframe = null;

      if (matchIframe) {
        iframe = new URL(matchIframe[1]);
        // console.log(iframe);
      }
      //might backfire
      const shortCutOrigin = await this.client.get(`${iframe?.origin}/f/${token}`, {
        headers: {
          Referer: `${iframe}`,
        },
      });
      if (!shortCutOrigin.data) {
        throw new Error(shortCutOrigin.statusText);
      }
      // 1. Regex to find everything inside src=" " within iframe tags
      const regexShort = /<iframe src="([^"]+)"/g;
      let matches;
      const urls = [];

      while ((matches = regexShort.exec(shortCutOrigin.data)) !== null) {
        urls.push(matches[1]);
      }
      // console.log(urls);
      // console.log(iframe?.origin);

      const vidId = await this.client.get(`${urls[1]}`, {
        headers: {
          Referer: `${iframe?.origin}/`,
        },
      });

      if (!vidId.data) {
        throw new Error(vidId.statusText);
      }

      const finalId = vidId.data.match(/<iframe.*?src="([^"]+)"/);
      let finalIframe = null;

      if (finalId) {
        finalIframe = new URL(finalId[1]);
      }
      // console.log(finalIframe);

      const playlist = await this.client.get(`${finalIframe?.origin}/file/${finalIframe?.pathname.split('/').at(-1)}/`, {
        headers: {
          Accept: '*/*',

          Referer: `${finalIframe?.href}`,
        },
      });

      if (!playlist.data) {
        throw new Error(playlist.statusText);
      }

      const extractedData: IVideoSource = {
        sources: [],
      };
      const regexM3U8 = /(https?:\/\/[^\s]+)/g;
      const m3u8Matches = playlist.data.match(regexM3U8) || [];

      m3u8Matches.forEach((link: string) => {
        const qualityMatch = link.match(/\d{3,4}/);

        extractedData.sources.push({
          url: link,
          isM3u8: true,
          type: 'hls',
          quality: qualityMatch ? `${qualityMatch[0]}p` : 'Auto',
        });
      });

      return {
        headers: { Referer: `${finalIframe?.origin}/` },
        data: extractedData,
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
