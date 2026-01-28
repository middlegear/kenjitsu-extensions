import { BaseClass } from '../models/base.js';
import type { IVideoSource } from '../types/base.js';

import { unpack } from '../utils/unpacker.js';

class Kwik extends BaseClass {
  private readonly paramRegex = /\("(\w+)",\d+,"(\w+)",(\d+),(\d+),\d+\)/;
  private readonly urlRegex = /action="([^"]+)"/;
  private readonly tokenRegex = /value="([^"]+)"/;

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
    const delimiter = key[v2]; // The separator character

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

  constructor() {
    super();
  }

  /**
   *  This extract method successfully unpacks the m3u8 file from kwik. It serves as a fallback incase the mp4 link could not be found
   * @param videoUrl
   * @param quality
   * @param referer
   * @returns
   */
  async extract(videoUrl: URL, quality: string, referer: string) {
    try {
      const extractedData: IVideoSource = {
        sources: [],
      };

      const response = await this.client.get(videoUrl.href, {
        headers: {
          Referer: `${referer}/`,
        },
      });

      const scriptMatch = /(eval\(function.*?<\/script>)/s.exec(response.data);
      if (!scriptMatch) {
        throw new Error('No packed script found in response.');
      }

      // safely unpack instead of eval
      const unpacked = unpack(scriptMatch[1]);

      if (!unpacked) {
        throw new Error('Failed to unpack script.');
      }

      const m3u8Match = unpacked.match(/https.*?\.m3u8/);
      if (!m3u8Match) {
        throw new Error('No m3u8 source found in unpacked script.');
      }
      extractedData.sources.push({
        url: m3u8Match[0],
        isM3u8: m3u8Match[0]?.includes('m3u8'),
        type: m3u8Match[0].includes('m3u8') ? 'hls' : 'idk',
        quality: quality,
      });
      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  async extractMP4(videoUrl: URL, quality: string, referer: string) {
    try {
      // 1. Get the initial page
      const kwikFile = await this.client.get(videoUrl.href, {
        headers: { Referer: referer },
      });

      const kwikLinkRegex = /https?:\/\/kwik\.cx\/f\/[a-zA-Z0-9]+/i;
      const kwikLink = kwikFile.data.match(kwikLinkRegex)?.[0];
      if (!kwikLink) throw new Error('Could not find Kwik F-link');

      // 2. Load the download page
      const kwikPage = await this.client.get(kwikLink, {
        headers: { Referer: videoUrl.href },
      });

      // Capture the cookie properly
      const setCookie = kwikPage.headers['set-cookie'];
      const cookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;

      // 3. Deobfuscate
      const { postUrl, token } = this.deobfuscate(kwikPage.data);

      // DEBUG: Ensure postUrl is an absolute URL
      const finalPostUrl = postUrl?.startsWith('http') ? postUrl : new URL(postUrl!, kwikLink).href;

      if (!finalPostUrl || !token) throw new Error('Failed to extract POST data');

      const params = new URLSearchParams();
      params.append('_token', token);

      const response = await this.client.post(finalPostUrl, params.toString(), {
        headers: {
          Referer: kwikLink,
          Cookie: cookie,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Origin: 'https://kwik.cx',
        },
      });

      const mp4Url = response.headers['location'];

      return {
        sources: [
          {
            url: mp4Url,
            isM3u8: false,
            type: 'mp4',
            quality: quality,
          },
        ],
      };
    } catch (error) {
      // If POST is disallowed, Kwik might have updated to use a GET with a token
      console.error('Extraction error (405?):', (error as Error).message);
      throw error;
    }
  }
}

export default Kwik;
