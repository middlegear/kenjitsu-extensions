import * as cheerio from 'cheerio';
import { BaseClass } from '../../models/base-anime.js';
import type { ISubOrDub, HiAnimeServers, IAnimeCategory } from '../../models/types.js';
import MegaCloud from '../../source-extractors/megacloud.js';
import {
  type IAnime,
  type IAnimePaginated,
  type ISearchSuggestions,
  type IResponse,
  type IAnimeInfo,
  type ICharacters,
  type IRelatedSeasons,
  type IPromotionVIds,
  type IAnimeInfoResponse,
  type IBaseAnime,
  type IHomeResponse,
  type IRepetitiveSections,
  HIGenres,
  type IEpisodes,
  type HIServerInfo,
  type HISourceResponse,
  type IVideoSource,
} from '../../models/types.js';

/**
 * A class for interacting with the HiAnime platform (hianime.to) to search for anime, fetch detailed information,
 * retrieve episode lists, get available streaming servers, and fetch curated anime lists.
 */
export class HiAnime extends BaseClass {
  private readonly baseUrl: string = 'https://hianime.to';

  constructor() {
    super();
  }

  /**
   * Parses paginated anime search results from a Cheerio instance.
   * Extracts anime details and pagination information from the provided HTML selector.
   * @param $ CheerioAPI instance
   * @param selector CSS selector for anime items
   * @returns An object containing anime list and pagination details
   */
  private parsePaginatedResults($: cheerio.CheerioAPI, selector: cheerio.SelectorType): IAnimePaginated<IAnime[] | []> {
    const anime: IAnime[] = [];
    $(selector).each((_, element) => {
      anime.push({
        id:
          $(element).find('a.film-poster-ahref').attr('href')?.split('/').at(2) ||
          $(element).find('a.film-poster-ahref').attr('href')?.split('/').at(1) ||
          null,
        name: $(element).find('.film-detail .film-name .dynamic-name').text().trim() || null,
        romaji: $(element).find('.film-detail .film-name .dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find(' .film-poster .film-poster-img').attr('data-src') || null,
        duration: $(element).find('.fd-infor .fdi-item.fdi-duration').text().trim() || null,
        type: $(element).find('.fd-infor .fdi-item:nth-of-type(1)').text().trim() || null,
        episodes: {
          sub: Number($(element).find('.film-poster .tick .tick-sub').text()) || null,
          dub: Number($(element).find('.film-poster .tick .tick-dub').text()) || null,
        },
        totalEpisodes: Number(
          $(element).find('.film-poster .tick .tick-eps').text() ||
            Number($(element).find('.film-poster .tick .tick-sub').text()) ||
            null,
        ),
      });
    });

    const paginationElement = $('.pre-pagination .pagination .page-item');

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
    if (!Array.isArray(anime) || anime.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        error: 'Cheerio Error: No results found',
      };
    }
    return {
      hasNextPage,
      currentPage,
      lastPage,
      data: anime,
    };
  }

  /**
   * Parses search suggestion results from a Cheerio instance.
   * Extracts anime suggestion details from the provided HTML.
   * @param $ CheerioAPI instance
   * @returns An array containing an array of search suggestions
   */
  private parseSearchSuggestions($: cheerio.CheerioAPI): IResponse<ISearchSuggestions[]> {
    const animeSuggestions: ISearchSuggestions[] = [];
    $('a.nav-item').each((_, element) => {
      const info = $(element).find('div.film-infor');
      animeSuggestions.push({
        id: $(element).attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.srp-detail h3.film-name').text().trim() || null,
        romaji: $(element).find('div.srp-detail h3.film-name').attr('data-jname') || null,
        posterImage: $(element).find('img.film-poster-img').attr('data-src') || null,
        releaseDate: $(element).find('div.film-infor > span:first').text().trim() || null,
        type:
          info
            .contents()
            .filter(function () {
              return this.nodeType === 3 && this.nodeValue.trim() !== '';
            })
            .eq(0)
            .text()
            .trim() || null,
        duration: $(element).find('div.film-infor > span:last').text().trim() || null,
      });
    });
    animeSuggestions.pop();
    if (!Array.isArray(animeSuggestions) || animeSuggestions.length === 0) {
      return {
        error: 'Cheerio Error: No search results found',
        data: [],
      };
    }
    return { data: animeSuggestions };
  }

