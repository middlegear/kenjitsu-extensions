import { BaseClass } from '../../models/base.js';
import * as cheerio from 'cheerio';
import type { IBase, IMangaSource, IResponse } from '../../types/base.js';
import type { IMangaInfo } from '../../types/manga/comix.js';
import type { IWMangaChapter } from '../../types/manga/weebcentral.js';

export class WeebCentral extends BaseClass {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://weebcentral.com') {
    super();
    this.baseUrl = baseUrl;
  }

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
    if (!query) {
      throw new Error('Missing required  param: query string');
    }
    try {
      const response = await this.client.post(
        `${this.baseUrl}/search/simple?location=main`,
        { text: query },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'HX-Request': 'true',
            'HX-Trigger': 'quick-search-input',
            'HX-Trigger-Name': 'text',
            'HX-Target': 'quick-search-result',
            'HX-Current-URL': `${this.baseUrl}/`,
          },
        },
      );

      if (!response.data) {
        throw new Error(response.statusText);
      }

      return this.parseSearch(cheerio.load(response.data));
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
