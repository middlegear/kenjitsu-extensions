import { BaseClass } from '../models/base.js';
import type { IVideoSource } from '../types/base.js';

export class MegaUp extends BaseClass {
  /// i love kai
  // private readonly tokenUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovefeet=';
  // private readonly decodeUrlIframe: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovearmpits=';

  ///vps

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
      if (!response.data) {
        throw new Error(`Generate token failed with error:${response.statusText}`);
      }
      return response.data.result; /// added result
      // return response.data;
    } catch (error) {
      throw new Error(`Generate token failed with error ${error}`);
    }
  }

  async DecodeIframeData(iframe: string) {
    try {
      const url = `${this.decodeUrlIframe}${iframe}`;

      const response = await this.client.get(url);
      if (!response.data) {
        throw new Error(`Decode iframe failed with error ${response.statusText}`);
      }
      return response.data.result; /// added result
      // return response.data;
    } catch (error) {
      throw new Error(`Decode iframe failed with error ${error}`);
    }
  }

  async decrypt(encryptedData: string, userAgent: string) {
    try {
      const response = await this.client.post(this.decodeM3u8, {
        text: encryptedData,
        agent: userAgent,
      });
      if (!response.data) {
        throw new Error(`Sources decode failed with error ${response.statusText}`);
      }
      return response.data.result;
    } catch (error) {
      throw new Error(`Sources decode failed with error ${error}`);
    }
  }

  public async extract(videoUrl: URL): Promise<IVideoSource> {
    const mediaUrl = videoUrl.href.replace(/\/(e|e2)\//, '/media/');

    try {
      const response = await this.client.get(mediaUrl);

      const userAgentKey = this.client.getUserAgent();

      if (!response.data) {
        const errorMsg = `HTTP error! status: ${response.statusText}`;

        throw new Error(errorMsg);
      }

      let decryptedResult;

      if (userAgentKey) {
        decryptedResult = await this.decrypt(response.data.result, userAgentKey);
      }

      if (!decryptedResult) {
        throw new Error('Failed to decrypt from MegaUp');
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

      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}