  /**
   * Parses detailed anime information from a Cheerio instance.
   * Extracts anime details, characters, recommendations, related anime, seasons, and promotion videos.
   * @param $ CheerioAPI instance
   * @returns Object containing anime details and related data
   */
  private parseAnimeInfo($: cheerio.CheerioAPI): IAnimeInfoResponse<IAnimeInfo | null> {
    const animeInfo: IAnimeInfo = {
      id: null,
      name: null,
      romaji: null,
      anilistId: null,
      malId: null,
      rating: null,
      quality: null,
      altnames: null,
      japanese: null,
      releaseDate: null,
      studios: null,
      score: null,
      producers: null,
      status: null,
      genres: null,
      posterImage: null,
      duration: null,
      type: null,
      synopsis: null,
      episodes: {
        sub: null,
        dub: null,
      },
      totalEpisodes: null,
    };
    const selector: cheerio.SelectorType = '.ani_detail-stage .anis-content ';
    const section = $(selector);

    animeInfo.id = section?.find('.film-buttons .btn')?.attr('href')?.split('/')?.at(-1) || null;
    animeInfo.name = $(selector)?.find('.anisc-detail .film-name.dynamic-name')?.text()?.trim() || null;
    animeInfo.japanese = $(selector).find('div.item.item-title  span.name:first').text().trim() || null;
    animeInfo.romaji = $(selector).find('h2.film-name.dynamic-name').attr('data-jname') || null;
    animeInfo.quality = $(selector).find('div.tick-item.tick-quality').text().trim() || null;
    animeInfo.rating = $(selector).find('div.tick-item.tick-pg').text().trim() || null;
    animeInfo.producers = $(selector).find('div.film-text.m-hide  a.name strong').text().trim() || null;
    animeInfo.altnames = $(selector).find('div.item.item-title  span.name:eq(1)').text().trim() || null;
    animeInfo.releaseDate = $(selector).find('div.item.item-title  span.name:eq(2)').text().trim() || null;
    animeInfo.status = $(selector).find('div.item.item-title  span.name:eq(5)').text().trim() || null;
    animeInfo.score = $(selector).find('div.item.item-title  span.name:last').text().trim() || null;
    const { mal_id, anilist_id } = JSON.parse($('#syncData').text().trim());
    animeInfo.anilistId = Number(anilist_id) || null;
    animeInfo.malId = Number(mal_id) || null;
    animeInfo.posterImage = section?.find('.film-poster .film-poster-img')?.attr('src') || null;
    animeInfo.genres =
      $(selector)
        .find('div.item.item-list  a')
        .map((i, el) => $(el).text().trim())
        .get() || null;
    animeInfo.studios =
      $(selector)
        .find('div.item.item-title  a')
        .map((i, el) => $(el).text().trim())
        .get() || null;
    animeInfo.synopsis = section?.find('.anisc-info .text').text().trim() || null;
    animeInfo.episodes.dub = Number(section?.find('.tick .tick-item.tick-dub')?.text().trim() || null);
    animeInfo.episodes.sub = Number(section?.find('.tick .tick-item.tick-sub')?.text().trim() || null);
    animeInfo.totalEpisodes = Number(
      section?.find('.tick .tick-item.tick-eps')?.text().trim() || animeInfo.episodes.sub || null,
    );
    animeInfo.type = $('span.item').last().prev().prev().text().toUpperCase().trim() || null;
    const duration = $('span.item').last().text().trim();
    animeInfo.duration = duration;

    const characters: ICharacters[] = [];
    const charactersSelector = 'div.block-actors-content > div.bac-list-wrap > div.bac-item';

    $(charactersSelector).each((_, element) => {
      const charInfo = $(element).find('div.per-info.ltr');
      const vaInfo = $(element).find('div.per-info.rtl');

      characters.push({
        id: charInfo.find('a').attr('href')?.split('/').at(2) || null,
        name: charInfo.find('h4.pi-name a').text().trim() || null,
        posterImage: charInfo.find('a img').attr('data-src') || null,
        role: charInfo.find('span.pi-cast').text().trim() || null,
        voiceActor: vaInfo.length
          ? {
              id: vaInfo.find('a').attr('href')?.split('/').at(2) || null,
              name: vaInfo.find('h4.pi-name a').text().trim() || null,
              posterImage: vaInfo.find('a img').attr('data-src') || null,
              language: vaInfo.find('span.pi-cast').text().trim() || null,
            }
          : null,
      });
    });

    const recommendedAnime: IAnime[] = [];
    const recommendationsSelector: cheerio.SelectorType =
      'section.block_area.block_area_category div.tab-content div.film_list-wrap > div.flw-item';

    $(recommendationsSelector).each((_, element) => {
      recommendedAnime.push({
        id: $(element).find('a.film-poster-ahref').attr('href')?.split('/').at(2) || null,
        name: $(element).find('a.film-poster-ahref').attr('title') || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
        duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const relatedAnime: IAnime[] = [];
    const relatedAnimeSelector: cheerio.SelectorType =
      '#main-sidebar section.block_area.block_area_sidebar.block_area-realtime:has(h2.cat-heading:contains("Related")) div.anif-block-ul > ul.ulclear > li';

    $(relatedAnimeSelector).each((_, element) => {
      relatedAnime.push({
        id: $(element).find('h3.film-name a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('h3.film-name a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
        type:
          $(element)
            .find('div.fd-infor.mt-2 > div.tick')
            .contents()
            .filter(function () {
              return this.type === 'text';
            })
            .text()
            .trim() || null,

        posterImage: $(element).find('div.film-poster img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const mostPopular: IAnime[] = [];
    const mostPopularSelector: cheerio.SelectorType =
      '#main-sidebar section.block_area.block_area_sidebar.block_area-realtime:has(.bah-heading > h2.cat-heading:contains("Most Popular")) div.anif-block-ul > ul.ulclear > li';

    $(mostPopularSelector).each((_, element) => {
      mostPopular.push({
        id: $(element).find('h3.film-name a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('h3.film-name a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
        type:
          $(element)
            .find('div.fd-infor.mt-2 > div.tick')
            .contents()
            .filter(function () {
              return this.type === 'text';
            })
            .text()
            .trim() || null,
        posterImage: $(element).find('div.film-poster img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });
    const relatedSeasonsSelector: cheerio.SelectorType =
      'div.container > div#main-content > section.block_area.block_area-seasons div.os-list';
    const relatedSeasons: IRelatedSeasons[] = [];
    $(relatedSeasonsSelector).each((_, element) => {
      relatedSeasons.push({
        id: $(element).find('a.os-item').attr('href')?.split('/').at(1) || null,
        name: $(element).find('a.os-item').attr('title') || null,
        season: $(element).find('div.title').text() || null,
        seasonPoster: (() => {
          const style = $(element).find('div.season-poster').attr('style') || null;
          return style ? style.match(/url\(["']?(.*?)["']?\)/)?.[1] || null : null;
        })(),
      });
    });

    const promotionVideos: IPromotionVIds[] = [];
    const promotionVideosSelector = 'section.block_area.block_area-promotions  div.item';
    $(promotionVideosSelector).each((_, element) => {
      promotionVideos.push({
        url: $(element).attr('data-src') || null,
        title: $(element).find('div.screen-item-info > h3.sii-title').text().trim() || null,
        thumbnail: $(element).find('a.screen-item-thumbnail img.sit-img').attr('src') || null,
      });
    });
    return {
      data: animeInfo,
      relatedSeasons: relatedSeasons,
      recommendedAnime: recommendedAnime,
      mostPopular: mostPopular,
      promotionVideos: promotionVideos,
      relatedAnime: relatedAnime,
      characters: characters,
    };
  }

  /**
   * Parses the HiAnime homepage data from a Cheerio instance.
   * Extracts spotlight, trending, top airing, most popular, favorites, recently completed, recently added, recently updated, and top anime rankings.
   * @param $ CheerioAPI instance
   * @returns An object containing various curated anime lists
   */
  private parseHome($: cheerio.CheerioAPI): IHomeResponse<IAnime[] | []> {
    const selector: cheerio.SelectorType = 'div#slider  div.deslide-item';
    const data: IAnime[] = [];
    $(selector).each((_, element) => {
      data.push({
        spotlight: $(element).find('div.deslide-item-content > div.desi-sub-text').text().trim() || null,
        id:
          $(element).find('div.deslide-item-content > div.desi-buttons > a.btn-secondary').attr('href')?.split('/').at(1) ||
          null,

        name: $(element).find('div.deslide-item-content > div.desi-head-title').text().trim() || null,
        romaji: $(element).find('div.deslide-item-content > div.desi-head-title').attr('data-jname') || null,
        type:
          $(element).find('div.deslide-item-content > div.sc-detail > div.scd-item:has(.fa-play-circle)').text().trim() ||
          null,
        duration:
          $(element).find('div.deslide-item-content > div.sc-detail > div.scd-item:has(.fa-clock)').text().trim() || null,
        releaseDate:
          $(element).find('div.deslide-item-content > div.sc-detail > div.scd-item:has(.fa-calendar)').text().trim() || null,
        quality:
          $(element).find('div.deslide-item-content > div.sc-detail > div.scd-item:has(.quality)').text().trim() || null,
        synopsis: $(element).find('div.deslide-item-content > div.desi-description').text().trim() || null,
        posterImage: $(element).find('div.deslide-cover-img > img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub:
            Number(
              $(element)
                .find(
                  'div.deslide-item-content > div.sc-detail > div.scd-item > div.tick > div.tick-sub:has(.fa-closed-captioning)',
                )
                .text()
                .trim(),
            ) || null,
          dub:
            Number(
              $(element)
                .find(
                  'div.deslide-item-content > div.sc-detail > div.scd-item > div.tick > div.tick-dub:has(.fa-microphone)',
                )
                .text()
                .trim(),
            ) || null,
        },
        totalEpisodes:
          Number(
            $(element)
              .find('div.deslide-item-content > div.sc-detail > div.scd-item > div.tick > div.tick-eps')
              .text()
              .trim(),
          ) ||
          Number(
            $(element)
              .find(
                'div.deslide-item-content > div.sc-detail > div.scd-item > div.tick > div.tick-sub:has(.fa-closed-captioning)',
              )
              .text()
              .trim(),
          ) ||
          null,
      });
    });

    const trending: IBaseAnime[] = [];
    const trendingSelector: cheerio.SelectorType = 'div#anime-trending .swiper-slide';

    $(trendingSelector).each((_, element) => {
      trending.push({
        id: $(element).find('a.film-poster').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-title').text().trim() || null,
        romaji: $(element).find('div.film-title').attr('data-jname') || null,
        posterImage: $(element).find('a.film-poster > img.film-poster-img').attr('data-src') || null,
      });
    });

    const topAiring: IAnime[] = [];
    const topAiringSelector: cheerio.SelectorType = 'div#anime-featured .anif-block-01 li';

    $(topAiringSelector).each((_, element) => {
      topAiring.push({
        id: $(element).find('div.film-poster > a').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        type: $(element).find(' div.tick span.fdi-item').text().trim() || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const mostPopular: IAnime[] = [];
    const mostPopularSelector: cheerio.SelectorType = 'div#anime-featured .anif-block-03 li';

    $(mostPopularSelector).each((_, element) => {
      mostPopular.push({
        id: $(element).find('div.film-poster > a').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        type: $(element).find(' div.tick span.fdi-item').text().trim() || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const favourites: IAnime[] = [];
    const favouritesSelector: cheerio.SelectorType = 'div#anime-featured .anif-block-02:first li';

    $(favouritesSelector).each((_, element) => {
      favourites.push({
        id: $(element).find('div.film-poster > a').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        type: $(element).find(' div.tick span.fdi-item').text().trim() || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const recentlyCompleted: IAnime[] = [];
    const completedSelector: cheerio.SelectorType = 'div#anime-featured .anif-block-02:last li';

    $(completedSelector).each((_, element) => {
      recentlyCompleted.push({
        id: $(element).find('div.film-poster > a').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        type: $(element).find(' div.tick span.fdi-item').text().trim() || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const recentlyUpdated: IAnime[] = [];
    const recentlyUpdatedSelector: cheerio.SelectorType =
      'div#main-content section.block_area:first div.tab-content div.flw-item ';

    $(recentlyUpdatedSelector).each((_, element) => {
      recentlyUpdated.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
        duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const topUpcoming: IAnime[] = [];
    const topUpcomingSelector: cheerio.SelectorType =
      'div#main-content section.block_area:last div.tab-content div.flw-item ';

    $(topUpcomingSelector).each((_, element) => {
      topUpcoming.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
        duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const recentlyAdded: IAnime[] = [];
    const recentlyAddedSelector: cheerio.SelectorType =
      'div#main-content section.block_area:eq(1) div.tab-content div.flw-item ';

    $(recentlyAddedSelector).each((_, element) => {
      recentlyAdded.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
        duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const topDailyAnime: IAnime[] = [];
    const topWeeklyAnime: IAnime[] = [];
    const topMonthlyAnime: IAnime[] = [];

    const topDailySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-day li';
    const topWeeklySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-week li';
    const topMonthlySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-month li';

    $(topDailySelector).each((_, element) => {
      topDailyAnime.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });
    $(topWeeklySelector).each((_, element) => {
      topWeeklyAnime.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });
    $(topMonthlySelector).each((_, element) => {
      topMonthlyAnime.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const topAnime = {
      daily: topDailyAnime,
      weekly: topWeeklyAnime,
      monthly: topMonthlyAnime,
    };

    return {
      data,
      trending,
      topAiring,
      mostPopular,
      favourites,
      recentlyCompleted,
      topAnime,
      recentlyUpdated,
      recentlyAdded,
    };
  }

  /**
   * Parses paginated sections like top airing, most popular, etc., from a Cheerio instance.
   * Extracts anime details, pagination information, and top anime rankings.
   * @param $ CheerioAPI instance
   * @returns RepetitiveSections containing anime list, pagination details, and top anime rankings
   */
  private parsePaginatedSections($: cheerio.CheerioAPI): IRepetitiveSections<IAnime[] | []> {
    const topAiringSelector: cheerio.SelectorType = 'div#main-content section.block_area_category div.flw-item';
    const data: IAnime[] = [];

    $(topAiringSelector).each((_, element) => {
      data.push({
        id: $(element).find('a.film-poster-ahref').attr('href')?.split('/').at(1) || null,
        name: $(element).find('a.film-poster-ahref').attr('title') || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
        duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });
    const paginationElement = $('.pre-pagination .pagination .page-item');

    const hasNextPage: boolean =
      ($('.pagination > li').length > 0 &&
        $('.pagination li.active').length > 0 &&
        !$('.pagination > li').last().hasClass('active')) ||
      false;
    const currentPage: number = Number($(paginationElement).find('.active .page-link').text().trim() || 1);
    const lastPage: number = Number(
      paginationElement.find('a.page-link[title="Last"]').attr('href')?.split('page=').at(-1) || 1,
    );

    const topDailyAnime: IAnime[] = [];
    const topWeeklyAnime: IAnime[] = [];
    const topMonthlyAnime: IAnime[] = [];

    const topDailySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-day li';
    const topWeeklySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-week li';
    const topMonthlySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-month li';

    $(topDailySelector).each((_, element) => {
      topDailyAnime.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });
    $(topWeeklySelector).each((_, element) => {
      topWeeklyAnime.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });
    $(topMonthlySelector).each((_, element) => {
      topMonthlyAnime.push({
        id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
        romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
        posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub: Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) || null,
        },
        totalEpisodes:
          Number($(element).find('div.tick > div.tick-eps').text().trim()) ||
          Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
          null,
      });
    });

    const topAnime = {
      daily: topDailyAnime,
      weekly: topWeeklyAnime,
      monthly: topMonthlyAnime,
    };

    return {
      hasNextPage,
      currentPage,
      lastPage,
      data,
      topAnime,
    };
  }

  /**
   * Parses episode data for an anime from a Cheerio instance.
   * Extracts episode IDs, titles, and numbers from the provided HTML.
   * @param $ CheerioAPI instance
   * @returns Response containing an array of episode information
   */
  private parseEpisodes($: cheerio.CheerioAPI): IResponse<IEpisodes[] | []> {
    const episodesList: IEpisodes[] = [];
    const selector: cheerio.SelectorType = '.detail-infor-content .ss-list a';
    $(selector).each((_, element) => {
      episodesList.push({
        episodeId: $(element)?.attr('href')?.split('/')?.at(2)?.trim()?.replace('?ep=', '-episode-') || null,
        title: $(element)?.attr('title')?.trim() || null,
        romaji: $(element).find('div.ep-name.e-dynamic-name').attr('data-jname') || null,
        episodeNumber: Number($(element).attr('data-number')),
      });
    });
    if (!Array.isArray(episodesList) || episodesList.length === 0) {
      return {
        error: 'Scraper Error: No episodes found',
        data: [],
      };
    }

    return { data: episodesList };
  }

  /**
   * Parses streaming server data for an episode from a Cheerio instance.
   * Extracts sub, dub, and raw server details along with episode number.
   * @param $ CheerioAPI instance
   * @returns Response containing server information
   */
  private parseServerData($: cheerio.CheerioAPI): IResponse<HIServerInfo | null> {
    const servers: HIServerInfo = {
      sub: [],
      dub: [],
      raw: [],
      episodeNumber: 0,
    };
    const subSelector: cheerio.SelectorType = '.ps_-block.ps_-block-sub.servers-sub .ps__-list .server-item';
    const dubSelector: cheerio.SelectorType = '.ps_-block.ps_-block-sub.servers-dub .ps__-list .server-item';
    const rawSelector: cheerio.SelectorType = '.ps_-block.ps_-block-sub.servers-raw .ps__-list .server-item';
    const episodeNo = $('.content .server-notice')?.find('b')?.text().split(' ').pop();
    servers.episodeNumber = Number(episodeNo) || null;
    $(subSelector).each((_, element) => {
      servers.sub.push({
        serverId: Number($(element)?.attr('data-server-id') || null),
        mediaId: Number($(element).attr('data-id') || null),
        serverName: $(element).find('.btn').text().trim().toLowerCase() || null,
      });
    });
    $(dubSelector).each((_, element) => {
      servers.dub.push({
        serverId: Number($(element)?.attr('data-server-id') || null),
        mediaId: Number($(element).attr('data-id') || null),
        serverName: $(element)?.find('.btn')?.text().trim().toLowerCase() || null,
      });
    });
    $(rawSelector).each((_, element) => {
      servers.raw.push({
        serverId: Number($(element)?.attr('data-server-id') || null),
        mediaId: Number($(element).attr('data-id') || null),
        serverName: $(element).find('.btn').text().trim().toLowerCase() || null,
      });
    });

    if (servers.sub.length === 0 && servers.dub.length === 0 && servers.raw.length === 0) {
      throw new Error('No server data received. Use a different category');
    }
    return { data: servers };
  }
  /**
   * Finds the server ID for a given category and server name from the server data.
   * @param servers Server information containing sub, dub, and raw server lists
   * @param category Sub or dub category
   * @param server Server name to find
   * @returns The media ID of the matching server
   * @throws Error if the category or server is not found
   */
  private findServerId(servers: HIServerInfo, category: ISubOrDub, server: HiAnimeServers): number {
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

    return servers[category][serverIndex].mediaId as number;
  }

  /**
   * Searches for anime based on the provided query string.
   * @param {string} query - The search query string (required).
   * @param {number} [page=1] - The page number for pagination (optional, defaults to 1).
   * @returns { Promise<IAnimePaginated<IAnime[] | []>>} A promise that resolves to an object containing an array of anime titles, pagination details, or an error message.
   */
  async search(query: string, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        error: 'Missing required Params : a query string',
      };
    }

    query = query.trim();
    try {
      const response = await this.client.get(`${this.baseUrl}/search`, {
        params: {
          keyword: query,
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
      const $ = cheerio.load(response.data);
      const searchSelector: cheerio.SelectorType = '.block_area-content .film_list-wrap .flw-item';
      return this.parsePaginatedResults($, searchSelector);
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
   * Fetches search suggestions for a given query string from the HiAnime platform.
   * @param {string} query - The search query string (required).
   @returns {Promise<IResponse<ISearchSuggestions[] | []>>} A promise that resolves to an object containing an array of anime titles or an error message.
   */
  async searchSuggestions(query: string): Promise<IResponse<ISearchSuggestions[] | []>> {
    if (!query) {
      return {
        data: [],
        error: 'Missing required Params : a query string',
      };
    }

    query = query.trim();
    try {
      const response = await this.client.get(`${this.baseUrl}/ajax/search/suggest`, {
        params: { keyword: query },
      });
      if (!response.data) {
        return {
          error: response.statusText || 'Received empty response from server',
          data: [],
        };
      }
      const data$ = cheerio.load(response.data.html);
      return this.parseSearchSuggestions(data$);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  /**
   * Fetches detailed information about a specific anime.
   * @param {string} animeId - The unique identifier for the anime (e.g., "bleach-806") (required).
   * @returns {Promise<IAnimeInfoResponse<IAnimeInfo | null>>} A promise that resolves to an object containing anime details, related seasons, characters, recommendations, or an error message.
   */
  async fetchAnimeInfo(animeId: string): Promise<IAnimeInfoResponse<IAnimeInfo | null>> {
    if (!animeId.trim())
      return {
        data: null,
        error: 'Missing required params :animeId',
        recommendedAnime: [],
        promotionVideos: [],
        mostPopular: [],
        relatedAnime: [],
        relatedSeasons: [],
        characters: [],
      };

    try {
      const response = await this.client.get(`${this.baseUrl}/${animeId}`);

      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
          recommendedAnime: [],
          promotionVideos: [],
          mostPopular: [],
          relatedAnime: [],
          relatedSeasons: [],
          characters: [],
        };

      const $animeData = cheerio.load(response.data);

      return this.parseAnimeInfo($animeData);
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Fatal error',
        recommendedAnime: [],
        promotionVideos: [],
        mostPopular: [],
        relatedAnime: [],
        relatedSeasons: [],
        characters: [],
      };
    }
  }

  /**
   * Fetches curated lists from the HiAnime homepage.
   * @returns Promise resolving to an object with various curated anime lists
   */
  async fetchHome(): Promise<IHomeResponse<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/home`, {
        headers: {
          Referer: this.baseUrl,
        },
      });
      if (!response.data) {
        return {
          error: response.statusText || 'Received empty response from server',
          data: [],
          trending: [],
          topAiring: [],
          mostPopular: [],
          favourites: [],
          recentlyCompleted: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
          recentlyAdded: [],
          recentlyUpdated: [],
        };
      }
      const data$: cheerio.CheerioAPI = cheerio.load(response.data);
      return this.parseHome(data$);
    } catch (error) {
      return {
        data: [],
        trending: [],
        topAiring: [],
        mostPopular: [],
        favourites: [],
        recentlyCompleted: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        recentlyAdded: [],
        recentlyUpdated: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches a paginated list of top airing anime.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with top airing anime and pagination details
   */
  async fetchTopAiring(page: number = 1): Promise<IRepetitiveSections<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/top-airing`, {
        params: {
          page: String(page) || '1',
        },
      });
      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
          error: response.statusText || 'Received empty response from server',
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches a paginated list of the most favorited anime.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object  with favorited anime and pagination details
   */
  async fetchMostFavourites(page: number = 1): Promise<IRepetitiveSections<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/most-favorite`, {
        params: {
          page: String(page) || '1',
        },
      });
      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
          error: response.statusText || 'Received empty response from server',
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches a paginated list of the most popular anime.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object  with popular anime and pagination details
   */
  async fetchMostPopular(page: number = 1): Promise<IRepetitiveSections<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/most-popular`, {
        params: {
          page: String(page) || '1',
        },
      });
      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
          error: response.statusText || 'Received empty response from server',
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches a paginated list of recently completed anime.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object  with recently completed anime and pagination details
   */
  async fetchRecentlyCompleted(page: number = 1): Promise<IRepetitiveSections<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/completed`, {
        params: {
          page: String(page) || '1',
        },
      });
      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,

          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
          error: response.statusText || 'Received empty response from server',
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches a paginated list of recently added anime.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object with recently added anime and pagination details
   */
  async fetchRecentlyAdded(page: number = 1): Promise<IRepetitiveSections<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/recently-added`, {
        params: {
          page: String(page) || '1',
        },
      });
      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
          error: response.statusText || 'Received empty response from server',
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches a paginated list of recently updated anime.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns { Promise<IRepetitiveSections<IAnime[] | []>>} Promise resolving to an object  with recently updated anime and pagination details
   */
  async fetchRecentlyUpdated(page: number = 1): Promise<IRepetitiveSections<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/recently-updated`, {
        params: {
          page: String(page) || '1',
        },
      });
      if (!response.data) {
        return {
          hasNextPage: false,
          currentPage: 0,
          lastPage: 0,
          topAnime: { daily: [], weekly: [], monthly: [] },
          data: [],
          error: response.statusText || 'Received empty response from server',
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        topAnime: { daily: [], weekly: [], monthly: [] },
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches a list of anime titles sorted alphabetically, optionally filtered by a starting character.
   * @param {any} sort Optional letter (A-Z) or "0-9" to filter anime
   * @param {number} page - Page number for pagination (default: 1)
   *@returns {  Promise<IAnimePaginated<IAnime[] | []>>} Promise resolving to an object  with alphabetically sorted anime and pagination details
   */
  async fetchAtoZList(sort?: any, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    const sortValue = (sort ?? '').toString().trim();

    const sortCategory = !sortValue
      ? undefined
      : !Number.isNaN(Number(sortValue))
        ? '0-9'
        : sortValue.length === 1
          ? sortValue.toUpperCase()
          : 'other';

    const url = sortCategory ? `${this.baseUrl}/az-list/${sortCategory}` : `${this.baseUrl}/az-list`;

    try {
      const response = await this.client.get(url, {
        params: {
          page: String(page),
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

      const data$ = cheerio.load(response.data);
      const selector: cheerio.SelectorType = 'div#main-wrapper section.block_area_category div.flw-item';
      return this.parsePaginatedResults(data$, selector);
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
   * Fetches a list of anime by genre.
   * @param {string} genre -The genre to filter anime by
   * @param {number} page - Page number for pagination (default: 1)
   * @returns {  Promise<IAnimePaginated<IAnime[] | []>>} Promise resolving to an object with genre-specific anime and pagination details
   */
  async fetchGenre(genre: string, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    if (!genre) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Missing required Params : Genre',
        data: [],
      };
    }
    const Igenre = this.getMappedValue(genre, HIGenres);
    try {
      const response = await this.client.get(`${this.baseUrl}/genre/${Igenre}`, {
        params: {
          page: String(page),
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

      const data$ = cheerio.load(response.data);
      const selector: cheerio.SelectorType = 'div#main-wrapper section.block_area_category div.flw-item';
      return this.parsePaginatedResults(data$, selector);
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
   * Fetches a list of subbed anime.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns {  Promise<IAnimePaginated<IAnime[] | []>>} Promise resolving to an object with subbed anime and pagination details
   */
  async fetchSubbedAnime(page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/subbed-anime`, {
        params: {
          page: String(page),
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

      const data$ = cheerio.load(response.data);
      const selector: cheerio.SelectorType = 'div#main-wrapper section.block_area_category div.flw-item';
      return this.parsePaginatedResults(data$, selector);
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
   * Fetches a list of dubbed anime.
   * @param {number} page - Page number for pagination (default: 1)
   * @returns {  Promise<IAnimePaginated<IAnime[] | []>>} Promise resolving to an object with dubbed anime and pagination details
   */
  async fetchDubbedAnime(page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    try {
      const response = await this.client.get(`${this.baseUrl}/dubbed-anime`, {
        params: {
          page: String(page),
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

      const data$ = cheerio.load(response.data);
      const selector: cheerio.SelectorType = 'div#main-wrapper section.block_area_category div.flw-item';
      return this.parsePaginatedResults(data$, selector);
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
      const selector: cheerio.SelectorType = 'div#main-wrapper section.block_area_category div.flw-item';

      return this.parsePaginatedResults(data$, selector);
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
   * Fetches episode data for a specific anime.
   * @param {string} animeId - The unique identifier for the anime (e.g., "bleach-806") (required).
   * @returns {Promise<IResponse<IEpisodes[] | []>>} A promise that resolves to an object containing an array of episode information or an error message.
   */
  async fetchEpisodes(animeId: string): Promise<IResponse<IEpisodes[] | []>> {
    if (!animeId)
      return {
        data: [],
        error: 'Missing required params :animeId',
      };
    try {
      const response = await this.client.get(`${this.baseUrl}/ajax/v2/episode/list/${animeId.split('-').pop()}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${this.baseUrl}/watch/${animeId}`,
        },
      });

      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
        };

      const $episodes = cheerio.load(response.data.html);
      return this.parseEpisodes($episodes);
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Contact dev if you see this',
      };
    }
  }

  /**
   * Fetches available streaming servers for a specific anime episode.
   * @param {string} episodeId - The unique identifier for the episode  (required).
   * @returns { Promise<IResponse<HIServerInfo | null>>} A promise that resolves to an object containing available streaming server details (sub, dub, raw) or an error message.
   */
  async fetchServers(episodeId: string): Promise<IResponse<HIServerInfo | null>> {
    if (!episodeId || episodeId.includes('ep=')) {
      if (episodeId.includes('ep=')) {
        return {
          data: null,
          error: "Invalid format! Please use the '-episode-' format instead of ?ep=.",
        };
      }
      return {
        data: null,
        error: 'Missing required params: valid episodeId!',
      };
    }
    try {
      const newId = episodeId.split('-').pop()?.trim() as string;

      const response = await this.client.get(`${this.baseUrl}/ajax/v2/episode/servers`, {
        params: {
          episodeId: newId,
        },
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${this.baseUrl}/watch/?ep=${newId}`,
        },
      });
      if (!response.data)
        return {
          error: response.statusText || 'Server returned an empty response',
          data: null,
        };

      const servers$: cheerio.CheerioAPI = cheerio.load(response.data.html);
      return this.parseServerData(servers$);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Internal Server Error',
        data: null,
      };
    }
  }

  /**
   * Fetches streaming sources for a given anime episode from a specified server and category.
   * @param {string} episodeId - The unique identifier for the episode (required).
   * @param {HiAnimeServers}  server - The streaming server to use (optional, defaults to hd-2). Note: hd-1 may return a 403 error due to CORS restrictions; use a proxy or switch to hd-2 or hd-3
   * @param {HISubOrDub} category  - The audio category (Subtitled or Dubbed) (optional, defaults to SubOrDub.SUB).
   * @returns {Promise<HISourceResponse<IVideoSource | null>>} A promise that resolves to an object containing streaming sources, headers, sync data (AniList/MAL IDs), or an error message.
   */

  async fetchSources(
    episodeId: string,
    server: HiAnimeServers = 'hd-2',
    category: ISubOrDub = 'sub',
  ): Promise<HISourceResponse<IVideoSource | null>> {
    if (!episodeId || episodeId.includes('ep=') || episodeId.includes('$')) {
      if (episodeId.includes('ep=') || episodeId.includes('$')) {
        return {
          data: null,
          headers: { Referer: null },
          error: "Invalid format! Please use the ' - episode - ' format instead of ?ep=.",
          syncData: { anilistId: null, malId: null, name: null },
        };
      }
      return {
        data: null,
        headers: { Referer: null },
        error: 'Missing required params: valid episodeId!',
        syncData: { anilistId: null, malId: null, name: null },
      };
    }

    if (episodeId.startsWith('http')) {
      const serverUrl = new URL(episodeId);
      switch (server) {
        case 'hd-1':
        case 'hd-2':
        case 'hd-3':
          return {
            headers: { Referer: `${serverUrl.origin}/` },
            data: await new MegaCloud().extract(serverUrl, `${this.baseUrl}/`),
            syncData: { anilistId: null, malId: null, name: null },
          };
        default:
          return {
            headers: { Referer: `${serverUrl.origin}/` },
            data: await new MegaCloud().extract(serverUrl, `${this.baseUrl}/`),
            syncData: { anilistId: null, malId: null, name: null },
          };
      }
    }

    try {
      const fetchedServers = (await this.fetchServers(episodeId)).data as HIServerInfo;
      if ('error' in fetchedServers) {
        return {
          data: null,
          headers: { Referer: null },
          error: fetchedServers.error as string,
          syncData: { anilistId: null, malId: null, name: null },
        };
      }

      const serverId = this.findServerId(fetchedServers, category, server);
      const newId = episodeId.split('-').pop() as string;

      const sourcesReq = this.client.get(`${this.baseUrl}/ajax/v2/episode/sources`, {
        params: { id: String(serverId) },
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${this.baseUrl}/watch/?ep=${newId}`,
        },
      });

      const newepisodeId = episodeId.replace(/-episode-\d+$/, '?ep=');
      const baseId = episodeId.replace(/-episode-\d+$/, '');

      const syncDataReq = this.client.get(`${this.baseUrl}/watch/${newepisodeId}`, {
        headers: { Referer: `${this.baseUrl}/${baseId}` },
      });

      const [sourcesResult, syncResult] = await Promise.allSettled([sourcesReq, syncDataReq]);

      if (sourcesResult.status === 'rejected') {
        return {
          error: sourcesResult.reason,
          data: null,
          headers: { Referer: null },
          syncData: { anilistId: null, malId: null, name: null },
        };
      }

      const response = sourcesResult.value;
      if (!response.data) {
        return {
          error: response.statusText,
          data: null,
          headers: { Referer: null },
          syncData: { anilistId: null, malId: null, name: null },
        };
      }

      let syncData: { anilistId: string | null; malId: string | null; name: string | null } = {
        anilistId: null,
        malId: null,
        name: null,
      };
      if (syncResult.status === 'fulfilled') {
        const match = syncResult.value.data.match(/<script id="syncData" type="application\/json">([\s\S]*?)<\/script>/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            syncData = {
              anilistId: parsed.anilist_id || null,
              malId: parsed.mal_id || null,
              name: parsed.name || null,
            };
          } catch {
            // Ignore parse error, return default syncData with nulls
          }
        }
      }

      return {
        ...(await this.fetchSources(response.data.link, server, category)),
        syncData,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Fatal Error',
        data: null,
        headers: { Referer: null },
        syncData: { anilistId: null, malId: null, name: null },
      };
    }
  }
}
