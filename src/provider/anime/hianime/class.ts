import { BaseAnime } from '../../../models/base-anime.js';
import * as cheerio from 'cheerio';
import type {
  IAnime,
  IAnimePaginated,
  ISearchSuggestions,
  IResponse,
  IAnimeInfo,
  ICharacters,
  IRelatedSeasons,
  IPromotionVIds,
  IAnimeInfoResponse,
  IBaseAnime,
  IHomeResponse,
  IRepetitiveSections,
  HIGenres,
  IEpisodes,
  HIServerInfo,
} from '../../../models/types.js';

export class zoro extends BaseAnime {
  private readonly baseUrl: string = 'https://hianime.to';

  constructor() {
    super();
  }

  private parsePaginatedResults($: cheerio.CheerioAPI, selector: cheerio.SelectorType): IAnimePaginated<IAnime[] | []> {
    const anime: IAnime[] = [];
    $(selector).each((_, element) => {
      // const id = $(element)
      //   .find('.film-detail .film-name .dynamic-name')
      //   .attr('href')
      //   ?.slice(1)
      //   ?.split('?ref=search')
      //   .at(0)
      //   ?.trim();

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
    const currentPage: number = Number($(paginationElement).find('.active .page-link').text().trim() || 1);
    const lastPage: number = Number(
      paginationElement.find('a.page-link[title="Last"]').attr('href')?.split('page=').at(-1) || 1,
    );
    if (!Array.isArray(anime) || anime.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No results found',
        data: [],
      };
    }
    return {
      hasNextPage,
      currentPage,
      lastPage,
      data: anime,
    };
  }

  private parseSearchSuggestions($: cheerio.CheerioAPI): IResponse<ISearchSuggestions[]> {
    const animeSuggestions: ISearchSuggestions[] = [];
    $('a.nav-item').each((_, element) => {
      const info = $(element).find('div.film-infor');
      animeSuggestions.push({
        id: $(element).attr('href')?.split('/').at(1) || null,
        name: $(element).find('div.srp-detail h3.film-name').text().trim() || null,
        romaji: $(element).find('div.srp-detail h3.film-name').attr('data-jname') || null,
        posterImage: $(element).find('img.film-poster-img').attr('data-src') || null,
        startDate: $(element).find('div.film-infor > span:first').text().trim() || null,
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
      startDate: null,
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
    animeInfo.startDate = $(selector).find('div.item.item-title  span.name:eq(2)').text().trim() || null;
    animeInfo.status = $(selector).find('div.item.item-title  span.name:eq(5)').text().trim() || null;
    animeInfo.score = $(selector).find('div.item.item-title  span.name:last').text().trim() || null; /// check this though
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
              return this.type === 'text'; // only direct text node like "TV", "Movie", etc.
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
          dub:
            Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) ||
            Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
            null,
        },
        totalEpisodes: Number($(element).find('div.tick > div.tick-eps').text().trim()) || null,
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
        seasonPoster: $(element).find('div.season-poster').attr('style') || null,
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
        startDate:
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
          null ||
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

    // Featured section
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
          dub:
            Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) ||
            Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
            null,
        },
        totalEpisodes: Number($(element).find('div.tick > div.tick-eps').text().trim()) || null,
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
        // number: Number($(element).find('div.film-number span').text().trim()) || null,
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
        // synopsis: $(element).find('div.description').text().trim() || null,
        // rating: $(element).find('div.tick-rate').text().trim() || null,
        episodes: {
          sub: Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) || null,
          dub:
            Number($(element).find('div.tick > div.tick-dub:has(.fa-microphone)').text().trim()) ||
            Number($(element).find('div.tick > div.tick-sub:has(.fa-closed-captioning)').text().trim()) ||
            null,
        },
        totalEpisodes: Number($(element).find('div.tick > div.tick-eps').text().trim()) || null,
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

    //sidebar
    const topDailyAnime: IAnime[] = [];
    const topWeeklyAnime: IAnime[] = [];
    const topMonthlyAnime: IAnime[] = [];

    const topDailySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-day li';
    const topWeeklySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-week li';
    const topMonthlySelector: cheerio.SelectorType = 'div#main-sidebar div#top-viewed-month li';

    $(topDailySelector).each((_, element) => {
      topDailyAnime.push({
        // number: Number($(element).find('div.film-number span').text().trim()) || null,
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
        // number: Number($(element).find('div.film-number span').text().trim()) || null,
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
        // number: Number($(element).find('div.film-number span').text().trim()) || null,
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

  private parseEpisodes($: cheerio.CheerioAPI): IResponse<IEpisodes[] | []> {
    const episodesList: IEpisodes[] = [];
    const selector: cheerio.SelectorType = '.detail-infor-content .ss-list a';
    $(selector).each((_, element) => {
      episodesList.push({
        episodeId: $(element)?.attr('href')?.split('/')?.at(2)?.trim()?.replace('?ep=', '-episode-') || null,
        title: $(element)?.attr('title')?.trim() || null,
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
   *
   * @param query
   * @param page
   * @returns
   */
  async search(query: string, page: number = 1): Promise<IAnimePaginated<IAnime[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Missing required Params : a query string',
        data: [],
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
          error: response.statusText || 'Received empty response from server',
          data: [],
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
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  /**
   *
   * @param query
   * @returns
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
        headers: { Accept: '*/*', Referer: `${this.baseUrl}/home` },
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
   *
   * @param animeId
   * @returns
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
   *
   * @returns
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
   *
   * @param page
   * @returns
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
          error: response.statusText || 'Received empty response from server',
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
  /**
   *
   * @param page
   * @returns
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
          error: response.statusText || 'Received empty response from server',
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   *
   * @param page
   * @returns
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
          error: response.statusText || 'Received empty response from server',
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   *
   * @param page
   * @returns
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
          error: response.statusText || 'Received empty response from server',
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   *
   * @param page
   * @returns
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
          error: response.statusText || 'Received empty response from server',
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   *
   * @param page
   * @returns
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
          error: response.statusText || 'Received empty response from server',
          data: [],
          topAnime: { daily: [], weekly: [], monthly: [] },
        };
      }

      const data$ = cheerio.load(response.data);
      return this.parsePaginatedSections(data$);
    } catch (error) {
      return {
        data: [],
        topAnime: { daily: [], weekly: [], monthly: [] },
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
  /**
   *
   * @param sort
   * @returns
   */
  async fetchAtoZList(sort?: any): Promise<IAnimePaginated<IAnime[] | []>> {
    //
    const sortValue = String(sort ?? '').trim();

    const sortCategory = !sortValue
      ? undefined
      : !Number.isNaN(Number(sortValue))
        ? '0-9'
        : sortValue.length === 1
          ? sortValue.toUpperCase()
          : 'other';

    const url = sortCategory ? `${this.baseUrl}/az-list/${sortCategory}` : `${this.baseUrl}/az-list`;

    try {
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

      const data$ = cheerio.load(response.data);
      const selector: cheerio.SelectorType = 'div#main-wrapper section.block_area_category div.flw-item';
      return this.parsePaginatedResults(data$, selector);
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
   *
   * @param genre
   * @returns
   */
  async fetchGenre(genre: HIGenres): Promise<IAnimePaginated<IAnime[] | []>> {
    if (!genre) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Missing required Params : Genre',
        data: [],
      };
    }
    try {
      const response = await this.client.get(`${this.baseUrl}/genre/${genre}`);
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
        data: [],
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   *
   * @param animeId
   * @returns
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
}
