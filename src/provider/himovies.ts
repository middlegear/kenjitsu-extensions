import { BaseClass } from '../models/base-anime.js';
import * as cheerio from 'cheerio';
import type {
  IAnimePaginated,
  IHomeHIResponse,
  IMovie,
  IMovieOrTv,
  IMovieTvBase,
  IResponse,
  ITvShow,
} from '../models/types.js';

export class Himovies extends BaseClass {
  private readonly baseUrl = 'https://himovies.sx';
  constructor() {
    super();
  }

  private parseItems($: cheerio.CheerioAPI, selector: cheerio.SelectorType) {
    const items: IMovieOrTv[] = [];

    $(selector).each((_, element) => {
      const type = $(element).find('span.float-right.fdi-type').text().trim() as 'Movie' | 'TV';

      const baseData: IMovieTvBase = {
        id: $(element).find('a.film-poster-ahref.flw-item-tip').attr('href')?.slice(1).replace('/', '-') || null,
        name: $(element).find('h3.film-name').text().trim() || null,
        posterImage: $(element).find('img.film-poster-img.lazyload').attr('data-src') || null,
        quality: $(element).find('div.pick.film-poster-quality').text().trim() || null,
        type,
      };

      if (type === 'Movie') {
        items.push({
          ...baseData,
          type: 'Movie',
          releaseDate: $(element).find('div.fd-infor > span.fdi-item:first').text().trim() || null,
          duration: $(element).find('div.fd-infor > span.fdi-duration').text().trim() || null,
        } as IMovie);
      } else if (type === 'TV') {
        const seasonText = $(element).find('div.fd-infor > span.fdi-item:first').text().trim();
        const episodesText = $(element).find('div.fd-infor > span.fdi-item').eq(1).text().trim();

        let seasons: number | null = null;
        if (seasonText && seasonText.startsWith('SS')) {
          const seasonNum = parseInt(seasonText.replace(/\D+/g, ''), 10);
          seasons = Number.isNaN(seasonNum) ? null : seasonNum;
        }

        let totalEpisodes: number | null = null;
        if (episodesText && episodesText.startsWith('EPS')) {
          const episodesNum = parseInt(episodesText.replace(/\D+/g, ''), 10);
          totalEpisodes = Number.isNaN(episodesNum) ? null : episodesNum;
        }
        items.push({
          ...baseData,
          type: 'TV',
          seasons,
          totalEpisodes,
        } as ITvShow);
      }
    });

    return items;
  }
  private parseMixedSection($: cheerio.CheerioAPI, selector: cheerio.SelectorType): IMovieOrTv[] {
    const items: IMovieOrTv[] = [];

    $(selector).each((_, element) => {
      const type = $(element).find('span.float-right.fdi-type').text().trim() as 'Movie' | 'TV';

      const baseData: IMovieTvBase = {
        id: $(element).find('a.film-poster-ahref.flw-item-tip').attr('href')?.slice(1).replace('/', '-') || null,
        name: $(element).find('h3.film-name').text().trim() || null,
        posterImage: $(element).find('img.film-poster-img.lazyload').attr('data-src') || null,
        quality: $(element).find('div.pick.film-poster-quality').text().trim() || null,
        type,
      };

      if (type === 'Movie') {
        items.push({
          ...baseData,
          type: 'Movie',
          releaseDate: $(element).find('div.fd-infor > span.fdi-item:first').text().trim() || null,
          duration: $(element).find('div.fd-infor > span.fdi-duration').text().trim() || null,
        } as IMovie);
      } else if (type === 'TV') {
        const releaseDate = $(element).find('div.fd-infor > span.fdi-item:first').text().trim() || null;
        const seasonText = $(element).find('div.fd-infor > span.fdi-item').eq(1).text().trim();
        const episodesText = $(element).find('div.fd-infor > span.fdi-item').eq(2).text().trim();

        let seasons: number | null = null;
        if (seasonText && seasonText.startsWith('SS')) {
          const seasonNum = parseInt(seasonText.replace(/\D+/g, ''), 10);
          seasons = Number.isNaN(seasonNum) ? null : seasonNum;
        }

        let totalEpisodes: number | null = null;
        if (episodesText && episodesText.startsWith('EPS')) {
          const episodesNum = parseInt(episodesText.replace(/\D+/g, ''), 10);
          totalEpisodes = Number.isNaN(episodesNum) ? null : episodesNum;
        }
        items.push({
          ...baseData,
          type: 'TV',
          releaseDate,
          seasons,
          totalEpisodes,
        } as ITvShow);
      }
    });

    return items;
  }

