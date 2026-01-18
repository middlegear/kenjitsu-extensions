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

import type { IResponse } from '../../types/base.js';

export class AkiH extends BaseClass {
  constructor(baseUrl: string = 'https://aki-h.com') {
    super();
    this.baseUrl = baseUrl;
  }
  private baseUrl: string;

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

    return { data };
  }

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
  async fetchAnimeInfo(id: string): Promise<IAKiInfoResponse<IAKiInfo | null>> {
    if (!id) {
      return { error: 'Missing required params, animeid', data: null, providerEpisodes: [] };
    }
    try {
      const url = `${this.baseUrl}/${id}/`;

      const response = await this.client.get(`${this.baseUrl}/${id}/`, {
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
}

// <script type="text/javascript">window.displayvideo(0, 39801);</script> after the watch url with the episodeId

///  the number is then requests to below
// https://aki-h.com/video/39801/ contains an iframe that leads to this https://v.aki-h.com/v/39801'

//  <script type="text/javascript">
//           var vid = 'ek4aeNDoX3';
//           var web_uri = 'https://v.aki-h.com/';   get the weburl from here
//
//       </script>
// from the vidId the url is made like this using the f below
// https://v.aki-h.com/f/ek4aeNDoX3
// / multiple requests for iframe that is hidden then packed url which i belive is a bluff anyways  take the final url and replace v with file to get the m3u8
