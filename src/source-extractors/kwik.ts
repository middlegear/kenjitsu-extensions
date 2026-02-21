import { BaseClass } from '../models/base.js';
import type { IVideoSource } from '../types/base.js';
import { unpack } from '../utils/unpacker.js';

class Kwik extends BaseClass {
  constructor() {
    super();
  }

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
