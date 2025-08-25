import * as cheerio from 'cheerio';
import type {
  EpisodeInfo,
  IFeatured,
  HCharacters,
  IAnime,
  IAnimeInfo,
  ISpotlight,
  ITopAnime,
  ITrending,
  RelatedSeasons,
  ServerInfo,
  ISearchSuggestions,
} from './types.js';
import { SubOrDub } from '../../index.js';
import { zoroBaseUrl } from './hianime.js';

export function extractSearchResults($: cheerio.CheerioAPI, selector: cheerio.SelectorType) {
  const anime: IAnime[] = [];

  $(selector).each((_, element) => {
    const id = $(element)
      .find('.film-detail .film-name .dynamic-name')
      .attr('href')
      ?.slice(1)
      ?.split('?ref=search')
      .at(0)
      ?.trim();

    anime.push({
      id: id || null,
      name: $(element).find('.film-detail .film-name .dynamic-name').text().trim() || null,
      romaji: $(element).find('.film-detail .film-name .dynamic-name').attr('data-jname') || null,
      posterImage: $(element).find(' .film-poster .film-poster-img').attr('data-src') || null,
      url: `${zoroBaseUrl}${$(element).find('.film-detail .film-name .dynamic-name').attr('href')}` || null,
      duration: $(element).find('.fd-infor .fdi-item.fdi-duration').text().trim() || null,
      type: $(element).find('.fd-infor .fdi-item:nth-of-type(1)').text().trim() || null,
      rating: $(element).find('.film-poster .tick.tick-rate').text().trim() || null,
      episodes: {
        sub: Number($(element).find('.film-poster .tick .tick-sub').text()) || null,
        dub:
          Number($(element).find('.film-poster .tick .tick-dub').text()) ||
          Number($(element).find('.film-poster .tick .tick-sub').text()) ||
          null,
      },
      totalEpisodes: Number($(element).find('.film-poster .tick .tick-eps').text() || null),
    });
  });

  const paginationElement = $('.pre-pagination .pagination .page-item');

  const hasNextPage: boolean =
    ($('.pagination > li').length > 0 &&
      $('.pagination li.active').length > 0 &&
      !$('.pagination > li').last().hasClass('active')) ||
    false;
  const currentPage: number | null = Number($(paginationElement).find('.active .page-link').text().trim() || 1) || null;
  const totalPages: number | null =
    Number(paginationElement.find('a.page-link[title="Last"]').attr('href')?.split('page=').at(-1) || 1) || null;

  return {
    hasNextPage,
    currentPage,
    totalPages,
    anime,
  };
}
export function extractSearchSuggestions($: cheerio.CheerioAPI) {
  const anime: ISearchSuggestions[] = [];
  $('a.nav-item').each((_, element) => {
    const info = $(element).find('div.film-infor');
    anime.push({
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
  anime.pop();
  return { anime };
}
export function extractAnimeInfo($: cheerio.CheerioAPI) {
  const res: IAnimeInfo = {
    id: null,
    name: null,
    url: null,
    romaji: null,
    anilistId: null,
    malId: null,
    rating: null,
    quality: null,
    altnames: null,
    japanese: null,
    startDate: null,
    studios: null,
    malScore: null,
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

  res.id = section?.find('.film-buttons .btn')?.attr('href')?.split('/')?.at(-1) || null;
  res.name = $(selector)?.find('.anisc-detail .film-name.dynamic-name')?.text()?.trim() || null;
  res.japanese = $(selector).find('div.item.item-title  span.name:first').text().trim() || null;
  res.romaji = $(selector).find('h2.film-name.dynamic-name').attr('data-jname') || null;
  res.quality = $(selector).find('div.tick-item.tick-quality').text().trim() || null;
  res.rating = $(selector).find('div.tick-item.tick-pg').text().trim() || null;
  res.producers = $(selector).find('div.film-text.m-hide  a.name strong').text().trim() || null;
  res.altnames = $(selector).find('div.item.item-title  span.name:eq(1)').text().trim() || null;
  res.startDate = $(selector).find('div.item.item-title  span.name:eq(2)').text().trim() || null;
  res.status = $(selector).find('div.item.item-title  span.name:eq(5)').text().trim() || null;
  res.malScore = $(selector).find('div.item.item-title  span.name:last').text().trim() || null; /// check this though
  const { mal_id, anilist_id } = JSON.parse($('#syncData').text().trim());
  res.anilistId = Number(anilist_id) || null;
  res.malId = Number(mal_id) || null;
  res.posterImage = section?.find('.film-poster .film-poster-img')?.attr('src') || null;
  res.genres =
    $(selector)
      .find('div.item.item-list  a')
      .map((i, el) => $(el).text().trim())
      .get() || null;
  res.studios =
    $(selector)
      .find('div.item.item-title  a')
      .map((i, el) => $(el).text().trim())
      .get() || null;
  res.synopsis = section?.find('.anisc-info .text').text().trim() || null;
  res.episodes.dub = Number(section?.find('.tick .tick-item.tick-dub')?.text().trim() || null);
  res.episodes.sub = Number(section?.find('.tick .tick-item.tick-sub')?.text().trim() || null);
  res.totalEpisodes = Number(section?.find('.tick .tick-item.tick-eps')?.text().trim() || res.episodes.sub || null);
  res.type = $('span.item').last().prev().prev().text().toUpperCase().trim() || null;
  const duration = $('span.item').last().text().trim();
  res.duration = duration;
  res.url = `${zoroBaseUrl}${section?.find('.film-buttons .btn')?.attr('href')}` || null;

  const characters: HCharacters[] = [];
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

  const recomendations: IAnime[] = [];
  const recommendationsSelector: cheerio.SelectorType =
    'section.block_area.block_area_category div.tab-content div.film_list-wrap > div.flw-item';

  $(recommendationsSelector).each((_, element) => {
    recomendations.push({
      id: $(element).find('a.film-poster-ahref').attr('href')?.split('/').at(2) || null,
      url: `${zoroBaseUrl}${$(element).find('a.film-poster-ahref').attr('href')}` || null,
      name: $(element).find('a.film-poster-ahref').attr('title') || null,
      romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
      type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
      duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
      posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
      rating: $(element).find('div.tick-rate').text().trim() || null,
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

  const relatedAnime: IFeatured[] = [];
  const relatedAnimeSelector: cheerio.SelectorType =
    '#main-sidebar section.block_area.block_area_sidebar.block_area-realtime:has(h2.cat-heading:contains("Related")) div.anif-block-ul > ul.ulclear > li';

  $(relatedAnimeSelector).each((_, element) => {
    relatedAnime.push({
      id: $(element).find('h3.film-name a.dynamic-name').attr('href')?.split('/').at(1) || null,
      name: $(element).find('h3.film-name a.dynamic-name').text().trim() || null,
      romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
      url: `${zoroBaseUrl}${$(element).find('h3.film-name a.dynamic-name').attr('href')}` || null,
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

  const mostPopular: IFeatured[] = [];
  const mostPopularSelector: cheerio.SelectorType =
    '#main-sidebar section.block_area.block_area_sidebar.block_area-realtime:has(.bah-heading > h2.cat-heading:contains("Most Popular")) div.anif-block-ul > ul.ulclear > li';

  $(mostPopularSelector).each((_, element) => {
    mostPopular.push({
      id: $(element).find('h3.film-name a.dynamic-name').attr('href')?.split('/').at(1) || null,
      name: $(element).find('h3.film-name a.dynamic-name').text().trim() || null,
      romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
      url: `${zoroBaseUrl}${$(element).find('h3.film-name a.dynamic-name').attr('href')}` || null,
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
  const relatedSeasons: RelatedSeasons[] = [];
  $(relatedSeasonsSelector).each((_, element) => {
    relatedSeasons.push({
      id: $(element).find('a.os-item').attr('href')?.split('/').at(1) || null,
      name: $(element).find('a.os-item').attr('title') || null,
      season: $(element).find('div.title').text() || null,
      seasonPoster: $(element).find('div.season-poster').attr('style') || null,
    });
  });

  return { res, recomendations, mostPopular, relatedSeasons, relatedAnime, characters };
}

export function extractEpisodesList($: cheerio.CheerioAPI, selector: cheerio.SelectorType) {
  const resEpisodeList: EpisodeInfo[] = [];

  $(selector).each((_, element) => {
    resEpisodeList.push({
      episodeId: $(element)?.attr('href')?.split('/')?.at(2)?.trim()?.replace('?ep=', '-episode-') || null,
      title: $(element)?.attr('title')?.trim() || null,
      episodeNumber: Number($(element).attr('data-number')),
      href: `${zoroBaseUrl}/${$(element)?.attr('href')?.split('/')?.at(2)?.trim()}` || null,
    });
  });

  return { resEpisodeList };
}

export function extractServerData($: cheerio.CheerioAPI) {
  const servers: ServerInfo = {
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

  return { servers };
}

export function extractAnimeServerId($: cheerio.CheerioAPI, servernumber: Number, category: SubOrDub) {
  return (
    $(`.ps_-block.ps_-block-sub.servers-${category} .ps__-list .server-item`)
      ?.map((_, element) => ($(element).attr('data-server-id') == `${servernumber}` ? $(element) : null))
      ?.get()
      ?.at(0)
      ?.attr('data-id') || null
  );
}

export function extractHomePage($: cheerio.CheerioAPI) {
  const selector: cheerio.SelectorType = 'div#slider  div.deslide-item';
  const spotlight: ISpotlight[] = [];
  $(selector).each((_, element) => {
    spotlight.push({
      spotlight: $(element).find('div.deslide-item-content > div.desi-sub-text').text().trim() || null,
      id:
        $(element).find('div.deslide-item-content > div.desi-buttons > a.btn-secondary').attr('href')?.split('/').at(1) ||
        null,
      url:
        `${zoroBaseUrl}${$(element).find('div.deslide-item-content > div.desi-buttons > a.btn-secondary').attr('href')}` ||
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
              .find('div.deslide-item-content > div.sc-detail > div.scd-item > div.tick > div.tick-dub:has(.fa-microphone)')
              .text()
              .trim(),
          ) || null,
      },
      totalEpisodes:
        Number(
          $(element).find('div.deslide-item-content > div.sc-detail > div.scd-item > div.tick > div.tick-eps').text().trim(),
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

  const trending: ITrending[] = [];
  const trendingSelector: cheerio.SelectorType = 'div#anime-trending .swiper-slide';

  $(trendingSelector).each((_, element) => {
    trending.push({
      id: $(element).find('a.film-poster').attr('href')?.split('/').at(1) || null,
      // number: Number($(element).find('div.number > span').text().trim()) || null,
      name: $(element).find('div.film-title').text().trim() || null,
      romaji: $(element).find('div.film-title').attr('data-jname') || null,
      posterImage: $(element).find('a.film-poster > img.film-poster-img').attr('data-src') || null,
    });
  });

  // Featured section
  const topAiring: IFeatured[] = [];

  const topAiringSelector: cheerio.SelectorType = 'div#anime-featured .anif-block-01 li';

  $(topAiringSelector).each((_, element) => {
    topAiring.push({
      id: $(element).find('div.film-poster > a').attr('href')?.split('/').at(1) || null,
      name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
      romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
      url: `${zoroBaseUrl}${$(element).find('div.film-poster > a').attr('href')}` || null,
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
  const mostPopular: IFeatured[] = [];

  const mostPopularSelector: cheerio.SelectorType = 'div#anime-featured .anif-block-03 li';

  $(mostPopularSelector).each((_, element) => {
    mostPopular.push({
      id: $(element).find('div.film-poster > a').attr('href')?.split('/').at(1) || null,
      name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
      romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
      url: `${zoroBaseUrl}${$(element).find('div.film-poster > a').attr('href')}` || null,
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
  const favourites: IFeatured[] = [];

  const favouritesSelector: cheerio.SelectorType = 'div#anime-featured .anif-block-02:first li';

  $(favouritesSelector).each((_, element) => {
    favourites.push({
      id: $(element).find('div.film-poster > a').attr('href')?.split('/').at(1) || null,
      name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
      romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
      url: `${zoroBaseUrl}${$(element).find('div.film-poster > a').attr('href')}` || null,
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

  const recentlyCompleted: IFeatured[] = [];
  const completedSelector: cheerio.SelectorType = 'div#anime-featured .anif-block-02:last li';

  $(completedSelector).each((_, element) => {
    recentlyCompleted.push({
      id: $(element).find('div.film-poster > a').attr('href')?.split('/').at(1) || null,
      name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
      romaji: $(element).find('div.film-detail a.dynamic-name').attr('data-jname') || null,
      url: `${zoroBaseUrl}${$(element).find('div.film-poster > a').attr('href')}` || null,
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
      url: `${zoroBaseUrl}${$(element).find('div.film-poster  a.film-poster-ahref ').attr('href')}` || null,
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

  const topUpcomingSelector: cheerio.SelectorType = 'div#main-content section.block_area:last div.tab-content div.flw-item ';

  $(topUpcomingSelector).each((_, element) => {
    topUpcoming.push({
      id: $(element).find('div.film-detail  a.dynamic-name').attr('href')?.split('/').at(1) || null,
      name: $(element).find('div.film-detail  a.dynamic-name').text().trim() || null,
      romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
      type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
      duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
      posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
      url: `${zoroBaseUrl}${$(element).find('div.film-poster  a.film-poster-ahref ').attr('href')}` || null,
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
      url: `${zoroBaseUrl}${$(element).find('div.film-poster  a.film-poster-ahref ').attr('href')}` || null,
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

  const topDailyAnime: ITopAnime[] = [];
  const topWeeklyAnime: ITopAnime[] = [];
  const topMonthlyAnime: ITopAnime[] = [];

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
    spotlight,
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

export function extractTopAiring($: cheerio.CheerioAPI) {
  //
  const topAiringSelector: cheerio.SelectorType = 'div#main-content section.block_area_category div.flw-item';
  const data: IAnime[] = [];

  $(topAiringSelector).each((_, element) => {
    data.push({
      id: $(element).find('a.film-poster-ahref').attr('href')?.split('/').at(1) || null,
      name: $(element).find('a.film-poster-ahref').attr('title') || null,
      romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
      url: `${zoroBaseUrl}${$(element).find('a.film-poster-ahref').attr('href')}` || null,
      type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
      duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
      posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
      // synopsis: $(element).find('div.description').text().trim() || null,
      rating: $(element).find('div.tick-rate').text().trim() || null,
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
  const currentPage: number | null = Number($(paginationElement).find('.active .page-link').text().trim() || 1) || null;
  const totalPages: number | null =
    Number(paginationElement.find('a.page-link[title="Last"]').attr('href')?.split('page=').at(-1) || 1) || null;

  //sidebar
  const topDailyAnime: ITopAnime[] = [];
  const topWeeklyAnime: ITopAnime[] = [];
  const topMonthlyAnime: ITopAnime[] = [];

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
    totalPages,
    data,
    topAnime,
  };
}

export function extractAtoZlist($: cheerio.CheerioAPI) {
  const atozSelector: cheerio.SelectorType = 'div#main-wrapper section.block_area_category div.flw-item';

  const data: IAnime[] = [];
  $(atozSelector).each((_, element) => {
    data.push({
      id: $(element).find('a.film-poster-ahref').attr('href')?.split('/').at(1) || null,
      name: $(element).find('a.film-poster-ahref').attr('title') || null,
      romaji: $(element).find('div.film-detail  a.dynamic-name').attr('data-jname') || null,
      url: `${zoroBaseUrl}${$(element).find('a.film-poster-ahref').attr('href')}` || null,
      type: $(element).find('div.fd-infor span.fdi-item:first').text().trim() || null,
      duration: $(element).find('div.fd-infor span.fdi-duration').text().trim() || null,
      posterImage: $(element).find('div.film-poster  img.film-poster-img').attr('data-src') || null,
      // synopsis: $(element).find('div.description').text().trim() || null,
      rating: $(element).find('div.tick-rate').text().trim() || null,
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
  const currentPage: number | null = Number($(paginationElement).find('.active .page-link').text().trim() || 1) || null;
  const totalPages: number | null =
    Number(paginationElement.find('a.page-link[title="Last"]').attr('href')?.split('page=').at(-1) || 1) || null;

  return {
    hasNextPage,
    currentPage,
    totalPages,
    data,
  };
}
