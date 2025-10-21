import { FetchClient } from '../config/client.js';
import type { IVideoSource } from '../types/base.js';

import { unpack } from '../utils/unpacker.js';

class FileMoon {
  protected client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }

  async extract(videoUrl: URL): Promise<IVideoSource> {
    try {
      const extractedData: IVideoSource = {
        download: null,
        sources: [],
      };

      const response = await this.client.get(videoUrl.href);

      const iframeSrcMatch = response.data.match(/<iframe[^>]+src="([^"]+)"/);

      if (!iframeSrcMatch || !iframeSrcMatch[1]) {
        throw new Error('Iframe source not found.');
      }

      const iframeSrc = iframeSrcMatch[1];
      const packerUrlResponse = await this.client.get(iframeSrc, {
        headers: {
          referer: videoUrl.origin,
        },
      });

      if (!packerUrlResponse.data) {
        throw new Error(packerUrlResponse.statusText);
      }
      const finalScript = unpack(packerUrlResponse.data);

      const m3u8Regex = /file:"(https?:\/\/[^"]+\.m3u8[^"]*)"/;
      const m3u8Match = finalScript.match(m3u8Regex);

      if (!m3u8Match) {
        throw new Error('No valid m3u8 files found');
      }

      if (m3u8Match && m3u8Match[1]) {
        extractedData.sources.push({
          url: m3u8Match[1],
          isM3u8: m3u8Match[1].includes('m3u8'),
          type: m3u8Match[1].includes('m3u8') ? 'hls' : 'idk',
          quality: 'This stream is IP-bound and tokenized.',
        });
      }

      const thumbnailRegex = /image:"(https?:\/\/[^"]+\.jpg)"/;
      const thumbnailMatch = finalScript.match(thumbnailRegex);
      if (thumbnailMatch && thumbnailMatch[1]) {
        extractedData.posterImage = thumbnailMatch[1];
      }

      extractedData.download = videoUrl.href.replace('/e/', '/download/').replace('.html', '');

      return extractedData;
    } catch (error) {
      throw new Error(error as string);
    }
  }
}

export default FileMoon;
