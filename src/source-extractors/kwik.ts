// src/services/kwik.ts
import { FetchClient } from '../config/client.js';
import type { IVideoSource } from '../models/types.js';
import { unpack } from '../utils/unpacker.js';

class Kwik {
  protected client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }

  async extract(videoUrl: URL, quality: string, referer: string) {
    try {
      const extractedData: IVideoSource = {
        sources: [],
        subtitles: [],
      };
      console.log(referer);

      const response = await fetch(videoUrl.href, {
        headers: {
          //   Host: 'kwik.si',
          //   Connection: 'keep-alive',
          Referer: `${referer}/`,
          //   'User-Agent':
          //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          //   Accept:
          //     'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          //   'Accept-Encoding': 'gzip, deflate, br, zstd',
          //   'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
          //   'Upgrade-Insecure-Requests': '1',
          //   'Sec-Fetch-Dest': 'iframe',
          //   'Sec-Fetch-Mode': 'navigate',
          //   'Sec-Fetch-Site': 'cross-site',
          //   'Sec-Fetch-User': '?1',
          //   'Sec-CH-UA': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
          //   'Sec-CH-UA-Platform': '"Windows"',
          //   'Sec-CH-UA-Mobile': '?0',
        },
      });

      const data = await response.text();
      const scriptMatch = /(eval\(function.*?<\/script>)/s.exec(data);
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
        isM3U8: m3u8Match[0]?.includes('m3u8'),
        type: m3u8Match[0].includes('m3u8') ? 'hls' : 'idk',
        quality: quality,
      });
      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}

export default Kwik;
