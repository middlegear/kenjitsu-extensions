import { BaseClass } from '../models/base-anime.js';
import { gotScraping } from 'got-scraping';
import type { IVideoSource } from '../models/types.js';
export class MegaUp extends BaseClass {
  // private readonly tokenUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovefeet=';
  // private readonly decodeUrlIframe: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovearmpits=';
  // private readonly decodeM3u8: string = 'https://azartx-tools.vercel.app/api/dec-mega';
  private readonly tokenUrl: string = 'https://enc-dec.app/api/enc-kai?text=';
  private readonly decodeUrlIframe: string = 'https://enc-dec.app/api/dec-kai?text=';
  private readonly decodeM3u8: string = 'https://enc-dec.app/api/dec-mega';

  constructor() {
    super();
  }

  async GenerateToken(token: string) {
    try {
      const url = `${this.tokenUrl}${encodeURIComponent(token)}`;

      const response = await this.client.get(url);

      return response.data.result; /// added result
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'GenerateToken function failed' };
    }
  }

  async DecodeIframeData(iframe: string) {
    try {
      const url = `${this.decodeUrlIframe}${iframe}`;

      const response = await this.client.get(url);

      return response.data.result; /// added result
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  async decrypt(encryptedData: string, userAgent: string) {
    try {
      const response = await this.client.post(this.decodeM3u8, {
        text: encryptedData,
        agent: userAgent,
      });

      return response.data.result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'decrypt function failed' };
    }
  }

  public async extract(videoUrl: URL): Promise<IVideoSource> {
    const mediaUrl = videoUrl.href.replace(/\/(e|e2)\//, '/media/');

    try {
      let userAgentKey;

      const res = await gotScraping(mediaUrl, {
        hooks: {
          beforeRequest: [
            options => {
              userAgentKey = options.headers['user-agent'];
            },
          ],
        },
      });

      const text = res.body;

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.statusCode}`);
      }

      let encrypted;
      try {
        encrypted = JSON.parse(text);
      } catch (err) {
        console.error('[MegaUp] Failed to parse JSON response:', err);
        throw err;
      }
      let decryptedResult;
      if (userAgentKey) decryptedResult = await this.decrypt(encrypted.result, userAgentKey);

      if (!decryptedResult) {
        throw new Error('Failed to decode video data.');
      }

      const extractedData = {
        sources: (decryptedResult.sources || []).map((s: { file: string }) => ({
          url: s.file,
          isM3U8: s.file.includes('.m3u8') || s.file.endsWith('m3u8'),
        })),
        subtitles: (decryptedResult.tracks || []).map((t: { kind: any; file: any }) => ({
          kind: t.kind,
          url: t.file,
        })),
        download: decryptedResult.download,
      };

      return extractedData;
    } catch (error) {
      console.error('[MegaUp] extract error:', error);
      throw new Error(error as string);
    }
  }
}
