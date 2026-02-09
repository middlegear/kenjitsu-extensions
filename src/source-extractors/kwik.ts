import { BaseClass } from '../models/base.js';
import type { IVideoSource } from '../types/base.js';
import { unpack } from '../utils/unpacker.js';
// import { Impit } from 'impit';

class Kwik extends BaseClass {
  // Initialize Impit with browser emulation for better bypass success
  // private client2 = new Impit({
  //   browser: 'chrome',
  //   followRedirects: false,
  //   http3: true, // We need the 'location' header for MP4
  // });

  private readonly paramRegex = /\("(\w+)",\d+,"(\w+)",(\d+),(\d+),\d+\)/;
  private readonly urlRegex = /action="([^"]+)"/;
  private readonly tokenRegex = /value="([^"]+)"/;

  constructor() {
    super();
  }

  public deobfuscate(kwikHtml: string) {
    const match = kwikHtml.match(this.paramRegex);
    if (!match) throw new Error('Could not find obfuscated parameters');

    const [_, fullString, key, v1Str, v2Str] = match;
    const v1 = parseInt(v1Str);
    const v2 = parseInt(v2Str);

    const decrypted = this.decrypt(fullString, key, v1, v2);

    const postUrl = decrypted.match(this.urlRegex)?.[1];
    const token = decrypted.match(this.tokenRegex)?.[1];

    return { postUrl, token, decrypted };
  }

  private decrypt(fullString: string, key: string, v1: number, v2: number): string {
    const keyIndexMap: Record<string, number> = {};
    for (let i = 0; i < key.length; i++) {
      keyIndexMap[key[i]] = i;
    }

    let result = '';
    let i = 0;
    const delimiter = key[v2];

    while (i < fullString.length) {
      let segment = '';
      while (i < fullString.length && fullString[i] !== delimiter) {
        segment += fullString[i];
        i++;
      }

      if (segment.length > 0) {
        let baseV2NumberStr = '';
        for (const char of segment) {
          baseV2NumberStr += keyIndexMap[char];
        }
        const charCode = parseInt(baseV2NumberStr, v2) - v1;
        result += String.fromCharCode(charCode);
      }
      i++;
    }

    try {
      return decodeURIComponent(encodeURI(result));
    } catch {
      return result;
    }
  }

  // async extractMP4(videoUrl: URL, quality: string, referer: string): Promise<IVideoSource> {
  //   try {
  //     // 1. Get initial page to find the kwik.cx/f link

  //     const kwikFile = await this.client.get(videoUrl.href, {
  //       headers: { Referer: videoUrl.href },
  //     });

  //     if (!kwikFile.data) {
  //       throw new Error(kwikFile.statusText);
  //     }
  //     const kwikLinkRegex = /https?:\/\/kwik\.cx\/f\/[a-zA-Z0-9]+/i;
  //     const kwikLink = kwikFile.data.match(kwikLinkRegex)?.[0];
  //     if (!kwikLink) throw new Error('Could not find Kwik F-link');

  //     // 2. Load the download page (Impit handles cookies automatically)

  //     // Capture the cookie properly
  //     const setCookie = kwikFile.headers['set-cookie'];
  //     const cookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;

  //     const res2 = await this.client2.fetch(kwikLink, {
  //       method: 'GET',
  //       headers: { Referer: videoUrl.href, Cookie: cookie },
  //     });

  //     if (!res2.ok) {
  //       const errorBody = await res2.text();
  //       throw new Error(`Kwik RES2 GET: ${res2.status} - ${errorBody}`);
  //     }

  //     const html2 = await res2.text();

  //     // console.log('obfuscated HTML containing token', html2);

  //     const cookieArray = res2.headers.getSetCookie();
  //     const cookieString = cookieArray.join('; ');

  //     // 3. Deobfuscate JS to get token and action URL
  //     const { postUrl, token } = this.deobfuscate(html2);
  //     if (!postUrl || !token) throw new Error('Failed to extract POST data');

  //     const finalPostUrl = postUrl.startsWith('http') ? postUrl : new URL(postUrl, kwikLink).href;

  //     // 4. POST the token to get the 302 redirect to the MP4
  //     const body = new URLSearchParams();
  //     body.append('_token', token);

  //     const res3 = await this.client2.fetch(finalPostUrl, {
  //       method: 'POST',
  //       body: body,
  //       headers: {
  //         Referer: kwikLink,
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //         Origin: 'https://kwik.cx',
  //         Cookie: cookieString,
  //       },
  //     });
  //     if (!res3.ok && res3.status !== 302) {
  //       const errorBody = await res3.text();
  //       throw new Error(`Kwik rejected POST: ${res3.status} - ${errorBody}`);
  //     }

  //     const mp4Url = res3.headers.get('location');
  //     if (!mp4Url) throw new Error('MP4 location header not found');

  //     return {
  //       sources: [
  //         {
  //           url: mp4Url,
  //           isM3u8: false,
  //           type: 'mp4',
  //           quality: quality,
  //         },
  //       ],
  //     };
  //   } catch (error: any) {
  //     throw new Error(`CLient Extraction Failed: ${error.message}`);
  //   }
  // }

  async extract(videoUrl: URL, quality: string, referer: string): Promise<IVideoSource> {
    try {
      const response = await this.client.get(videoUrl.href, {
        headers: { Referer: `${referer}/` },
      });

      const scriptMatch = /(eval\(function.*?<\/script>)/s.exec(response.data);
      if (!scriptMatch) throw new Error('No packed script found.');

      const unpacked = unpack(scriptMatch[1]);
      if (!unpacked) throw new Error('Failed to unpack script.');

      const m3u8Match = unpacked.match(/https.*?\.m3u8/);
      if (!m3u8Match) throw new Error('No m3u8 source found.');

      return {
        sources: [
          {
            url: m3u8Match[0],
            isM3u8: true,
            type: 'hls',
            quality: quality,
          },
        ],
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

export default Kwik;
