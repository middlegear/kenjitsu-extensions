// https://aki-h.com/

import { BaseClass } from '../../models/base.js';
import * as cheerio from 'cheerio';
import type { IZSpotlight } from '../../types/anime/zoro.js';
export class AkiH extends BaseClass {
  constructor(baseUrl: string = 'https://aki-h.com/') {
    super();
    this.baseUrl = baseUrl;
  }
  private baseUrl: string;

  private parseHome($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = 'div#slider  div.deslide-item';
    const data: IZSpotlight[] = [];
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
  }
  async fetchHomePage() {
    try {
      const response = await this.client.get(`${this.baseUrl}`);
      if (!response.data) {
      }
      return this.parseHome(cheerio.load(response.data));
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
}
