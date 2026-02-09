// import { BaseClass } from '../../models/base.js';
// import * as cheerio from 'cheerio';
// import type { IBase, IMangaSource, IResponse } from '../../types/base.js';
// import type { IMangaInfo } from '../../types/manga/comix.js';
// import type { IWMangaChapter } from '../../types/manga/weebcentral.js';
// import { Impit } from 'impit';

// export class WeebCentral extends BaseClass {
//   private baseUrl: string;
//   private client2 = new Impit({
//     browser: 'chrome',
//     followRedirects: false,
//     http3: true,
//   });

//   constructor(baseUrl: string = 'https://weebcentral.com') {
//     super();
//     this.baseUrl = baseUrl;
//   }

//   // ... (Parsers remain untouched) ...

//   async search(query: string): Promise<IResponse<IBase[] | []>> {
//     if (!query) throw new Error('Missing required param: query string');
//     try {
//       const response = await this.client2.fetch(`${this.baseUrl}/search/simple?location=main`, {
//         method: 'POST',
//         body: new URLSearchParams({ text: query }).toString(),
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           'HX-Request': 'true',
//           'HX-Trigger': 'quick-search-input',
//           'HX-Trigger-Name': 'text',
//           'HX-Target': 'quick-search-result',
//           'HX-Current-URL': `${this.baseUrl}/`,
//         },
//       });

//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const html = await response.text();
//       return this.parseSearch(cheerio.load(html));
//     } catch (error) {
//       return {
//         data: [],
//         error: error instanceof Error ? error.message : 'Unknown Error',
//       };
//     }
//   }

//   async fetchMangaInfo(id: string): Promise<IResponse<IMangaInfo | null>> {
//     if (!id) throw new Error('Missing required param: id');
//     const mangaId = id.replace('-', '/');

//     try {
//       const response = await this.client2.fetch(`${this.baseUrl}/series/${mangaId}`, {
//         method: 'GET',
//         headers: {
//           Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//           Referer: `${this.baseUrl}/`,
//         },
//       });

//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const html = await response.text();
//       return this.parseMangaInfo(cheerio.load(html), id);
//     } catch (error) {
//       return {
//         data: null,
//         error: error instanceof Error ? error.message : 'Unknown Error',
//       };
//     }
//   }

//   async fetchMangaChapters(id: string): Promise<IResponse<IWMangaChapter[] | []>> {
//     if (!id) throw new Error('Missing required param: id');
//     const mangaId = id.split('-').at(0);

//     try {
//       const response = await this.client2.fetch(`${this.baseUrl}/series/${mangaId}/full-chapter-list`, {
//         method: 'GET',
//         headers: {
//           Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//           Referer: `${this.baseUrl}/${id.replace('-', '/')}`,
//         },
//       });

//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const html = await response.text();
//       return this.parseMangaChapters(cheerio.load(html));
//     } catch (error) {
//       return {
//         data: [],
//         error: error instanceof Error ? error.message : 'Unknown Error',
//       };
//     }
//   }

//   async fetchMangaPages(id: string) {
//     if (!id) throw new Error('Missing required param: chapterId');
//     try {
//       const response = await this.client2.fetch(
//         `${this.baseUrl}/chapters/${id}/images?is_prev=False&current_page=1&reading_style=long_strip`,
//         { method: 'GET' },
//       );

//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const html = await response.text();
//       return {
//         headers: { Referer: `${this.baseUrl}/` },
//         data: this.parseMangaPages(cheerio.load(html)),
//       };
//     } catch (error) {
//       return {
//         headers: { Referer: null },
//         data: [],
//         error: error instanceof Error ? error.message : 'Unknown error',
//       };
//     }
//   }
// }
