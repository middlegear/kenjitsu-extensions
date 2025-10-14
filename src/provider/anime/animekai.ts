import { BaseClass } from '../../models/base-anime.js';
import * as cheerio from 'cheerio';
import {
  AKGenres,
  type AKserver,
  type HIServerInfo,
  type ISubOrDub,
  type IAHomeResponse,
  type IAllAnimeEpisodes,
  type IAnime,
  type IAnimeKaiInfoResponse,
  type IAnimeCategory,
  type IAnimeInfo,
  type IAnimePaginated,
  type IRelatedSeasons,
  type IResponse,
  type ISourceBaseResponse,
  type IVideoSource,
  type IMetaFormat,
} from '../../models/types.js';
import { MegaUp } from '../../source-extractors/megaup.js';

/**
 * A class for interacting with the AnimeKai Provider.
 *
 * It aims to search for anime, fetch detailed information, retrieve available streaming servers,
 * and obtain direct episode sources.
 */
class Animekai extends BaseClass {
  constructor(baseUrl: string = 'https://anikai.to') {
    super();
    this.baseUrl = baseUrl;
    this.megaup = new MegaUp();
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0',
      Accept: 'text/html, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.5',
      'Sec-GPC': '1',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      Priority: 'u=0',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      referer: `${this.baseUrl}/`,
      Cookie:
        'usertype=guest; session=hxYne0BNXguMc8zK1FHqQKXPmmoANzBBOuNPM64a; cf_clearance=WfGWV1bKGAaNySbh.yzCyuobBOtjg0ncfPwMhtsvsrs-1737611098-1.2.1.1-zWHcaytuokjFTKbCAxnSPDc_BWAeubpf9TAAVfuJ2vZuyYXByqZBXAZDl_VILwkO5NOLck8N0C4uQr4yGLbXRcZ_7jfWUvfPGayTADQLuh.SH.7bvhC7DmxrMGZ8SW.hGKEQzRJf8N7h6ZZ27GMyqOfz1zfrOiu9W30DhEtW2N7FAXUPrdolyKjCsP1AK3DqsDtYOiiPNLnu47l.zxK80XogfBRQkiGecCBaeDOJHenjn._Zgykkr.F_2bj2C3AS3A5mCpZSlWK5lqhV6jQSQLF9wKWitHye39V.6NoE3RE',
    };
  }

  private readonly baseUrl: string;
  private readonly megaup: MegaUp;
  private readonly headers: Record<string, string>;

  /**
   * Scrapes anime data from recently added/upcoming/recently completed sections.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @param {cheerio.SelectorType} selector - CSS selector for the anime elements to scrape.
   * @returns {IAnime[]} An array of parsed anime objects.
   */
  private scrapeUpdates($: cheerio.CheerioAPI, selector: cheerio.SelectorType) {
    const recentSection: IAnime[] = [];

    $(selector).each((_, element) => {
      recentSection.push({
        id: $(element).attr('href')?.split('/').at(2) || null || null,
        name: $(element).attr('title') || null,
        romaji: $(element).find('div.detail h6').attr('data-jp') || null,
        posterImage: $(element).find('img.lazyload').attr('data-src') || null,
        type: $(element).find('.info > span:last > b').text().trim() || null,
        episodes: {
          sub: Number($(element).find('.info > span.sub').text().trim() || null),
          dub: Number($(element).find('.info > span.dub').text().trim() || null),
        },
        totalEpisodes: Number($(element).find('.info > span.sub').text().trim()) || null,
      });
    });
    return recentSection;
  }

  /**
   * Scrapes trending anime cards from different time periods (now, daily, weekly, monthly).
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @param {cheerio.SelectorType} selector - CSS selector for the trending anime elements.
   * @returns {IAnime[]} An array of parsed trending anime objects.
   */
  private scrapeTrendingCard($: cheerio.CheerioAPI, selector: cheerio.SelectorType) {
    const trending: IAnime[] = [];
    $(selector).each((_, element) => {
      const style = $(element).attr('style');
      const match = style?.match(/url\((['"]?)(.*?)\1\)/);
      const url = match ? match[2] : null;
      trending.push({
        id: $(element).attr('href')?.split('/').at(2) || null,
        name: $(element).find('div.detail div.title').text().trim() || null,
        romaji: $(element).find('div.detail div.title').attr('data-jp') || null,
        type: $(element).find('.info > span > b').text().trim() || null,
        posterImage: url || null,
        episodes: {
          sub: Number($(element).find('.info > span.sub').text().trim() || null),
          dub: Number($(element).find('.info > span.dub').text().trim() || null),
        },
        totalEpisodes: Number($(element).find('.info > span.sub').text().trim()),
      });
    });

    return trending;
  }

  /**
   * Parses the homepage HTML to extract curated anime sections including featured, trending, and recently updated content.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @returns {IAHomeResponse<IAnime[] | []>} An object containing various curated anime lists.
   */
  private parseHome($: cheerio.CheerioAPI): IAHomeResponse<IAnime[] | []> {
    const selector: cheerio.SelectorType = 'section#featured div.swiper-wrapper > div.swiper-slide';

    const data: IAnime[] = [];

    $(selector).each((_, element) => {
      const style = $(element).attr('style');
      const match = style?.match(/url\((['"]?)(.*?)\1\)/);
      const url = match ? match[2] : null;
      data.push({
        id: $(element).find('div.swiper-ctrl > a').attr('href')?.split('/').at(2) || null,
        name: $(element).find('div.detail > p.title').text().trim() || null,
        romaji: $(element).find('div.detail > p.title').attr('data-jp') || null,
        posterImage: url || null,
        type: $(element).find('.info > span > b').text().trim() || null,
        synopsis: $(element).find('p.desc').text().trim() || null,
        quality: $(element).find('div.mics span:last').text().trim() || null,
        releaseDate: $(element).find('div.mics span:eq(1)').text().trim() || null,
        rating: $(element).find('div.mics span:first').text().trim() || null,
        episodes: {
          sub: Number($(element).find('.info > span.sub').text().trim() || null),
          dub: Number($(element).find('.info > span.dub').text().trim() || null),
        },
        totalEpisodes: Number($(element).find('.info > span.sub').text().trim()),
      });
    });

    // scrape trending
    const trendingBase = 'section#trending-anime div.aitem-col.top-anime.tab-body';

    const trendingKeys = ['now', 'daily', 'weekly', 'monthly'] as const;

    const trending = trendingKeys.reduce(
      (acc, key, i) => {
        const sel: cheerio.SelectorType = `${trendingBase}:eq(${i}) a`;
        acc[key] = this.scrapeTrendingCard($, sel);
        return acc;
      },
      {} as Record<(typeof trendingKeys)[number], ReturnType<typeof this.scrapeTrendingCard>>,
    );

    const recentlyUpdatedSelector: cheerio.SelectorType = 'section#latest-updates div.aitem-wrapper.regular div.aitem';

    const recentlyUpdated: IAnime[] = [];

    $(recentlyUpdatedSelector).each((_, element) => {
      const episodeId = $(element).find('a.poster').attr('href')?.split('/').at(2);
      recentlyUpdated.push({
        id: episodeId?.split('#').at(0) || null,
        name: $(element).find('a.title').text().trim() || null,
        romaji: $(element).find('a.title').attr('data-jp') || null,
        posterImage: $(element).find('img.lazyload').attr('data-src') || null,
        type: $(element).find('.info > span:last > b').text().trim() || null,
        episodes: {
          sub: Number($(element).find('.info > span.sub').text().trim() || null),
          dub: Number($(element).find('.info > span.dub').text().trim() || null),
        },
        totalEpisodes: Number($(element).find('.info > span.sub').text().trim()) || null,
      });
    });

    const swiperBase = 'div.swiper.alist-group section.swiper-slide';

    const swiperKeys = ['recentlyAdded', 'upcoming', 'recentlyCompleted'] as const;

    const swiperSelectors = swiperKeys.map((_, i) => `${swiperBase}:eq(${i}) div.aitem-wrapper.mini.compact a.aitem`);

    const [recentlyAddedSelector, upcomingSelector, recentlyCompletedSelector] = swiperSelectors;

    const recentlyAdded = this.scrapeUpdates($, recentlyAddedSelector as cheerio.SelectorType);
    const upcoming = this.scrapeUpdates($, upcomingSelector as cheerio.SelectorType);
    const recentlyCompleted = this.scrapeUpdates($, recentlyCompletedSelector as cheerio.SelectorType);

    return {
      data,
      trending,
      recentlyUpdated,
      recentlyAdded,
      upcoming,
      recentlyCompleted,
    };
  }

  /**
   * Parses paginated anime search or category results from HTML.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @param {cheerio.SelectorType} selector - CSS selector for the anime items in the paginated results.
   * @returns {IAnimePaginated<IAnime[] | []>} An object containing paginated anime results with metadata.
   */
  private parsePaginated($: cheerio.CheerioAPI, selector: cheerio.SelectorType): IAnimePaginated<IAnime[] | []> {
    const results: IAnime[] = [];
    $(selector).each((_, element) => {
      results.push({
        id: $(element).find('div.inner > a').attr('href')?.replace('/watch/', '').trim() || null,
        name: $(element).find('div.inner > a').text().trim() || null,
        romaji: $(element).find('a.title').attr('data-jp')?.trim() || null,
        posterImage: $(element).find('img')?.attr('data-src') || $(element).find('img').attr('src') || null,
        type: $(element).find('.info').children().last()?.text().trim() || null,
        episodes: {
          sub: Number($(element).find('.info span.sub').text().trim()) || null,
          dub: Number($(element).find('.info span.dub').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('.info').children().eq(-2).text().trim() || $(element).find('.info span.sub')?.text()) ||
          null,
      });
    });

    const currentPage = Number($('.pagination li.page-item.active .page-link').text().trim()) || 1;

    const hasNextPage = $(".pagination li a[rel='next']").length > 0;

    const lastPageHref = $(".pagination li a[rel='last']").attr('href');
    const lastPage = lastPageHref
      ? Number(new URL(lastPageHref, 'https://animekai.to').searchParams.get('page'))
      : currentPage;
    const totalResults = Number($('div.shead.justify').find('span:last').text().trim().replace(/\D/g, ''));

    return {
      hasNextPage,
      currentPage,
      totalResults,
      lastPage,
      data: results,
    };
  }

  /**
   * Parses related/recommended anime sections from the anime info page.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @param {cheerio.SelectorType} selector - CSS selector for the related/recommended anime elements.
   * @returns {IAnime[]} An array of parsed related or recommended anime objects.
   */
  private parseInfoSections($: cheerio.CheerioAPI, selector: cheerio.SelectorType) {
    const Anime: IAnime[] = [];
    $(selector).each((_, element) => {
      const style = $(element).attr('style');
      const match = style?.match(/url\((['"]?)(.*?)\1\)/);
      const url = match ? match[2] : null;
      Anime.push({
        id: $(element).attr('href')?.split('/').at(2) || null,
        name: $(element).find('div.title').text().trim() || null,
        romaji: $(element).find('div.title').attr('data-jp') || null,
        posterImage: url || null,
        type: $(element).find('.info span:eq(-2) b').text().trim() || null,
        episodes: {
          sub: Number($(element).find('.info span.sub').text().trim()) || null,
          dub: Number($(element).find('.info span.dub').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('.info span.sub').text().trim()) ||
          Number($(element).find('.info span.dub').text().trim()) ||
          null,
      });
    });

    return Anime;
  }

  /**
   * Parses detailed anime information from the anime watch page.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @returns {Object} An object containing parsed anime info, rating data, related seasons, and recommendations.
   */
  private parseAnimeInfo($: cheerio.CheerioAPI) {
    const style = $('div.watch-section-bg').attr('style');
    const match = style?.match(/url\((['"]?)(.*?)\1\)/);
    const url = match ? match[2] : null;

    const animeInfo: IAnimeInfo = {
      //
      anilistId: Number($('div#watch-page').attr('data-al-id')) || null,
      malId: Number($('div#watch-page').attr('data-mal-id')) || null,
      id: $('div.swiper-slide.aitem.active a.poster').attr('href')?.split('/').at(2) || null,
      name: $('li.breadcrumb-item.active').text().trim() || null,
      romaji: $('li.breadcrumb-item.active').attr('data-jp') || null,
      altnames: $('small.al-title.text-expand').text().trim() || null,
      rating: $('div.info > span.rating').text() || null,
      posterImage: url || null,
      type: $('div.main-entity.collapse').find('div.info > span > b').text().trim() || null,
      japanese: $('li.breadcrumb-item.active').attr('data-jp') || null,
      status: $('.detail > div > div:contains("Status") span').text().trim() || null,
      releaseDate: $('.detail > div > div:contains("Date aired")').text().replace('Date aired:', '').trim() || null,
      synopsis: $('div.desc.text-expand').text().trim() || null,
      score: $('.detail > div > div:contains("MAL") span').first().text().trim().split(' ').at(0) || null,
      genres:
        $('.detail > div > div:contains("Genres") span a')
          .map((i, el) => $(el).text().trim())
          .get() || null,
      studios:
        $('.detail > div > div:contains("Studios") span a span')
          .map((i, el) => $(el).text().trim())
          .get() || null,
      producers:
        $('.detail > div > div:contains("Producers") span a span')
          .map((i, el) => $(el).text().trim())
          .get() || null,
      episodes: {
        sub: Number($('div.main-entity.collapse').find('div.info > span.sub').text().trim()) || null,
        dub: Number($('div.main-entity.collapse').find('div.info > span.dub:first').text().trim()) || null,
      },
      totalEpisodes:
        Number($('.detail > div > div:contains("Episodes") span').text().trim()) ||
        Number($('div.info span.sub').text().trim()) ||
        null,
    };

    const rateBox = {
      dataId: $('div#anime-rating').attr('data-id') || null,
      anilistId: $('div#anime-rating').attr('data-alid') || null,
      score: $('div#anime-rating').attr('data-score') || null,
      reviewCount: $('div#anime-rating').find('span.d-none:last').text().trim() || null,
    };

    const seasonSelector: cheerio.SelectorType = 'div.swiper.swiper-seasons div.swiper-slide.aitem';
    const relatedSeasons: IRelatedSeasons[] = [];
    $(seasonSelector).each((_, element) => {
      relatedSeasons.push({
        id: $(element).find('div.inner a.poster').attr('href')?.split('/').at(2) || null,
        name:
          $(element).find('div.inner a.poster').attr('href')?.split('/').at(2)?.split('-').slice(0, -1).join('-') || null,
        season: $(element).find('div.detail > span').text().trim() || null,
        totalEpisodes: Number($(element).find('div.detail div.btn').text().trim().replace(/\D/g, '')) || null,
        seasonPoster: $(element).find('div.inner a.poster img').attr('src') || null,
      });
    });

    const relatedSelector: cheerio.SelectorType = 'section#related-anime  div.aitem-col a.aitem';
    const relatedAnime: IAnime[] = this.parseInfoSections($, relatedSelector);

    const recommedSelector: cheerio.SelectorType = 'section.sidebar-section.hide-bg-mobile  div.aitem-col a';
    const recommendedAnime: IAnime[] = this.parseInfoSections($, recommedSelector);

    return { animeInfo, rateBox, relatedSeasons, recommendedAnime, relatedAnime };
  }

  /**
   * Parses episode list from the AJAX endpoint response.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @param {string} animeId - The unique identifier for the anime.
   * @returns {IAllAnimeEpisodes[]} An array of parsed episode objects with language availability.
   */
  private parseEpisodes($: cheerio.CheerioAPI, animeId: string) {
    const selector: cheerio.SelectorType = 'div.eplist ul li';

    const episodes: IAllAnimeEpisodes[] = [];
    $(selector).each((_, element) => {
      const language = $(element).find('a').attr('langs') || null;
      let Dub;
      let Sub;
      if (language) {
        Dub = Number(language) >= 3 ? true : false;
        Sub = Number(language) >= 1 ? true : false;
      }
      episodes.push({
        episodeId: `${animeId}-token-${$(element).find('a').attr('token')}` || null,
        title: $(element).find('span').text().trim() || null,
        episodeNumber:
          Number(
            $(element).find('a').attr('slug') || $(element).find('a').attr('num') || $(element).find('a').text().trim(),
          ) || null,
        hasDub: Dub || null,
        hasSub: Sub || null,
      });
    });

    return episodes;
  }

  /**
   * Parses server information from the episode links AJAX response.
   * @private
   * @param {cheerio.CheerioAPI} $ - The Cheerio API instance for parsing HTML.
   * @returns {IResponse<HIServerInfo | null>} An object containing parsed server information.
   */
  private parseServers($: cheerio.CheerioAPI): IResponse<HIServerInfo | null> {
    const subSelector: cheerio.SelectorType = 'div.server-wrap div.server-items[data-id="sub"] span.server';
    const dubSelector: cheerio.SelectorType = 'div.server-wrap div.server-items[data-id="dub"] span.server';
    const softSubSelector: cheerio.SelectorType = 'div.server-wrap div.server-items[data-id="softsub"] span.server'; /// this will be raw
    const servers: HIServerInfo = {
      sub: [],
      dub: [],
      raw: [],
      episodeNumber: 0,
    };
    servers.episodeNumber = Number($('div.server-note').find('b').text().trim().replace(/\D+/g, '')) || null;
    $(subSelector).each((_, element) => {
      servers.sub.push({
        serverId: Number($(element).attr('data-sid')) || null,
        mediaId: $(element).attr('data-lid') || null,
        eid: $(element).attr('data-eid') || null,
        serverName:
          $(element)
            .text()
            .trim()
            .toLowerCase()
            .replace(/server\s+(\d+)/g, 'server-$1') || null,
      });
    });
    $(dubSelector).each((_, element) => {
      servers.dub.push({
        serverId: Number($(element).attr('data-sid')) || null,
        mediaId: $(element).attr('data-lid') || null,
        eid: $(element).attr('data-eid') || null,
        serverName:
          $(element)
            .text()
            .trim()
            .toLowerCase()
            .replace(/server\s+(\d+)/g, 'server-$1') || null,
      });
    });
    $(softSubSelector).each((_, element) => {
      servers.raw.push({
        serverId: Number($(element).attr('data-sid')) || null,
        mediaId: $(element).attr('data-lid') || null,
        eid: $(element).attr('data-eid') || null,
        serverName:
          $(element)
            .text()
            .trim()
            .toLowerCase()
            .replace(/server\s+(\d+)/g, 'server-$1') || null,
      });
    });

    return { data: servers };
  }

  /**
   * Extracts media IDs for a specific audio category from the server information.
   * @private
   * @param {HIServerInfo} servers - The parsed server information object.
   * @param {ISubOrDub} category - The audio category to filter servers for ('sub', 'dub', or 'raw').
   * @param  {string}  server - The streaming server to use (optional, defaults to server-1).
   * @returns {string} A valid media ID for the specified category.
   * @throws {Error} If no servers or valid media IDs are found for the category.
   */
  private findServerIds(servers: HIServerInfo, category: ISubOrDub, server: 'server-1' | 'server-2'): string {
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
    const availableServers = servers[category].map(s => s.serverName || 'unknown');
    const serverIndex = servers[category].findIndex(s => (s.serverName || '').toLowerCase() === server.toLowerCase());

    if (serverIndex === -1) {
      throw new Error(
        `Server '${server}' not found in category '${category}'. ` +
          `Try one of the available servers: ${availableServers.join(', ')}.`,
      );
    }

    return servers[category][serverIndex].mediaId as string;
  }

  /**
   * Fetches curated lists from the Animekai homepage.
   * @returns Promise resolving to an object with various curated anime lists
   */
  async fetchHome(): Promise<IAHomeResponse<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/home`);
      if (!response.data) {
        return {
          trending: { now: [], daily: [], weekly: [], monthly: [] },
          recentlyUpdated: [],
          upcoming: [],
          recentlyCompleted: [],
          recentlyAdded: [],
          data: [],
          error: response.statusText || 'server returned an empty response',
        };
      }

      return this.parseHome(cheerio.load(response.data));
    } catch (error) {
      return {
        trending: { now: [], daily: [], weekly: [], monthly: [] },
        recentlyUpdated: [],
        upcoming: [],
        recentlyCompleted: [],
        recentlyAdded: [],
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
      };
    }
  }

  /**
   * Fetches a list of anime by category.
   * @param { IAnimeCategory} category - The category of anime to fetch (MOVIE, TV, ONA, OVA, SPECIALS).
   * @param {number} [page=1] - The page number for pagination (default: 1).
   * @returns {Promise<IAnimePaginated<IAnime[] | []>>} - Promise resolving to paginated anime results.
   */
  async fetchAnimeCategory(category: IAnimeCategory, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    try {
      let endpoint: string;

      switch (category) {
        case 'MOVIE':
          endpoint = '/movie';
          break;
        case 'TV':
          endpoint = '/tv';
          break;
        case 'ONA':
          endpoint = '/ona';
          break;
        case 'OVA':
          endpoint = '/ova';
          break;
        case 'SPECIALS':
          endpoint = '/special';
          break;
        default:
          throw new Error(`Invalid category: ${category}`);
      }

      const response = await this.client.get(`${this.baseUrl}${endpoint}`, {
        params: { page: String(page) },
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
          error: response.statusText || 'Received empty response from server',
        };
      }

      const data$ = cheerio.load(response.data);
      const selector: cheerio.SelectorType = 'div.aitem-wrapper.regular  div.aitem';

      return this.parsePaginated(data$, selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Searches for anime titles based on the provided query string.
   * @param {string} query - The search query string (required).
   * @param {number} [page] - The page number for pagination (optional, defaults to 1).
   * @returns  A promise that resolves to an object containing an array of anime results related to the search query.
   */
  async search(query: string, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    if (!query.trim()) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: 'Missing required parameter: query',
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/browser`, {
        params: {
          keyword: encodeURIComponent(query.trim()),
          page: String(page),
        },
      });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
        };
      }

      const selector: cheerio.SelectorType = 'div.aitem-wrapper.regular  div.aitem';
      return this.parsePaginated(cheerio.load(response.data), selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetches a paginated list of recently added anime.
   * @param {IMetaFormat} category - The format which to fetch anime (optional,  defaults to TV)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with recently added anime and pagination details
   */

  async fetchRecentlyAdded(category: IMetaFormat, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    let endpoint: string;

    switch (category) {
      case 'MOVIE':
        endpoint = 'movie';
        break;
      case 'TV':
        endpoint = 'tv';
        break;
      case 'ONA':
        endpoint = 'ona';
        break;
      case 'OVA':
        endpoint = 'ova';
        break;
      case 'SPECIAL':
        endpoint = 'special';
        break;
      case 'MUSIC':
        endpoint = 'music';
      default:
        throw new Error(`Invalid category: ${category}`);
    }

    try {
      const response = await this.client.get(
        `${this.baseUrl}/browser?keyword=&type[]=${endpoint}&sort=added_date&page=${page}`,
      );

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
        };
      }

      const selector: cheerio.SelectorType = 'div.aitem-wrapper.regular  div.aitem';
      return this.parsePaginated(cheerio.load(response.data), selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetches a paginated list of recently added anime.
   * @param {IMetaFormat} category - The format which to fetch anime (optional,  defaults to TV)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with top airing anime and pagination details
   */

  async fetchTopAiring(category: IMetaFormat = 'TV', page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    try {
      let endpoint: string;

      switch (category) {
        case 'MOVIE':
          endpoint = 'movie';
          break;
        case 'TV':
          endpoint = 'tv';
          break;
        case 'ONA':
          endpoint = 'ona';
          break;
        case 'OVA':
          endpoint = 'ova';
          break;
        case 'SPECIAL':
          endpoint = 'special';
          break;
        case 'MUSIC':
          endpoint = 'music';
        default:
          throw new Error(`Invalid category: ${category}`);
      }

      const response = await this.client.get(
        `${this.baseUrl}/browser?keyword=&type[]=${endpoint}&status[]=releasing&sort=updated_date&page=${page}`,
      );

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
        };
      }

      const selector: cheerio.SelectorType = 'div.aitem-wrapper.regular  div.aitem';
      return this.parsePaginated(cheerio.load(response.data), selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetches a paginated list of recently updated anime.
   * @param {IMetaFormat} category - The format which to fetch anime (optional,  defaults to TV)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with recently updated anime and pagination details
   */

  async fetchRecentlyUpdated(category: IMetaFormat = 'TV', page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    try {
      let endpoint: string;

      switch (category) {
        case 'MOVIE':
          endpoint = 'movie';
          break;
        case 'TV':
          endpoint = 'tv';
          break;
        case 'ONA':
          endpoint = 'ona';
          break;
        case 'OVA':
          endpoint = 'ova';
          break;
        case 'SPECIAL':
          endpoint = 'special';
          break;
        case 'MUSIC':
          endpoint = 'music';
        default:
          throw new Error(`Invalid category: ${category}`);
      }

      const response = await this.client.get(
        `${this.baseUrl}/browser?keyword=&type[]=${endpoint}&status[]=releasing&status[]=completed&sort=updated_date&page=${page}`,
      );

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
        };
      }

      const selector: cheerio.SelectorType = 'div.aitem-wrapper.regular  div.aitem';
      return this.parsePaginated(cheerio.load(response.data), selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetches a paginated list of recently completed anime.
   * @param {IMetaFormat} category - The format which to fetch anime (optional,  defaults to TV)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with recently completed anime and pagination details
   */

  async fetchRecentlyCompleted(category: IMetaFormat = 'TV', page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    try {
      let endpoint: string;

      switch (category) {
        case 'MOVIE':
          endpoint = 'movie';
          break;
        case 'TV':
          endpoint = 'tv';
          break;
        case 'ONA':
          endpoint = 'ona';
          break;
        case 'OVA':
          endpoint = 'ova';
          break;
        case 'SPECIAL':
          endpoint = 'special';
          break;
        case 'MUSIC':
          endpoint = 'music';
        default:
          throw new Error(`Invalid category: ${category}`);
      }

      const response = await this.client.get(
        `${this.baseUrl}/browser?keyword=&type[]=${endpoint}&status[]=completed&sort=updated_date&page=${page}`,
      );

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
        };
      }

      const selector: cheerio.SelectorType = 'div.aitem-wrapper.regular  div.aitem';
      return this.parsePaginated(cheerio.load(response.data), selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetches a paginated list of genre curated anime.
   * @param {AKGenre} genre - The genre which to fetch anime (required)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with anime curated by genre and pagination details
   */

  async fetchGenres(genre: string, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    try {
      const Igenre = this.getMappedValue(genre, AKGenres);
      const response = await this.client.get(`${this.baseUrl}/genres/${Igenre}`, { params: { page: String(page) } });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          totalResults: 0,
          lastPage: 0,
          data: [],
          error: response.statusText,
        };
      }

      const selector: cheerio.SelectorType = 'div.aitem-wrapper.regular  div.aitem';
      return this.parsePaginated(cheerio.load(response.data), selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        totalResults: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime.
   * @param {string} animeId - The unique identifier for the anime  (required).
   * @returns  A promise that resolves to an object containing anime details, related seasons provider episodeslists ,recommendations, or an error message.
   */
  async fetchAnimeInfo(animeId: string): Promise<IAnimeKaiInfoResponse<IAnimeInfo | null>> {
    if (!animeId.trim()) {
      return {
        error: 'Missing required Params: animeId',
        relatedSeasons: [],
        recommendedAnime: [],
        relatedAnime: [],
        data: null,
        providerEpisodes: [],
      };
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/watch/${encodeURIComponent(animeId.trim())}`, {
        headers: this.headers,
      });

      if (!response.data) {
        throw new Error(response.statusText);
      }

      const { animeInfo, relatedSeasons, recommendedAnime, relatedAnime, rateBox } = this.parseAnimeInfo(
        cheerio.load(response.data),
      );

      const ani_id = rateBox.dataId as string;

      const token = await this.megaup.GenerateToken(ani_id);

      const episodesList = await this.client.get(`${this.baseUrl}/ajax/episodes/list?ani_id=${ani_id}&_=${token}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          ...this.headers,
        },
      });

      const episodes = this.parseEpisodes(cheerio.load(episodesList.data.result), animeId);

      if (!episodesList.data) {
        return {
          data: animeInfo,
          relatedSeasons: relatedSeasons,
          recommendedAnime: recommendedAnime,
          relatedAnime: relatedAnime,
          error: `Cannot fetch provider episodes: ${response.statusText}`,
          providerEpisodes: [],
        };
      }

      return {
        data: animeInfo,
        relatedSeasons: relatedSeasons,
        recommendedAnime: recommendedAnime,
        relatedAnime: relatedAnime,
        providerEpisodes: episodes,
      };
    } catch (error) {
      return {
        relatedSeasons: [],
        recommendedAnime: [],
        relatedAnime: [],
        providerEpisodes: [],
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetches server information for a specific episode using the token-based AJAX endpoint.
   * @private
   * @param {string} episodeId - The unique identifier for the episode containing the token.
   * @returns {Promise<IResponse<HIServerInfo | null>>} A promise resolving to server information or an error.
   * @throws {Error} If the episodeId is missing or has invalid format.
   */
  private async scrapefetchServers(episodeId: string): Promise<IResponse<HIServerInfo | null>> {
    if (!episodeId) {
      throw new Error('Missing required parameter: episodeId');
    }

    const token = episodeId.includes('-token-') ? episodeId.split('-token-').at(1) : null;
    if (!token) {
      throw new Error(`Invalid episodeId format: expected "-token-" part in "${episodeId}"`);
    }

    try {
      const generatedToken = await this.megaup.GenerateToken(token);
      if (!generatedToken) {
        throw new Error('Failed to generate token');
      }

      const response = await this.client.get(`${this.baseUrl}/ajax/links/list?token=${token}&_=${generatedToken}`);

      return this.parseServers(cheerio.load(response.data.result));
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetches available streaming servers for a specific anime episode.
   * @param {string} episodeId - The unique identifier for the episode  (required).
   * @param {ISubOrDub} category  - The audio category (Subtitled or Dubbed) (optional, defaults to Sub).
   * @param  {string}  server - The streaming server to use (optional, defaults to server-1).
   * @returns  A promise that resolves to an object containing available streaming server details (sub, dub, raw) or an error message.
   */
  async fetchServers(
    episodeId: string,
    category: ISubOrDub = 'sub',
    server: 'server-1' | 'server-2' = 'server-1',
  ): Promise<IResponse<AKserver[] | []>> {
    if (!episodeId) {
      throw new Error('Missing required parameter: episodeId');
    }

    try {
      const serverInfo = (await this.scrapefetchServers(episodeId)).data as HIServerInfo;
      if ('error' in serverInfo) {
        throw new Error((serverInfo.error as Error).message);
      }

      const mediaId = this.findServerIds(serverInfo, category, server);
      const servers: AKserver[] = [];

      const token = await this.megaup.GenerateToken(mediaId);

      const response = await this.client.get(`${this.baseUrl}/ajax/links/view?id=${mediaId}&_=${token}`, {
        headers: this.headers,
      });

      if (!response.data) {
        return {
          error: `Server responded with error:${response.statusText}` || 'Unknown error in server',
          data: [],
        };
      }

      // const decodedData = await this.megaup.DecodeIframeData(data.result); /// removed json.parse
      try {
        const decodedData = JSON.parse(await this.megaup.DecodeIframeData(response.data.result));
        servers.push({
          url: decodedData.url,
          intro: {
            start: decodedData?.skip?.intro?.[0] ?? null,
            end: decodedData?.skip?.intro?.[1] ?? null,
          },
          outro: {
            start: decodedData?.skip?.outro?.[0] ?? null,
            end: decodedData?.skip?.outro?.[1] ?? null,
          },
          download: decodedData.url.replace(/\/e\//, '/download/'),
        });
      } catch (error) {
        throw new Error((error as Error).message);
      }

      return { data: servers };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error occurred', data: [] };
    }
  }

  /**
   * **⚠️ . Very unstable
   * Fetches streaming sources for a given anime episode from a specified server and category.
   * @param {string} episodeId - The unique identifier for the episode (required).
   * @param {HISubOrDub} category  - The audio category (Subtitled or Dubbed) (optional, defaults to SubOrDub.SUB).
   * @param {string}  server - The streaming server to use (optional, defaults to server-1).
   * @returns  A promise that resolves to an object containing streaming sources, headers, sync data (AniList/MAL IDs), or an error message.
   */
  async fetchSources(
    episodeId: string,
    category: ISubOrDub = 'sub',
    server: 'server-1' | 'server-2' = 'server-1',
  ): Promise<ISourceBaseResponse<IVideoSource | null>> {
    if (!episodeId) {
      return {
        data: null,
        headers: { Referer: null },
        error: 'Missing required param: episodeId',
      };
    }

    if (episodeId.startsWith('http')) {
      const serverUrl = new URL(episodeId);
      return {
        headers: { Referer: `${serverUrl.origin}/` },
        data: {
          ...(await new MegaUp().extract(serverUrl)),
          intro: { start: null, end: null },
          outro: { start: null, end: null },
        },
      };
    }

    try {
      const servers = await this.fetchServers(episodeId, category, server);

      if ('error' in servers) {
        throw new Error(servers.error).message;
      }

      const firstServer = servers.data[0];
      const serverUrl = new URL(firstServer.url);

      const source = await this.fetchSources(serverUrl.href, category, server);

      return {
        ...source,
        data: source.data
          ? {
              ...source.data,
              intro: firstServer.intro,
              outro: firstServer.outro,
            }
          : null,
      };
    } catch (error) {
      return {
        data: null,
        headers: { Referer: null },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
export { Animekai };
