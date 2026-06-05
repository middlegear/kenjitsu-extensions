import type { ClientOptions } from '../config/client.js';
import { BaseClass } from '../models/base.js';
import type { ISourceBaseResponse, IVideoSource } from '../types/base.js';
import { unpack } from '../utils/unpacker.js';

class KwiK extends BaseClass {
  constructor(options: ClientOptions) {
    super(options);
  }

  async extract(videoUrl: URL, quality: string, referer: string): Promise<ISourceBaseResponse<IVideoSource | null>> {
    try {
      const response = await this.client.fetch(videoUrl.href, {
        method: 'GET',
        headers: { Referer: `${referer}/` },
      });

      if (!response.ok) {
        return { headers: { Referer: null }, data: null, error: response.statusText, status: response.status };
      }
      const result = await response.text();
      const scriptMatch = /(eval\(function.*?<\/script>)/s.exec(result);
      if (!scriptMatch) {
        return {
          headers: { Referer: null },
          data: null,
          error: 'No packed script found.',
          status: 404,
        };
      }

      const unpacked = unpack(scriptMatch[1]);
      if (!unpacked) throw new Error('Failed to unpack script.');

      const m3u8Match = unpacked.match(/https.*?\.m3u8/);
      if (!m3u8Match) {
        return {
          headers: { Referer: null },
          data: null,
          error: 'No hls file found.',
          status: 404,
        };
      }
      const extractedData: IVideoSource = {
        sources: [],
      };

      extractedData.sources.push({
        url: m3u8Match[0],
        isM3u8: m3u8Match[0].includes('m3u8'),
        type: m3u8Match[0].includes('m3u8') ? 'hls' : 'Unknown',
        quality: quality,
      });

      return {
        headers: { Referer: `${videoUrl.origin}/` },
        data: extractedData,
      };
    } catch (error: any) {
      return {
        headers: { Referer: null },
        data: null,
        error: error instanceof Error ? error.message : 'Unknown Error',
        status: 500,
      };
    }
  }
}

export default KwiK;
