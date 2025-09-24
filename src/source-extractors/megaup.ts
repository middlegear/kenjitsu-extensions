import { BaseClass } from '../models/base-anime.js';

export class MegaUp extends BaseClass {
  private readonly tokenUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovefeet=';
  private readonly decodeUrlIframe: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovearmpits=';
  private readonly decodeM3u8: string = 'https://azartx-tools.vercel.app/api/dec-mega';
  private headers = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.5',
    'Alt-Used': 'megaup.live',
    Connection: 'keep-alive',
    Host: 'megaup.live',
    Priority: 'u=0, i',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-GPC': '1',
    TE: 'trailers',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
  };
  constructor() {
    super();
  }

  async GenerateToken(token: string) {
    try {
      const response = await this.client.get(`${this.tokenUrl}${encodeURIComponent(token)}`);
      return response.data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'GenerateToken function failed' };
    }
  }

  async DecodeIframeData(iframe: string) {
    try {
      const response = await this.client.get(`${this.decodeUrlIframe}${iframe}`);

      return response.data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  async decrypt(data: string) {
    try {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0';
      const response = await this.client.get(`${this.decodeM3u8}?text=${data}&agent=${userAgent}`);

      return response.data.result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  public async extract(videoUrl: URL) {
    const url = videoUrl.href.replace(/\/(e|e2)\//, '/media/');

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      const encrypted = await response.json();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const decryptedResult = await this.decrypt(encrypted.result);
      if (!decryptedResult) {
        throw new Error('Failed to decode video data.');
      }

      const extractedData = {
        sources: decryptedResult.sources.map((s: { file: string }) => ({
          url: s.file,
          isM3U8: s.file.includes('.m3U8') || s.file.endsWith('m3u8'),
        })),
        subtitles: decryptedResult.tracks.map((t: { kind: any; file: any }) => ({
          kind: t.kind,
          url: t.file,
        })),
        download: decryptedResult.download,
      };
      return extractedData;
    } catch (error) {
      throw new Error(error as string);
    }
  }
}
