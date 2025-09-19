import { BaseClass } from '../models/base-anime.js';

export class MegaUp extends BaseClass {
  private readonly tokenUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovefeet=';
  private readonly decodeUrlIframe: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovearmpits=';
  private readonly decodeM3u8: string = 'https://azartx-tools.vercel.app/api/megadecode?encoded=';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0',
    Accept: 'text/html, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.5',
    'Sec-GPC': '1',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    Priority: 'u=0',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    referer: 'https://animekai.to/',
    Cookie:
      'usertype=guest; session=hxYne0BNXguMc8zK1FHqQKXPmmoANzBBOuNPM64a; cf_clearance=WfGWV1bKGAaNySbh.yzCyuobBOtjg0ncfPwMhtsvsrs-1737611098-1.2.1.1-zWHcaytuokjFTKbCAxnSPDc_BWAeubpf9TAAVfuJ2vZuyYXByqZBXAZDl_VILwkO5NOLck8N0C4uQr4yGLbXRcZ_7jfWUvfPGayTADQLuh.SH.7bvhC7DmxrMGZ8SW.hGKEQzRJf8N7h6ZZ27GMyqOfz1zfrOiu9W30DhEtW2N7FAXUPrdolyKjCsP1AK3DqsDtYOiiPNLnu47l.zxK80XogfBRQkiGecCBaeDOJHenjn._Zgykkr.F_2bj2C3AS3A5mCpZSlWK5lqhV6jQSQLF9wKWitHye39V.6NoE3RE',
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

  async Decode(data: any): Promise<any> {
    try {
      const agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0';
      const response = await this.client.get(`${this.decodeM3u8}${data}&agent=${agent}`);
      console.log(response);

      return response;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  public async extract(videoUrl: URL) {
    const url = videoUrl.href.replace(/\/(e|e2)\//, '/media/');

    try {
      const response = await this.client.get(`${url}`, {
        headers: this.headers,
      });
      // console.log(response.data);
      // const encodedstring = encodeURIComponent(response.data.result);
      // const decodedString = await this.Decode(encodedstring);
      // if (!decodedString) {
      //   throw new Error('Failed to decode video data.');
      // }
      // console.log(decodedString);

      // const decryptedResult = JSON.parse(decodedString);

      // const data = {
      //   sources: decryptedResult.sources.map((s: { file: string }) => ({
      //     url: s.file,
      //     isM3U8: s.file.includes('.m3U8') || s.file.endsWith('m3u8'),
      //   })),
      //   subtitles: decryptedResult.tracks.map((t: { kind: any; file: any }) => ({
      //     kind: t.kind,
      //     url: t.file,
      //   })),
      //   download: decryptedResult.download,
      // };
      // return data;
      return response;
    } catch (error) {
      throw new Error(error as string);
    }
    //       return '';
  }
}
