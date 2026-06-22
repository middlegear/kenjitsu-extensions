import { BaseClass, type ClientConfig } from '../../models/base.js';

import * as cheerio from 'cheerio';
import type { IResponse, IVideoSource } from '../../types/base.js';

export class MegaPlay extends BaseClass {
  private baseUrl: string = 'https://megaplay.buzz/stream';
  constructor(options: ClientConfig) {
    super(options);
  }

  private parseMediaId($: cheerio.CheerioAPI) {
    const selector1: cheerio.SelectorType = 'body  div.mg3-player > div.fix-area ';
    const id1 = $(selector1).attr('data-id')?.trim();
    const fileId =
      $('title')
        .text()
        .match(/File\s+(\d+)/i)?.[1] ?? null;
    const finalMediaId = id1 || fileId;
    return finalMediaId;
  }
  async extract(videoUrl: URL, referer: string): Promise<IResponse<IVideoSource | null>> {
    const extractedData: IVideoSource = {
      intro: {
        start: 0,
        end: 0,
      },
      outro: {
        start: 0,
        end: 0,
      },
      subtitles: [],
      sources: [],
    };
    try {
      const initialResponse = await this.client.fetch(`${videoUrl.href}`, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          Referer: `${referer}/`,
        },
      });
      if (!initialResponse.ok) {
        return {
          data: null,
          error: initialResponse.statusText,
          status: initialResponse.status,
        };
      }
      const initialResult = await initialResponse.text();

      // console.log(initialResult);

      const id = this.parseMediaId(cheerio.load(initialResult));
      console.log(id);

      const response = await this.client.fetch(`${this.baseUrl}/getSources?id=${id}&id=${id}`, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: videoUrl.href,
        },
      });
      if (!response.ok) {
        return {
          data: null,
          error: response.statusText,
          status: response.status,
        };
      }

      const result = await response.json();
      //   console.log(result);

      extractedData.sources.push({
        url: result.sources.file,
        isM3u8: result.sources.file.includes('m3u8'),
        type: result.sources.file.includes('m3u8') ? 'hls' : 'unknown',
      });
      extractedData.intro = result.intro;
      extractedData.outro = result.outro;
      extractedData.subtitles = result.tracks.map((item: any) => ({
        url: item.file,
        lang: item.label,
        default: item.default,
      }));

      return {
        data: extractedData,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
        status: 500,
      };
    }
  }
  async extractNew(videoUrl: URL, referer: string): Promise<IResponse<IVideoSource | null>> {
    const extractedData: IVideoSource = {
      intro: {
        start: 0,
        end: 0,
      },
      outro: {
        start: 0,
        end: 0,
      },
      subtitles: [],
      sources: [],
    };
    try {
      const intialUrl = `${videoUrl.href}?autostart=true`;

      const initialResponse = await this.client.fetch(`${intialUrl}`, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          Referer: `${referer}/`,
        },
      });
      if (!initialResponse.ok) {
        return {
          data: null,
          error: initialResponse.statusText,
          status: initialResponse.status,
        };
      }
      const initialResult = await initialResponse.text();

      // console.log(initialResult);

      const id = this.parseMediaId(cheerio.load(initialResult));
      console.log(id);

      const response = await this.client.fetch(`${this.baseUrl}/getSourcesNew?id=${id}&id=${id}`, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: intialUrl,
        },
      });
      if (!response.ok) {
        return {
          data: null,
          error: response.statusText,
          status: response.status,
        };
      }

      const result = await response.json();
      //   console.log(result);

      extractedData.sources.push({
        url: result.sources.file,
        isM3u8: result.sources.file.includes('m3u8'),
        type: result.sources.file.includes('m3u8') ? 'hls' : 'unknown',
      });
      extractedData.intro = result.intro;
      extractedData.outro = result.outro;
      extractedData.subtitles = result.tracks.map((item: any) => ({
        url: item.file,
        lang: item.label,
        default: item.default,
      }));

      return {
        data: extractedData,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
        status: 500,
      };
    }
  }
}
