import * as cheerio from 'cheerio';
import {
  HIMovieCountryCode,
  HIMovieGenres,
  HIMoviesCountryID,
  HIMoviesGenreID,
  type IAnimePaginated,
  type IHomeHIResponse,
  type IMovie,
  type IMovieEpisodes,
  type IMovieInfo,
  type IMovieInfoResponse,
  type IMovieOrTv,
  type IMovieServers,
  type IMovieTvBase,
  type IResponse,
  type ITvShow,
  type IVideoSource,
  type IVideoSourceResponse,
} from '../../models/types.js';
import VideoStream from '../../source-extractors/videostream.js';
import { BaseClass } from '../../models/base-anime.js';

/**
 * A scraper and API wrapper for the unofficial HiMovies website,
 * providing methods to fetch and parse movies, TV shows, and related data.
 *
 *
 */
export class HiMovies extends BaseClass {
  private readonly baseUrl: string;
  constructor(baseUrl: string = 'https://himovies.sx') {
    super();
    this.baseUrl = baseUrl;
  }
  /**
   * Parses movie/TV show items from a Cheerio selection for standard item lists.
   *
   * @private
   * @param $ - Cheerio API instance
   * @param selector - CSS selector for the items to parse
   * @returns Array of parsed movie or TV show objects
   */

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

  /**
   * Parses mixed movie/TV show items from a Cheerio selection for upcoming content sections.
   *
   * @private
   * @param $ - Cheerio API instance
   * @param selector - CSS selector for the mixed items to parse
   * @returns Array of parsed movie or TV show objects with additional release date information
   */

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
  /**
   * Parses the complete homepage structure from HIMovies including, trending, recent releases, and upcoming content.
   *
   * @private
   * @param $ - Cheerio API instance containing homepage HTML
   * @returns Complete homepage data structure with all sections parsed
   */

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

  /**
   * Parses paginated results from  search, category, or filter pages.
   *
   * @private
   * @param $ - Cheerio API instance containing paginated HTML content
   * @param selector - CSS selector for the media items in the paginated results
   * @returns Paginated results object with media items and pagination metadata
   */

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
        paginationElement.find('a.page-link:last').text().trim() ||
        currentPage,
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

  /**
   * Parses search suggestions from AJAX autocomplete response.
   *
   * @private
   * @param $ - Cheerio API instance containing search suggestions HTML
   * @returns Response object containing parsed search suggestion items
   */
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

  /**
   * Parses the recommended section from individual media info pages.
   *
   * @private
   * @param $ - Cheerio API instance containing media info page HTML
   * @returns Array of recommended movie or TV show items
   */

