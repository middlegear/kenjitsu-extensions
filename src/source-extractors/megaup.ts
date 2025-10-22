import { BaseClass } from '../models/base.js';
import type { IVideoSource } from '../types/base.js';

export class MegaUp extends BaseClass {
  // private readonly tokenUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovefeet=';
  // private readonly decodeUrlIframe: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovearmpits=';
  //deprecated
  // private readonly decodeM3u8: string = 'https://azartx-tools.vercel.app/api/dec-mega';

  ///vps

  private readonly tokenUrl: string = 'https://enc-dec.app/api/enc-kai?text=';
  private readonly decodeUrlIframe: string = 'https://enc-dec.app/api/dec-kai?text=';
  private readonly decodeM3u8: string = 'https://enc-dec.app/api/dec-mega';

  constructor() {
    super('animekai');
  }

  async GenerateToken(token: string) {
    console.time('GenerateToken');
    try {
      const url = `${this.tokenUrl}${encodeURIComponent(token)}`;

      console.time('GenerateTokenRequest');
      const response = await this.client.get(url);
      console.timeEnd('GenerateTokenRequest');

      console.timeEnd('GenerateToken');
      console.log('[GenerateToken] Result:', response.data.result);
      return response.data.result; /// added result
      // return response.data;
    } catch (error) {
      console.timeEnd('GenerateToken');
      const errorMsg = error instanceof Error ? error.message : 'GenerateToken function failed';
      console.log('[GenerateToken] Error:', errorMsg);
      return { error: errorMsg };
    }
  }

  async DecodeIframeData(iframe: string) {
    console.time('DecodeIframeData');
    try {
      const url = `${this.decodeUrlIframe}${iframe}`;

      console.time('DecodeIframeDataRequest');
      const response = await this.client.get(url);
      console.timeEnd('DecodeIframeDataRequest');

      console.timeEnd('DecodeIframeData');
      console.log('[DecodeIframeData] Result:', response.data.result);
      return response.data.result; /// added result
      // return response.data;
    } catch (error) {
      console.timeEnd('DecodeIframeData');
      const errorMsg = error instanceof Error ? error.message : 'Decode function failed';
      console.log('[DecodeIframeData] Error:', errorMsg);
      return { error: errorMsg };
    }
  }

  async decrypt(encryptedData: string, userAgent: string) {
    console.time('decrypt');
    try {
      console.time('decryptRequest');
      const response = await this.client.post(this.decodeM3u8, {
        text: encryptedData,
        agent: userAgent,
      });
      console.timeEnd('decryptRequest');

      console.timeEnd('decrypt');
      console.log('[decrypt] Result:', response.data.result);
      return response.data.result;
    } catch (error) {
      console.timeEnd('decrypt');
      const errorMsg = error instanceof Error ? error.message : 'decrypt function failed';
      console.log('[decrypt] Error:', errorMsg);
      return { error: errorMsg };
    }
  }

  public async extract(videoUrl: URL): Promise<IVideoSource> {
    console.time('extract');
    const mediaUrl = videoUrl.href.replace(/\/(e|e2)\//, '/media/');

    try {
      console.time('extractRequest');
      const response = await this.client.get(mediaUrl);
      console.timeEnd('extractRequest');

      const userAgentKey = this.client.getUserAgent();

      if (!response.data) {
        console.timeEnd('extract');
        const errorMsg = `HTTP error! status: ${response.statusText}`;
        console.log('[extract] Error:', errorMsg);
        throw new Error(errorMsg);
      }

      let decryptedResult;

      if (userAgentKey) {
        decryptedResult = await this.decrypt(response.data.result, userAgentKey);
      }

      if (!decryptedResult) {
        console.timeEnd('extract');
        const errorMsg = 'Failed to decode video data.';
        console.log('[extract] Error:', errorMsg);
        throw new Error(errorMsg);
      }

      const extractedData = {
        sources: (decryptedResult.sources || []).map((s: { file: string }) => ({
          url: s.file,
          isM3u8: s.file.includes('.m3u8') || s.file.endsWith('m3u8'),
          type: s.file.includes('.m3u8') ? 'hls' : 'idk',
        })),
        subtitles: (decryptedResult.tracks || []).map((t: { kind: any; file: any }) => ({
          kind: t.kind,
          url: t.file,
        })),
        download: decryptedResult.download,
      };

      console.timeEnd('extract');
      console.log('[extract] Result:', extractedData);
      return extractedData;
    } catch (error) {
      console.timeEnd('extract');
      console.error('[MegaUp] extract error:', error);
      const errorMsg = (error as Error).message;
      console.log('[extract] Error:', errorMsg);
      throw new Error(errorMsg);
    }
  }
}
