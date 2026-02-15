import { BaseClass } from '../../models/base.js';
import { Impit } from 'impit';
import * as cheerio from 'cheerio';
import type { IMangaChapter } from '../../types/manga/comix.js';
import type { IBase, IResponse } from '../../types/base.js';

const impit = new Impit({
  browser: 'firefox144',
  http3: true,
});
export class Mangahub extends BaseClass {
  private apiUrl: string = 'https://api.mghcdn.com/graphql';
  private baseUrl: string = 'https://mangahub.io';
  private thumbnailUrl: string = 'https://thumb.mghcdn.com/';

  private searchQuery = `
  query SearchManga($term: String!) {
    search(x: m01, q: $term, limit: 10) {
      rows {
        id
        title
        slug
        image
        rank
        latestChapter
        createdDate
      }
    }
  }
`;
  /// incase of badrequest use float
  private chaptersQuery = `
  query FetchMangaChapters($mangaId:FLoat!){ 
    chaptersByManga(mangaID:38582){
      number
      title
    }
  }
  `;

  private chapterPagesQuery = `
  query FetchChapterPages($slugId: String!, $chapterNumber: Float!) {
    chapter(x: m01, slug: $slugId, number: $chapterNumber) {
      id
      title
      mangaID
      number
      slug
      date
      pages
      noAd
      s
      manga {
        id
        title
        slug
        mainSlug
        author
        isWebtoon
        isYaoi
        isPorn
        isSoftPorn
        isLicensed
      }
    }
  }
`;

  private parseInfo($: cheerio.CheerioAPI, id: string) {
    const info = {
      id: id,
      name: $('h1._3xnDj').text().trim() || null,
      posterImage: $('div.row > div._4RcEi').find('img').attr('src') || null,
      author: $('span._3SlhO:contains("Author")').next('span').text().trim() || null,
      status: $('span._3SlhO:contains("Status")').next('span').text().trim() || null,
      genres:
        $('p._3Czbn > a')
          .map((_, element) => $(element).text().trim())
          .get() || null,
    };
    const chapters: IMangaChapter[] = [];
    $('div#chapters-tab div.tab-content ul.MWqeC.list-group li').map((_, element) => {
      const link = $(element).find('a._3pfyN').first();

      const chapterNumber = link.find('span._3D1SJ').text().replace('#', '').trim();

      const title = link.find('span._2IG5P').text().replace('-', '').trim();

      const releaseDate = link.find('small.UovLc').text().trim();

      chapters.push({
        chapterId:
          link
            .attr('href')
            ?.split('/chapter/')[1] // bleach-color/chapter-684
            ?.replace('/', '$') || null,
        chapterNumber: chapterNumber ? Number(chapterNumber) : null,
        title,
        releaseDate,
      });
    });
    chapters.sort((a, b) => {
      if (a.chapterNumber == null && b.chapterNumber == null) return 0;
      if (a.chapterNumber == null) return 1;
      if (b.chapterNumber == null) return -1;

      //@ts-ignore  fk it
      return a.chapterNumber - b.chapterNumber;
    });

    return { data: info, chapters: chapters };
  }

  private parseMangaPages($: cheerio.CheerioAPI) {
    const pages: { imageUrl: string; page: number }[] = [];

    $('#mangareader div._2aWyJ img.PB0mN').each((index, img) => {
      const imageUrl = $(img).attr('src');

      if (imageUrl) {
        pages.push({
          imageUrl,
          page: index + 1, // 1-based page index
        });
      }
    });

    return pages;
  }

  async search(query: string): Promise<IResponse<IBase[] | []>> {
    if (!query) {
      throw new Error('Missing required params: query string');
    }
    try {
      const response = await impit.fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-mhub-access': '74fb8f1f0b48f766920c1f6d4201e2a7',
          Origin: 'https://mangahub.io',
          Referer: 'https://mangahub.io/',
        },
        body: JSON.stringify({
          query: this.searchQuery,
          variables: { term: query },
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.statusText}`);
      }
      const result = await response.json();
      return result.data.search.rows.map((item: any) => ({
        id: item.slug,
        name: item.title,
        posterImage: `${this.thumbnailUrl}${item.image}`,
      }));
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  async fetchInfo(id: string) {
    if (!id) {
      throw new Error('Missing required params: Id');
    }
    try {
      const response = await impit.fetch(`${this.baseUrl}/manga/${id}`, {
        method: 'GET',
        headers: {
          // Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://mangahub.io/',
          Origin: 'https://mangahub.io',
          'Content-Type': 'application/json',
          'x-mhub-access': '74fb8f1f0b48f766920c1f6d4201e2a7',
          'Sec-Fetch-Storage-Access': 'none',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.statusText}`);
      }
      const data = await response.text();
      return this.parseInfo(cheerio.load(data), id);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  async fetchChapterPages(chapterId: string) {
    if (!chapterId) {
      throw new Error('Missing required params: chapterId');
    }
    const parts = chapterId.split('$');

    if (parts.length !== 2) {
      throw new Error('Invalid chapterId format');
    }

    const slugTitle = parts[0];

    const chapterMatch = parts[1].match(/^chapter-(.+)$/);

    if (!chapterMatch) {
      throw new Error('Invalid chapter format');
    }

    const chapterNumber = Number(chapterMatch[1]);

    try {
      // const graphqlres = await impit.fetch('https://api.mghcdn.com/graphql', {
      //   method: 'POST',
      //   headers: {
      //     Accept: 'application/json',
      //     'Accept-Language': 'en-US,en;q=0.9',
      //     Referer: 'https://mangahub.io/',
      //     Origin: 'https://mangahub.io',
      //     'Content-Type': 'application/json',
      //     'x-mhub-access': '74fb8f1f0b48f766920c1f6d4201e2a7',
      //     'Sec-Fetch-Storage-Access': 'none',
      //     'Sec-Fetch-Dest': 'empty',
      //     'Sec-Fetch-Mode': 'cors',
      //     'Sec-Fetch-Site': 'cross-site',
      //   },
      //   body: JSON.stringify({
      //     query: this.chapterPagesQuery,
      //     variables: { slugId: slugTitle, chapterNumber: chapterNumber },
      //     // query: `{chapter(x:m01,slug:"bleach-color",number:602){id,title,mangaID,number,slug,date,pages,noAd,s,manga{id,title,slug,mainSlug,author,isWebtoon,isYaoi,isPorn,isSoftPorn,isLicensed}}}`,
      //   }),
      // });

      // if (!graphqlres.ok) {
      //   throw new Error('Graphql Request failed' + graphqlres.statusText);
      // }

      // const result = await graphqlres.json();
      // console.log(JSON.stringify(result));

      const response = await impit.fetch(`${this.baseUrl}/chapter/${chapterId.replace('$', '/')}`, {
        method: 'GET',
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://mangahub.io/',
          Origin: 'https://mangahub.io',
          'Content-Type': 'application/json',
          // 'x-mhub-access': '83e58fef4ab9ea7928ca9b28ab37c877',
          'Sec-Fetch-Storage-Access': 'none',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.statusText}`);
      }
      const data = await response.text();
      return this.parseMangaPages(cheerio.load(data));
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }
}
