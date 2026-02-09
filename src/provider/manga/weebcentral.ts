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
    // followRedirects: false,
    // http3: true, // We need the 'location' header for MP4
  });

  private parseSearch($: cheerio.CheerioAPI): IResponse<IBase[]> {
    const result: IBase[] = [];

    $('article.bg-base-300').each((_, article) => {
      const root = $(article);

      const link = root.find('a[href*="/series/"]').first();
      const href = link.attr('href');
      if (!href) return;

      // Normalize absolute & relative URLs
      let seriesId: string | null = null;
      try {
        const url = href.startsWith('http') ? new URL(href) : new URL(href, this.baseUrl);

        // /series/{ID}/{slug}
        seriesId = url.pathname.split('/')[2] ?? null;
      } catch {
        return;
      }

      const title = root.find('div.text-ellipsis.truncate').first().text().trim() || null;

      const posterImage =
        root.find('picture img').first().attr('src') || root.find('picture source').first().attr('srcset') || null;

      result.push({
        id: seriesId,
        name: title,
        posterImage,
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
  async search(query: string): Promise<IResponse<IBase[]>> {
    if (!query) {
      return { data: [], error: 'Missing required param: query string' };
    }

    try {
      const url = new URL(`${this.baseUrl}/search/data`);

      url.searchParams.set('limit', '32');
      url.searchParams.set('offset', '0');

      // Normalize query like Kotatsu does
      const normalized = query
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      url.searchParams.set('text', normalized);
      url.searchParams.set('sort', 'Best Match');
      url.searchParams.set('order', 'Ascending');
      url.searchParams.set('official', 'Any');
      url.searchParams.set('anime', 'Any');
      url.searchParams.set('adult', 'Any');
      url.searchParams.set('display_mode', 'Full Display');

      const response = await this.client2.fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

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
