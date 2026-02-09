import { BaseClass } from '../../models/base.js';
import * as cheerio from 'cheerio';
import type { IBase, IMangaSource, IResponse } from '../../types/base.js';
import type { IMangaInfo } from '../../types/manga/comix.js';
import type { IWMangaChapter } from '../../types/manga/weebcentral.js';
import { Impit } from 'impit';

export class WeebCentral extends BaseClass {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://weebcentral.com') {
    super();
    this.baseUrl = baseUrl;
  }
  private client2 = new Impit({
    browser: 'firefox',
    followRedirects: false,
    http3: true, // We need the 'location' header for MP4
  });

  private parseSearch($: cheerio.CheerioAPI) {
    const result: IBase[] = [];
    $('div a').each((_, element) => {
      result.push({
        id: $(element).attr('href')?.split('/').slice(-2).join('-') || null,
        name: $(element).find('div.text-ellipsis').text().trim() || null,
        posterImage: $(element).find('img').attr('src') || $(element).find('source').attr('srcset') || null,
      });
    });

    return { data: result };
  }

  private parseMangaInfo($: cheerio.CheerioAPI, mangaId: string) {
    const info: IMangaInfo = {
      id: mangaId,
      name: $('section > h1.font-bold').text().trim() || null,
      posterImage:
        $('section picture').find('img').attr('src') || $('section picture').find('source').attr('srcset') || null,

      releaseDate: $('li:contains("Released") span').text().trim()
        ? parseInt($('li:contains("Released") span').text().trim())
        : null,
      status: $('li:contains("Status:") a').text().trim() || null,
      official: $('li:contains("Official Translation:") a').text().trim().toLowerCase() === 'no' ? false : true,
      genres:
        $('li:has(strong:contains("Tags(s)")) span a')
          .map((_, el) => $(el).text().trim().replace(/,$/, ''))
          .get() || [],
      synopsis: $(' li > p.whitespace-pre-wrap.break-words').text().trim() || null,
    };

    return { data: info };
  }

  private parseMangaChapters($: cheerio.CheerioAPI) {
    const chapters: IWMangaChapter[] = [];

    $('div').each((_, element) => {
      chapters.push({
        ChapterId: $(element).find('a').attr('href')?.split('/').pop() || null,
        name: $(element).find('span.grow > span:first-child').text().trim() || null,
        chapterNumber:
          $(element).find('span.grow > span:first-child').text().trim() || null
            ? parseInt($(element).find('span.grow > span:first-child').text().trim()?.match(/\d+/)?.[0] as string)
            : null,
        timestamp: $(element).find('time').attr('datetime') || null,
      });
    });

    return { data: chapters.reverse() };
  }

  private parseMangaPages($: cheerio.CheerioAPI) {
    const sources: IMangaSource[] = [];
    $('img').each((_, element) => {
      sources.push({
        url: $(element).attr('src') || null,
        page: $(element).attr('alt') ? parseInt($(element).attr('alt')?.match(/\d+/)?.[0] as string) : null,
        hi: null,
      });
    });

    return sources;
  }
  async search(query: string): Promise<IResponse<IBase[] | []>> {
    if (!query) throw new Error('Missing required param: query string');
    try {
      const response = await this.client2.fetch(`${this.baseUrl}/search/simple?location=main`, {
        method: 'POST',
        body: new URLSearchParams({ text: query }).toString(),
        headers: {
          // Core
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',

          // Browser identity
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',

          // HTMX
          'HX-Request': 'true',
          'HX-Trigger': 'quick-search-input',
          'HX-Trigger-Name': 'text',
          'HX-Target': 'quick-search-result',
          'HX-Current-URL': `${this.baseUrl}/`,

          // Fetch metadata (Cloudflare cares)
          Origin: this.baseUrl,
          Referer: `${this.baseUrl}/`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',

          Cookie: `cf_clearance=uyrmr_HZaIKY94zFrQpRRjMjaW4KKd44cIRmIFJv.m4-1770669724-1.2.1.1-XfkWoiZwP8puu5jbUOtxTl1w8UUlL34r8DSXkTWqB7SnjETI3.g8vkq8LGFybQ3RcOW0LaPm.DN1bVdSJXKXyhLUOg9pf1DXogr8yCr0En6R3qM66RATTYLxWR1RBCGl.p4XWpvlfMSsDzQXIc5xj.BmHh1Vkjll1GlTGraTlGuI9jicCuZc8QDou_T6rDJkuWTXtBBVLoZbmHuPjcFeMSGbvNt7g9u.6wOCNgdeGfU`,
        },
      });
      const html = await response.text();
      console.log(html);

      return this.parseSearch(cheerio.load(html));
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
  async fetchMangaInfo(id: string): Promise<IResponse<IMangaInfo | null>> {
    if (!id) {
      throw new Error('Missing required  param: id');
    }
    const mangaId = id.replace('-', '/');

    try {
      const response = await this.client.get(`${this.baseUrl}/series/${mangaId}`, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: `${this.baseUrl}/`,
        },
      });
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return this.parseMangaInfo(cheerio.load(response.data), id);
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  async fetchMangaChapters(id: string): Promise<IResponse<IWMangaChapter[] | []>> {
    if (!id) {
      throw new Error('Missing required  param: id');
    }
    const mangaId = id.split('-').at(0);

    try {
      const response = await this.client.get(`${this.baseUrl}/series/${mangaId}/full-chapter-list`, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: `${this.baseUrl}/${id.replace('-', '/')}`,
        },
      });
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return this.parseMangaChapters(cheerio.load(response.data));
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  async fetchMangaPages(id: string) {
    if (!id) {
      throw new Error('Missing required  param: chapterId');
    }
    try {
      const response = await this.client.get(
        `${this.baseUrl}/chapters/${id}/images?is_prev=False&current_page=1&reading_style=long_strip`,
      );
      if (!response.data) {
        throw new Error(response.statusText);
      }

      return {
        headers: { Referer: `${this.baseUrl}/` },
        data: this.parseMangaPages(cheerio.load(response.data)),
      };
    } catch (error) {
      return {
        headers: { Referer: null },
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
