import { BaseClass } from '../models/base-anime.js';

export class MegaUp extends BaseClass {
  private readonly tokenUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovefeet=';
  private readonly decodeUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovearmpits=';

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
      const response = await this.client.get(`${this.decodeUrl}${iframe}`);
      return response.data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  async Decode(data: any) {}

  public async extract(videoUrl: URL) {
    const url = videoUrl.href.replace(/\/(e|e2)\//, '/media/');

    try {
      const res = await this.client.get(url, {});
      console.log(res.data.result);
      const decodedString = this.Decode(res.data.result);
      if (!decodedString) {
        throw new Error('Failed to decode video data.');
      }
      //@ts-ignore
      const decryptedResult = JSON.parse((await decodedString).replace(/\\/g, ''));

      const data = {
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
      return data;
    } catch (error) {
      throw new Error((error as Error).message);
    }
    //       return '';
  }
}
