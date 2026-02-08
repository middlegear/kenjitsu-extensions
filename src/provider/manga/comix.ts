// https://comix.to/home

import { BaseClass } from '../../models/base.js';
import type { IAKPaginated } from '../../types/anime/animekai.js';
import type { IMangaSource, IResponse, ISourceBaseResponse } from '../../types/base.js';
import type { IComixInfo, IComixManga, IMangaChapter } from '../../types/manga/comix.js';
import * as cheerio from 'cheerio';

export class Comix extends BaseClass {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://comix.to') {
    super();
    this.baseUrl = baseUrl;
  }

  private parseMangaInfo($: cheerio.CheerioAPI) {
    const anilistId = $('.referrer a[href*="anilist.co"]').attr('href')?.match(/\d+/)?.[0] || null;
    const malId = $('.referrer a[href*="myanimelist.net"]').attr('href')?.match(/\d+/)?.[0] || null;
    const rawStatus = $('div.detail-top').find('span.status').text().trim();
    const info: IComixInfo = {
      id: $('.sharethis-inline-share-buttons').attr('data-url')?.split('/').at(-1) || null,
      name: $('h1.title').text().trim() || null,
      altnames:
        $('h3.subtitle')
          .text()
          .split('/')
          .map(name => name.trim())
          .filter(name => name.length > 0) || [],

      posterImage: $('div.poster ').find('img').attr('src') || null,
      synopsis:
        $('div.description')
          .find('div.content')
          .text()
          .trim()
          .replace(/[\n\s-]*$/g, '') || null,
      genres:
        $('div:contains("Genres:") > span  > a')
          .map((_, el) => $(el).text().trim())
          .get() || [],
      anilistId: anilistId ? parseInt(anilistId) : null,
      malId: malId ? parseInt(malId) : null,
      releaseDate: rawStatus.match(/\d{4}/)?.[0] || null,
      status: rawStatus.replace(/\d{4}/, '').trim() || null,
    };

    return { data: info };
  }

  private parseMangaImages($: cheerio.CheerioAPI): IMangaSource[] {
    const sources: IMangaSource[] = [];

    $('script').each((_, el) => {
      const content = $(el).html() || '';

      const pushMatches = content.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g);

      for (const match of pushMatches) {
        try {
          const unescaped = JSON.parse(`"${match[1]}"`);

          if (typeof unescaped === 'string' && unescaped.startsWith('d:')) {
            const data = JSON.parse(unescaped.substring(2));

            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
              if (item?.chapter?.images && Array.isArray(item.chapter.images)) {
                item.chapter.images.forEach((img: any, index: number) => {
                  sources.push({
                    url: img.url || img.src || null,
                    page: typeof img.page === 'number' ? img.page : index + 1,
                  });
                });
              }
            }
          }
        } catch (e) {
          // Ignore chunks that aren't valid JSON or don't match the format
        }
      }
    });

    if (sources.length === 0) {
      throw new Error('Failed to extract chapter images');
    }

    return sources;
  }

  async search(query: string): Promise<IAKPaginated<IComixManga[] | []>> {
    if (!query) {
      throw new Error('Missing required  param: query string');
    }
    try {
      const response = await this.client.get(
        `${this.baseUrl}/api/v2/manga?exclude_genres[]=87264&keyword=${query}&order[relevance]=desc&limit=20`,
      );

      if (!response.data) {
        throw new Error(response.statusText);
      }

      const data: IComixManga[] = response.data.result.items.map((item: any) => ({
        id: `${item.hash_id}-${item.slug}` || null,
        name: item.title ?? null,
        posterImage: item.poster.large ?? item.poster.medium ?? item.poster.small ?? null,
        altnames: item.alt_titles || [],
        releaseDate: item.start_date || null,
        volumes: item.final_volume || null,
        anilistId: item.links.al ? parseInt(item.links.al?.match(/\d+/)[0]) : null,
        malId: item.links.mal ? parseInt(item.links.mal?.match(/\d+/)[0]) : null,
      }));

      return {
        hasNextPage: response.data.result.pagination.last_page > 1,
        totalResults: response.data.result.pagination.total,
        lastPage: response.data.result.pagination.last_page,
        currentPage: response.data.result.pagination.current_page,
        data: data,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        totalResults: 0,
        lastPage: 0,
        currentPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  async fetchMangaInfo(id: string): Promise<IResponse<IComixInfo | null>> {
    if (!id) {
      throw new Error('Missing required  param: id');
    }

    try {
      const response = await this.client.get(`${this.baseUrl}/title/${id}`);

      if (!response.data) {
        throw new Error(response.statusText);
      }

      return this.parseMangaInfo(cheerio.load(response.data));
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
  async fetchMangaChapters(id: string): Promise<IResponse<IMangaChapter[] | []>> {
    if (!id) {
      throw new Error('Missing required param: id');
    }

    const mangaId = id.split('-')[0];
    const allChapters: IMangaChapter[] = [];

    let page = 1;
    let totalPages = Infinity;

    try {
      while (page <= totalPages) {
        const url = `${this.baseUrl}/api/v2/manga/${mangaId}/chapters?limit=100&page=${page}&order[volume]=asc`;

        const response = await this.client.get(url, {
          headers: {
            Referer: `${this.baseUrl}/title/${id}`,
          },
        });
        if (!response.data) {
          throw new Error(response.statusText);
        }

        const result = response.data?.result;
        const items = result?.items;

        if (!Array.isArray(items) || items.length === 0) {
          break;
        }

        if (typeof result.pagination?.last_page === 'number') {
          totalPages = result.pagination.last_page;
        }

        allChapters.push(
          ...items.map((item: any) => ({
            chapterId: `${id}$-id-$${item.chapter_id}-chapter-${item.number}`,
            official: item.is_official === 1,
            title: item.name ?? null,
            volume: item.volume ?? null,
            language: item.language ?? null,
            releaseDate: item.created_at ? new Date(item.created_at * 1000).toISOString() : null,
            scanlationGroup: item.scanlation_group?.name ?? null,
            chapterNumber: item.number ?? null,
          })),
        );

        page++;
      }

      return {
        data: allChapters,
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async fetchChapterPages(id: string): Promise<ISourceBaseResponse<IMangaSource[] | []>> {
    if (!id) {
      throw new Error('Missing required  param: chapterId');
    }
    const mangaId = id.replace('$-id-$', '/');

    try {
      const response = await this.client.get(`${this.baseUrl}/title/${mangaId}`);
      if (!response.data) {
        throw new Error(response.statusText);
      }

      return {
        headers: { Referer: `${this.baseUrl}/` },
        data: this.parseMangaImages(cheerio.load(response.data)),
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
