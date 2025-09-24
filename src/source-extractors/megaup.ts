import { BaseClass } from '../models/base-anime.js';
import { gotScraping } from 'got-scraping';
export class MegaUp extends BaseClass {
  private readonly tokenUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovefeet=';
  private readonly decodeUrlIframe: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovearmpits=';
  private readonly decodeM3u8: string = 'https://azartx-tools.vercel.app/api/dec-mega';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
  };

  constructor() {
    super();
  }

  async GenerateToken(token: string) {
    try {
      const url = `${this.tokenUrl}${encodeURIComponent(token)}`;

      const response = await this.client.get(url);

      return response.data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'GenerateToken function failed' };
    }
  }

  async DecodeIframeData(iframe: string) {
    try {
      const url = `${this.decodeUrlIframe}${iframe}`;

      const response = await this.client.get(url);

      return response.data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  async decrypt(encryptedData: string, userAgent: string) {
    try {
      console.log('[MegaUp] Requesting decrypt');
      const url = `${this.decodeM3u8}?text=${encryptedData}&agent=${userAgent}`;

      const response = await this.client.get(url);
      console.log('[MegaUp] Response status:', response.status);
      console.log('[MegaUp] Response data keys:', Object.keys(response.data || {}));

      return response.data.result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  public async extract(videoUrl: URL) {
    const mediaUrl = videoUrl.href.replace(/\/(e|e2)\//, '/media/');

    try {
      let userAgentKey;

      const res = await gotScraping(mediaUrl, {
        hooks: {
          beforeRequest: [
            options => {
              userAgentKey = options.headers['user-agent'];
              console.log('[MegaUp] Captured User-Agent for decryption:', userAgentKey);
            },
          ],
        },
      });

      const text = res.body;

      console.log('[MegaUp] Response status:', res.statusCode);
      console.log('[MegaUp] Raw response text:', text.slice(0, 500));

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.statusCode}`);
      }

      let encrypted;
      try {
        encrypted = JSON.parse(text);
        console.log('[MegaUp] Parsed encrypted JSON keys:', Object.keys(encrypted));
      } catch (err) {
        console.error('[MegaUp] Failed to parse JSON response:', err);
        throw err;
      }
      let decryptedResult;
      if (userAgentKey) decryptedResult = await this.decrypt(encrypted.result, userAgentKey);
      console.log('[MegaUp] Decrypted result keys:', Object.keys(decryptedResult || {}));

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

      console.log('[MegaUp] Final extracted data:', extractedData);
      return extractedData;
    } catch (error) {
      console.error('[MegaUp] extract error:', error);
      throw new Error(error as string);
    }
  }
}
