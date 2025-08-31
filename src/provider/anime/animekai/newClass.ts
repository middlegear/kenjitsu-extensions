import { BaseClass } from '../../../models/base-anime.js';
import * as cheerio from 'cheerio';
import type {
  AKGenres,
  Format,
  IAHomeResponse,
  IAnime,
  IAnimeCategory,
  IAnimeInfo,
  IAnimePaginated,
  IBaseAnime,
  IRelatedSeasons,
  IResponse,
} from '../../../models/types.js';
import { AnimekaiDecoder } from '../../../source-extractors/megaup.js';

const animekaiheaders = {
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
  referer: 'https://animekai.to/',
  Cookie:
    'usertype=guest; session=hxYne0BNXguMc8zK1FHqQKXPmmoANzBBOuNPM64a; cf_clearance=WfGWV1bKGAaNySbh.yzCyuobBOtjg0ncfPwMhtsvsrs-1737611098-1.2.1.1-zWHcaytuokjFTKbCAxnSPDc_BWAeubpf9TAAVfuJ2vZuyYXByqZBXAZDl_VILwkO5NOLck8N0C4uQr4yGLbXRcZ_7jfWUvfPGayTADQLuh.SH.7bvhC7DmxrMGZ8SW.hGKEQzRJf8N7h6ZZ27GMyqOfz1zfrOiu9W30DhEtW2N7FAXUPrdolyKjCsP1AK3DqsDtYOiiPNLnu47l.zxK80XogfBRQkiGecCBaeDOJHenjn._Zgykkr.F_2bj2C3AS3A5mCpZSlWK5lqhV6jQSQLF9wKWitHye39V.6NoE3RE',
};

export class NewAnimekai extends BaseClass {
  private readonly baseUrl: string = 'https://animekai.to';
  private headers = {
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
    referer: 'https://animekai.to/',
    Cookie:
      'usertype=guest; session=hxYne0BNXguMc8zK1FHqQKXPmmoANzBBOuNPM64a; cf_clearance=WfGWV1bKGAaNySbh.yzCyuobBOtjg0ncfPwMhtsvsrs-1737611098-1.2.1.1-zWHcaytuokjFTKbCAxnSPDc_BWAeubpf9TAAVfuJ2vZuyYXByqZBXAZDl_VILwkO5NOLck8N0C4uQr4yGLbXRcZ_7jfWUvfPGayTADQLuh.SH.7bvhC7DmxrMGZ8SW.hGKEQzRJf8N7h6ZZ27GMyqOfz1zfrOiu9W30DhEtW2N7FAXUPrdolyKjCsP1AK3DqsDtYOiiPNLnu47l.zxK80XogfBRQkiGecCBaeDOJHenjn._Zgykkr.F_2bj2C3AS3A5mCpZSlWK5lqhV6jQSQLF9wKWitHye39V.6NoE3RE',
  };
  constructor() {
    super();
    this.client.setProfile('librewolf-desktop');
  }

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

  private parseHome($: cheerio.CheerioAPI): IAHomeResponse<IAnime[] | []> {
    const selector: cheerio.SelectorType = 'section#featured div.swiper-wrapper > div.swiper-slide';

    const slider: IAnime[] = [];

    $(selector).each((_, element) => {
      const style = $(element).attr('style');
      const match = style?.match(/url\((['"]?)(.*?)\1\)/);
      const url = match ? match[2] : null;
      slider.push({
        id: $(element).find('div.swiper-ctrl > a').attr('href')?.split('/').at(2) || null,
        name: $(element).find('div.detail > p.title').text().trim() || null,
        romaji: $(element).find('div.detail > p.title').attr('data-jp') || null,
        posterImage: url || null,
        type: $(element).find('.info > span > b').text().trim() || null,
        synopsis: $(element).find('p.desc').text().trim() || null,
        quality: $(element).find('div.mics span:last').text().trim() || null,
        startDate: $(element).find('div.mics span:eq(1)').text().trim() || null,
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
      data: slider,
      trending,
      recentlyUpdated,
      recentlyAdded,
      upcoming,
      recentlyCompleted,
    };
  }

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
      lastPage,
      totalResults,
      data: results,
    };
  }
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
      startDate: $('.detail > div > div:contains("Date aired")').text().replace('Date aired:', '').trim() || null,
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
   * Fetches curated lists from the Animekai homepage.
   * @returns Promise resolving to an object with various curated anime lists
   */
  async fetchHome(): Promise<IAHomeResponse<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/home`);
      if (!response.data) {
        return {
          data: [],
          trending: { now: [], daily: [], weekly: [], monthly: [] },
          recentlyUpdated: [],
          upcoming: [],
          recentlyCompleted: [],
          recentlyAdded: [],
          error: response.statusText || 'server returned an empty response',
        };
      }

      return this.parseHome(cheerio.load(response.data));
    } catch (error) {
      return {
        data: [],
        trending: { now: [], daily: [], weekly: [], monthly: [] },
        recentlyUpdated: [],
        upcoming: [],
        recentlyCompleted: [],
        recentlyAdded: [],
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
          lastPage: 0,
          error: response.statusText || 'Received empty response from server',
          data: [],
        };
      }

      const data$ = cheerio.load(response.data);
      const selector: cheerio.SelectorType = 'div.aitem-wrapper.regular  div.aitem';

      return this.parsePaginated(data$, selector);
    } catch (error) {
      return {
        data: [],
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
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
   * Fetches a paginated list of recently added anime.
   * @param {Format} category - The format which to fetch anime (optional,  defaults to TV)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with recently added anime and pagination details
   */

  async fetchRecentlyAdded(category: Format, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
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
   * Fetches a paginated list of recently added anime.
   * @param {Format} category - The format which to fetch anime (optional,  defaults to TV)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with top airing anime and pagination details
   */

  async fetchTopAiring(category: Format = 'TV', page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
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
   * Fetches a paginated list of recently updated anime.
   * @param {Format} category - The format which to fetch anime (optional,  defaults to TV)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with recently updated anime and pagination details
   */

  async fetchRecentlyUpdated(category: Format = 'TV', page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
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
      //                                                   browser?keyword=&type[]=tv&status[]=completed&sort=updated_date
      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
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
   * @param {Format} category - The format which to fetch anime (optional,  defaults to TV)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with recently completed anime and pagination details
   */

  async fetchRecentlyCompleted(category: Format = 'TV', page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
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
      //                                                   browser?keyword=&type[]=tv&status[]=completed&sort=updated_date
      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
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
   * Fetches a paginated list of genre curated anime.
   * @param {AKGenre} genre - The genre which to fetch anime (required)
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with anime curated by genre and pagination details
   */

  async fetchGenres(genre: AKGenres, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/genres/${genre}`, { params: { page: String(page) } });

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
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

  async getAnimeInfo(animeId: string) {
    if (!animeId.trim()) {
      return {
        error: 'Missing required Params: animeId',
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

      const ani_id = rateBox.dataId as string; ///required to generate token which fetches episodes list

      const tokenInstance = new AnimekaiDecoder();
      const token = await tokenInstance.GenerateToken(ani_id);
      console.log(token);

      const episodesList = await this.client.get(`${this.baseUrl}/ajax/episodes/list?ani_id=${ani_id}&_=${token}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          ...this.headers,
        },
      });
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
    } catch (error) {
      return {
        data: null,
        providerEpisodes: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