  private parseHome($: cheerio.CheerioAPI) {
    const trendingMoviesSelector: cheerio.SelectorType = 'div.tab-content div#trending-movies div.flw-item';
    const trendingTvSelector: cheerio.SelectorType = 'div.tab-content div#trending-tv div.flw-item';

    const trending = {
      Movies: this.parseItems($, trendingMoviesSelector),
      Tv: this.parseItems($, trendingTvSelector),
    };

    const recentMoviesSelector: cheerio.SelectorType =
      'section.block_area.block_area_home.section-id-02:first div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item';
    const recentTvSelector: cheerio.SelectorType =
      'section.block_area.block_area_home.section-id-02:eq(1) div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item';

    const recentReleases = {
      Movies: this.parseItems($, recentMoviesSelector),
      Tv: this.parseItems($, recentTvSelector),
    };

    const upcomingSelector: cheerio.SelectorType =
      'section.block_area.block_area_home.section-id-02:eq(2) div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item';

    const upcoming = this.parseMixedSection($, upcomingSelector);
    return {
      trending,
      recentReleases,
      upcoming,
    };
  }

  private parsePaginatedResults($: cheerio.CheerioAPI, selector: cheerio.SelectorType) {
    const paginationElement = $('div.pre-pagination:last ul.pagination-lg.justify-content-center');

    const hasNextPage: boolean =
      ($('.pagination > li').length > 0 &&
        $('.pagination li.active').length > 0 &&
        !$('.pagination > li').last().hasClass('active')) ||
      false;
    const currentPage: number = Number($(paginationElement).find('li[class="page-item active"]').text().trim() || 1);
    const lastPage: number = Number(
      paginationElement.find('a.page-link[title="Last"]').attr('href')?.split('page=').at(-1) ||
        paginationElement.find('a.page-link:last').text().trim(),
    );
    const items: IMovieOrTv[] = [];

    $(selector).each((_, element) => {
      const type = $(element).find('span.float-right.fdi-type').text().trim() as 'Movie' | 'TV';

      const baseData: IMovieTvBase = {
        id: $(element).find('a.film-poster-ahref.flw-item-tip').attr('href')?.slice(1).replace('/', '-') || null,
        name: $(element).find('h2.film-name').text().trim() || null,
        posterImage: $(element).find('img.film-poster-img.lazyload').attr('data-src') || null,
        quality: $(element).find('div.pick.film-poster-quality').text().trim() || null,
        type,
      };

      if (type === 'Movie') {
        items.push({
          ...baseData,
          type: 'Movie',
          releaseDate: $(element).find('div.fd-infor > span.fdi-item:first').text().trim() || null,
          duration: $(element).find('div.fd-infor > span.fdi-duration').text().trim() || null,
        } as IMovie);
      } else if (type === 'TV') {
        const seasonText = $(element).find('div.fd-infor > span.fdi-item:first').text().trim() || null;
        // const seasonText = $(element).find('div.fd-infor > span.fdi-item').eq(1).text().trim();
        const episodesText = $(element).find('div.fd-infor > span.fdi-item').eq(1).text().trim();

        let seasons: number | null = null;
        if (seasonText && seasonText.startsWith('SS')) {
          const seasonNum = parseInt(seasonText.replace(/\D+/g, ''), 10);
          seasons = Number.isNaN(seasonNum) ? null : seasonNum;
        }

        let totalEpisodes: number | null = null;
        if (episodesText && episodesText.startsWith('EPS')) {
          const episodesNum = parseInt(episodesText.replace(/\D+/g, ''), 10);
          totalEpisodes = Number.isNaN(episodesNum) ? null : episodesNum;
        }
        items.push({
          ...baseData,
          type: 'TV',
          //   releaseDate,
          seasons,
          totalEpisodes,
        } as ITvShow);
      }
    });
    if (!Array.isArray(items) || items.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No results found',
        data: [],
      };
    }
    return { hasNextPage, currentPage, lastPage, data: items };
  }

  private parseSearchSuggestions($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = 'a.nav-item';

    const items: IMovieOrTv[] = [];

    $(selector).each((_, element) => {
      const type = $(element).find('div.film-infor span:last').text().trim() as 'Movie' | 'TV';
      const baseData: IMovieTvBase = {
        id: $(element).attr('href')?.slice(1).replace('/', '-') || null,
        name: $(element).find('h3.film-name').text().trim() || null,
        posterImage: $(element).find('img.film-poster-img').attr('src') || null,
        quality: $(element).find('div.pick.film-poster-quality').text().trim() || null,
        type,
      };

      if (type === 'Movie') {
        items.push({
          ...baseData,
          type: 'Movie',
          releaseDate: $(element).find('div.film-infor > span:first').text().trim() || null,
          duration: $(element).find('div.film-infor > span').eq(1).text().trim() || null,
        } as IMovie);
      } else if (type === 'TV') {
        const seasonText = $(element).find('div.film-infor > span:first').text().trim() || null;
        const episodesText = $(element).find('div.film-infor> span').eq(1).text().trim();
        let seasons: number | null = null;
        if (seasonText && seasonText.startsWith('SS')) {
          const seasonNum = parseInt(seasonText.replace(/\D+/g, ''), 10);
          seasons = Number.isNaN(seasonNum) ? null : seasonNum;
        }
        let totalEpisodes: number | null = null;
        if (episodesText && episodesText.startsWith('EPS')) {
          const episodesNum = parseInt(episodesText.replace(/\D+/g, ''), 10);
          totalEpisodes = Number.isNaN(episodesNum) ? null : episodesNum;
        }
        items.push({
          ...baseData,
          type: 'TV',
          //   releaseDate,
          seasons,
          totalEpisodes,
        } as ITvShow);
      }
    });
    return { data: items };
  }

  private async fetchPaginated(path: string, page: number): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    try {
      let url;
      /// i dont understand why fetch client isnt picking up or building the parameters but ill just hardcode it
      if (path.includes('top-imdb?type=movie')) {
        url = `${this.baseUrl}/top-imdb?type=movie&page=${page}`;
      } else if (path.includes('top-imdb?type=tv')) {
        url = `${this.baseUrl}/top-imdb?type=tv&page=${page}`;
      } else url = `${this.baseUrl}/${path}?page=${page}`;

      const response = await this.client.get(url);

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          error: response.statusText || 'Received empty response from server',
          data: [],
        };
      }

      const selector: cheerio.SelectorType = 'div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item';

      return this.parsePaginatedResults(cheerio.load(response.data), selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches curated lists from the Himovies homepage.
   * @returns Promise resolving to an object with various curated media lists
   */
  async fetchHome(): Promise<IHomeHIResponse<IMovieOrTv[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/home`);
      return this.parseHome(cheerio.load(response.data));
    } catch (error) {
      return {
        trending: {
          Movies: [],
          Tv: [],
        },
        recentReleases: {
          Movies: [],
          Tv: [],
        },
        upcoming: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
  /**
   * Searches for media based on the provided query string.
   * @param {string} query - The search query string (required).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns  A promise that resolves to an object containing an array of media titles, pagination details, or an error message.
   */
  async search(query: string, page: number): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Missing required Params : a query string',
        data: [],
      };
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/search/${this.createSlug(query)}`, {
        params: {
          page: page.toString(),
        },
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
      const selector: cheerio.SelectorType = 'div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item';
      return this.parsePaginatedResults(cheerio.load(response.data), selector);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches search suggestions for a given query string from the Himovies platform.
   * @param {string} query - The search query string (required).
   @returns A promise that resolves to an object containing an array of media titles or an error message.
   */
  async searchSuggestions(query: string): Promise<IResponse<IMovieOrTv[] | []>> {
    if (!query) {
      return {
        error: 'Missing required Params : a query string',
        data: [],
      };
    }
    const params = new URLSearchParams();
    params.append('keyword', `${query}`);

    try {
      const response = await this.client.post(`${this.baseUrl}/ajax/search`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${this.baseUrl}/home`,
          Origin: `${this.baseUrl}`,
        },
      });

      if (!response.data) {
        return {
          error: response.statusText || 'Received empty response from server',
          data: [],
        };
      }

      return this.parseSearchSuggestions(cheerio.load(response.data));
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches a paginated list of the most popular movies.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns  Promise resolving to an object  with popular movies and pagination details
   */
  async fetchPopularMovies(page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    return await this.fetchPaginated('movie', page);
  }

  /**
   * Fetches a paginated list of the most popular tv shows.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns  Promise resolving to an object  with popular tv shows and pagination details
   */
  async fetchPopularTv(page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    return await this.fetchPaginated('tv-show', page);
  }

  /**
   * Fetches a paginated list of the top rated movies.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns  Promise resolving to an object with movies and pagination details
   */
  async fetchTopMovies(page: number = 1) {
    return await this.fetchPaginated('top-imdb?type=movie', page);
  }

  /**
   * Fetches a paginated list of the top rated tv shows.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns  Promise resolving to an object with tv and pagination details
   */
  async fetchTopTv(page: number = 1) {
    return await this.fetchPaginated('top-imdb?type=tv', page);
  }
}
