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

      const response = await fetch(videoUrl.href, {
        headers: {
          Referer: `${referer}/`,
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
        isM3u8: m3u8Match[0]?.includes('m3u8'),
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