  private parseInfoRecommendedSection($: cheerio.CheerioAPI): IMovieOrTv[] {
    const items: IMovieOrTv[] = [];
    const selector: cheerio.SelectorType = 'div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item';
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
          seasons,
          totalEpisodes,
        } as ITvShow);
      }
    });

    return items;
  }

  /**
   * Parses detailed media information from media detail pages.
   *
   * @private
   * @param $ - Cheerio API instance containing media info page HTML
   * @returns Media information object with detailed metadata and recommendations
   */

  private parseInfo($: cheerio.CheerioAPI) {
    const recommended = this.parseInfoRecommendedSection($);
    const id = $('h2.heading-name > a').attr('href')?.slice(1).replace('/', '-') || null;
    let type;
    type = id?.includes('tv') ? (type = 'TV' as 'TV') : ('Movie' as 'Movie');

    const mediaInfo: IMovieInfo = {
      id: id,
      name: $('h2.heading-name > a').text().trim() || null,
      posterImage: $('div.film-poster.mb-2 > img.film-poster-img').attr('src') || null,
      type: type || null,
      quality: $('span.item.mr-1 > button.btn.btn-sm.btn-quality > strong').text().trim() || null,
      releaseDate: $('.row-line:has(strong:contains("Released:"))').text().replace('Released:', '').trim() || null,
      genre:
        $('.row-line:has(strong:contains("Genre:")) a')
          .map((i, el) => $(el).text().split('&'))
          .get()
          .map(v => v.trim()) || null,

      casts:
        $('.row-line:has(strong:contains("Casts:")) a')
          .map((i, el) => $(el).text().trim())
          .get() || null,
      duration:
        $('.row-line:has(strong:contains("Duration:"))').text().replace('Duration:', '').replace(/\s+/g, ' ').trim() || null,
      score: Number($('span.item.mr-2 > button.btn.btn-sm.btn-imdb').text().replace('IMDB:', '').trim()) || null,
      country:
        $('.row-line:has(strong:contains("Country:")) a')
          .map((i, el) => $(el).text().trim())
          .get() || null,

      production:
        $('.row-line:has(strong:contains("Production:"))')
          .text()
          .replace('Production:', '')
          .replace(/\s+/g, ' ')
          .split(',')
          .map(v => v.trim())
          .filter(Boolean) || null,

      trailer: $('iframe#iframe-trailer').attr('data-src') || null,
      synopsis: $('.description').text().trim() || null,
    };

    return { data: mediaInfo, recommended };
  }

  /**
   * Parses available seasons from TV show season dropdown.
   *
   * @private
   * @param $ - Cheerio API instance containing season dropdown HTML
   * @returns Array of season objects with season IDs and numbers
   */

  private parseSeasons($: cheerio.CheerioAPI) {
    return $('.dropdown-menu > a')
      .map((_, el) => {
        const seasonId = $(el).attr('data-id')!;
        const label = $(el).text().trim();
        const seasonNumber = parseInt(label.replace(/\D/g, ''), 10) || 1;
        return { seasonId, seasonNumber };
      })
      .get();
  }
  /**
   * Constructs AJAX URLs for different endpoints for episode and server data.
   *
   * @private
   * @param id - The media or season identifier
   * @param kind - The type of AJAX request ('movie-server', 'tv-server', 'tv', 'season')
   * @returns Complete AJAX URL for the specified endpoint type
   */

  private buildAjaxUrl(id: string, kind: 'movie-server' | 'tv-server' | 'tv' | 'season'): string {
    switch (kind) {
      case 'movie-server':
        return `${this.baseUrl}/ajax/episode/list/${id}`;
      case 'tv-server':
        return `${this.baseUrl}/ajax/episode/servers/${id}`;
      case 'tv':
        return `${this.baseUrl}/ajax/season/episodes/${id}`; // fetch episodes per season
      case 'season':
        return `${this.baseUrl}/ajax/season/list/${id}`; ///fetches season list
    }
  }

  /**
   * Parses episode information from season episodes AJAX response.
   *
   * @private
   * @param $ - Cheerio API instance containing season episodes HTML
   * @param seasonNumber - The season number these episodes belong to
   * @param media - The media identifier for constructing episode IDs
   * @returns Array of parsed episode objects with titles and numbering
   */
  private parseEpisodes($: cheerio.CheerioAPI, seasonNumber: number, media: string) {
    return $('.nav > li')
      .map((_, el) => {
        const anchor = $(el).find('a');
        const rawId = anchor.attr('id')!;
        const title = anchor.attr('title')!;
        const episodeTitle = title.split(':').at(1)?.trim() || null;
        return {
          episodeId: `${media.replace('watch-', '')}-episode-${rawId.split('-')[1]}` || null,
          title: episodeTitle,
          episodeNumber: parseInt(title.split(':')[0].slice(3).trim(), 10) || null,
          seasonNumber: seasonNumber || null,
        };
      })
      .get();
  }

  /**
   * Parses available streaming servers from  server list AJAX response.
   *
   * @private
   * @param $ - Cheerio API instance containing server list HTML
   * @returns Array of server objects with server IDs and names
   */
  private parseServers($: cheerio.CheerioAPI) {
    const servers: IMovieServers[] = [];
    $('ul.nav > li.nav-item').each((_, element) => {
      servers.push({
        serverId: $(element).find('a').attr('data-id') || null,
        serverName: $(element).find('a').text().trim().toLowerCase() || null,
      });
    });
    return servers;
  }

  /**
   * Finds the server ID for a specific server name from the available servers list.
   *
   * @private
   * @param servers - Array of available server objects
   * @param server - The target server name to find ('upcloud', 'megacloud', or 'akcloud')
   * @returns The server ID for the specified server
   * @throws Error if the specified server is not available
   */
  private findServerId(servers: IMovieServers[], server: 'upcloud' | 'megacloud' | 'akcloud'): string {
    const availableServers = servers.map(s => s.serverName || 'unknown');
    const serverIndex = servers.findIndex(s => (s.serverName || '').toLowerCase() === server.toLowerCase());

    if (serverIndex === -1) {
      throw new Error(
        `Server '${server}' not found '. ` + `Try one of the available servers: ${availableServers.join(', ')}.`,
      );
    }

    return servers[serverIndex].serverId as string;
  }

  /**
   * Fetches paginated content for various categories, filters, and search endpoints.
   *
   * @private
   * @param path - The URL path, filter string, or category identifier
   * @param page - The page number for pagination
   * @returns Promise resolving to paginated media results with error handling
   */
  private async fetchPaginated(path: string, page: number): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    try {
      let url;

      if (path.includes('top-imdb?type=movie')) {
        url = `${this.baseUrl}/top-imdb?type=movie&page=${page}`;
      } else if (path.includes('top-imdb?type=tv')) {
        url = `${this.baseUrl}/top-imdb?type=tv&page=${page}`;
      } else if (path.includes('release_year')) {
        url = `${this.baseUrl}/filter?type=${path}&page=${page}`;
      } else url = `${this.baseUrl}/${path}?page=${page}`;

      const response = await this.client.get(url);

      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          data: [],
          error: response.statusText || 'Received empty response from server',
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
   * Fetches curated lists from the HiMovies homepage including , trending content, recent releases, and upcoming media.
   *
   * @returns Promise resolving to complete homepage data structure with all curated sections
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
  async search(query: string, page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        error: 'Missing required Params : a query string',
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
          data: [],
          error: response.statusText || 'Received empty response from server',
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
   * Performs an advanced search with filters.
   * @param {'all' | 'movie' | 'tv'} [type] - The media type filter (required).
   * @param {'all' | 'HD' | 'SD' | 'CAM'} [quality] - The quality filter (required).
   * @param {HIMoviesGenreID} [genre] - Genre filter (default ='all').
   * @param {HIMoviesCountryID} [country] - Country filter (default ='all').
   * @param {number} [page=1] - Page number for pagination (default ='all').
   * @returns  Paginated filtered search results
   */
  async advancedSearch(
    type: 'all' | 'movie' | 'tv',
    quality: 'all' | 'HD' | 'SD' | 'CAM',
    genre: string = 'all',
    country: string = 'all',
    page: number = 1,
  ): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    const genreIdValue = this.getMappedValue(genre, HIMoviesGenreID);
    const countryIdValue = this.getMappedValue(country, HIMoviesCountryID);
    const url = `${type}&quality=${quality}&release_year=all&genre=${genreIdValue}&country=${countryIdValue}`;

    return await this.fetchPaginated(url, page);
  }

  /**
   * Fetches search suggestions for a query string.
   * @param {string} query - The search query string (required).
   * @returns {Promise<IResponse<IMovieOrTv[] | []>>} Search suggestions for autocomplete
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
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  /**
   * Fetches a paginated list of the most popular movies.
   * @param {number} [page=1] - Page number for pagination (default: 1).
   * @returns {Promise<IAnimePaginated<IMovieOrTv[] | []>>} Paginated popular movies
   */
  async fetchPopularMovies(page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    return await this.fetchPaginated('movie', page);
  }

  /**
   * Fetches a paginated list of the most popular TV shows.
   * @param {number} [page=1] - Page number for pagination (default: 1).
   * @returns {Promise<IAnimePaginated<IMovieOrTv[] | []>>} Paginated popular TV shows
   */
  async fetchPopularTv(page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    return await this.fetchPaginated('tv-show', page);
  }

  /**
   * Fetches a paginated list of top rated movies.
   * @param {number} [page=1] - Page number for pagination (default: 1).
   * @returns {Promise<IAnimePaginated<IMovieOrTv[] | []>>} Paginated top-rated movies
   */
  async fetchTopMovies(page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    return await this.fetchPaginated('top-imdb?type=movie', page);
  }

  /**
   * Fetches a paginated list of top rated TV shows.
   * @param {number} [page=1] - Page number for pagination (default: 1).
   * @returns {Promise<IAnimePaginated<IMovieOrTv[] | []>>} Paginated top-rated TV shows
   */
  async fetchTopTv(page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    return await this.fetchPaginated('top-imdb?type=tv', page);
  }
  /**
   * Fetches a paginated list of upcoming media to be added.
   * @param {number} [page=1] - Page number for pagination (default: 1).
   * @returns {Promise<IAnimePaginated<IMovieOrTv[] | []>>} Paginated media
   */
  async fetchUpcoming(page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    return await this.fetchPaginated('coming-soon', page);
  }

  /**
   * Fetches media by genre.
   * @param {string} genre - The genre to filter by.
   * @param {number} [page=1] - Page number for pagination (default: 1).
   * @returns {Promise<IAnimePaginated<IMovieOrTv[] | []>>} Paginated media by genre
   */
  async fetchGenre(genre: string, page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    const value = this.getMappedValue(genre, HIMovieGenres);

    return await this.fetchPaginated(`/genre/${value}`, page);
  }

  /**
   * Fetches media by country.
   * @param {string} country - The country code to filter by.
   * @param {number} [page=1] - Page number for pagination (default: 1).
   * @returns {Promise<IAnimePaginated<IMovieOrTv[] | []>>} Paginated media by country
   */
  async fetchByCountry(country: string, page: number = 1): Promise<IAnimePaginated<IMovieOrTv[] | []>> {
    const value = this.getMappedValue(country, HIMovieCountryCode);

    return await this.fetchPaginated(`/country/${value}`, page);
  }

  /**
   * Fetches detailed information about a specific movie or TV show.
   * @param {string} mediaId - The unique identifier for the movie or TV show (required).
   * @returns { Promise<IMovieInfoResponse<IMovieInfo | null>>} A promise that resolves to an object containing detailed media information, recommendations, including episodes for TV shows.
   */
  async fetchMediaInfo(mediaId: string): Promise<IMovieInfoResponse<IMovieInfo | null>> {
    if (!mediaId) {
      return { error: 'missing required params: mediaId', data: null, providerEpisodes: [], recommended: [] };
    }
    try {
      const media = mediaId.replace('-', '/');
      const response = await this.client.get(`${this.baseUrl}/${media}`);
      if (!response.data) {
        return {
          error: response.statusText || 'Received empty response from server',
          data: null,
          providerEpisodes: [],
          recommended: [],
        };
      }

      const { data, recommended } = this.parseInfo(cheerio.load(response.data));

      let episodes: IMovieEpisodes[] = [];

      const importantId = media.split('-').at(-1) as string;

      if (data.type === 'TV') {
        const seasonsres = await this.client.get(`${this.buildAjaxUrl(importantId, 'season')}`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Referer: `${this.baseUrl}/${media}`,
          },
        });
        if (!seasonsres.data) {
          return {
            error: seasonsres.statusText || 'Received empty response from server',
            data: null,
            providerEpisodes: [],
            recommended: [],
          };
        }
        const seasons = this.parseSeasons(cheerio.load(seasonsres.data));
        for (const { seasonId, seasonNumber } of seasons) {
          const seasonEpisodes = await this.client.get(`${this.buildAjaxUrl(seasonId, 'tv')}`, {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              Referer: `${this.baseUrl}/${media}`,
            },
          });
          if (!seasonEpisodes.data) {
            return {
              data: null,
              providerEpisodes: [],
              recommended: [],
              error: seasonEpisodes.statusText || 'Received empty response from server',
            };
          }
          const episodeslist = this.parseEpisodes(cheerio.load(seasonEpisodes.data), seasonNumber, mediaId);
          episodes.push(...episodeslist);
        }
      } else {
        episodes = [
          {
            episodeId: mediaId.replace('watch-', ''),
            title: data.name,
            episodeNumber: 1,
            seasonNumber: 0,
          },
        ];
      }

      return { data: data, providerEpisodes: episodes, recommended };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        recommended: [],
        providerEpisodes: [],
      };
    }
  }

  /**
   * Fetches available server information for a specific episodeId.
   * @param {string} episodeId - The unique identifier for the episode/movie (required). Found in the episodes array.
   * @returns  A promise that resolves to an object containing server information for the episode.
   */
  async fetchServers(episodeId: string): Promise<IResponse<IMovieServers[] | []>> {
    if (!episodeId) {
      return { error: 'Missing required params episodeId!', data: [] };
    }

    try {
      let servers: IMovieServers[] = [];
      if (episodeId && episodeId.includes('movie')) {
        const mediaId = episodeId.split('-').at(-1) as string;

        const response = await this.client.get(`${this.buildAjaxUrl(mediaId, 'movie-server')}`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Referer: `${this.baseUrl}/watch-${episodeId.replace('-', '/')}`,
          },
        });

        if (!response.data) {
          return { error: response.statusText, data: [] };
        }
        const server = this.parseServers(cheerio.load(response.data));
        servers.push(...server);
      } else {
        const mediaId = episodeId.split('-episode-');

        const response = await this.client.get(`${this.buildAjaxUrl(String(mediaId.at(1)), 'tv-server')}`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Referer: `${this.baseUrl}/watch-${episodeId.replace('-', '/')}`,
          },
        });
        if (!response.data) {
          return { error: response.statusText, data: [] };
        }
        const server = this.parseServers(cheerio.load(response.data));
        servers.push(...server);
      }

      return { data: servers };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', data: [] };
    }
  }
  /**
   * Fetches streaming sources for a selected media episode from a specified server.
   * @param {string} episodeId - The unique identifier for the episode/movie (required). Found in the episodes array
   * @param {IMovieStreamingServers} [server] - The server to use (optional, defaults to Megacloud). Note: Upcloud is CORS protected (Error 403). Use a proxy or switch to Megacloud or Akcloud(🤷) .
   * @returns {Promise<IVideoSourceResponse<IVideoSource | null>>} A promise that resolves to an object containing streaming sources for the media.
   */
  async fetchSources(
    episodeId: string,
    server: 'upcloud' | 'megacloud' | 'akcloud' = 'megacloud',
  ): Promise<IVideoSourceResponse<IVideoSource | null>> {
    if (episodeId.startsWith('episode')) {
      throw new Error('This format is not requred and you are gay if you see this.Visit the docs: https://docs.hakai.men/');
    }

    if (episodeId.includes('https')) {
      const serverUrl = new URL(episodeId);

      switch (server) {
        case 'akcloud':
        case 'megacloud':
        case 'upcloud':
          return {
            headers: { Referer: `${serverUrl.origin}/` },
            data: await new VideoStream().extract(serverUrl, `${this.baseUrl}/`),
          };
        default:
          return {
            headers: { Referer: `${serverUrl.origin}/` },
            data: await new VideoStream().extract(serverUrl, `${this.baseUrl}/`),
          };
      }
    }
    try {
      const servers = await this.fetchServers(episodeId);
      const serverId = this.findServerId(servers.data, server);

      if ('error' in servers) {
        throw new Error(servers.error);
      }

      let referer: string;

      episodeId && episodeId.includes('movie')
        ? (referer = `${this.baseUrl}/${episodeId.replace('-', '/')}`)
        : (referer = `${this.baseUrl}/${episodeId.split('-episode-').at(0)?.replace('-', '/')}`);

      const embed = await this.client.get(`${this.baseUrl}/ajax/episode/sources/${serverId}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${referer}.${serverId}`,
        },
      });
      if (!embed.data) {
        return {
          error: embed.statusText || 'Unknown error',
          data: null,
          headers: {
            Referer: null,
          },
        };
      }
      return await this.fetchSources(embed.data.link, server);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        headers: {
          Referer: null,
        },
      };
    }
  }
}
