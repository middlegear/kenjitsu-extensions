import { FetchClient } from '../config/client.js';
import type { IVideoSource } from '../models/types.js';
/**
 * Class used to extract sources from mp4 upload
 * expects an embed url which yields to html containing  streaming sources and download url if present
 */
class MP4Upload {
  protected client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }

  async extract(videoUrl: URL): Promise<IVideoSource | null> {
    try {
      const extractedData: IVideoSource = {
        download: null,
        sources: [],
      };
      const response = await this.client.get(videoUrl.href);

      if (!response.data) {
        throw new Error(response.statusText);
      }
      const html = response.data;

      const playerSrcMatch = html.match(/player\.src\(\{\s*type:\s*"([^"]+)",\s*src:\s*"([^"]+)"\s*\}\)/);

      const playerPosterMatch = html.match(/player\.poster\("([^"]+)"\)/);
      const downloadUrlMatch = html.match(/url:\s*"([^"]+)"/);

      const sourceUrl = playerSrcMatch ? { type: playerSrcMatch[1], src: playerSrcMatch[2] } : null;

      if (!sourceUrl) {
        throw new Error('No streaming source found');
      }
      const posterImage = playerPosterMatch ? playerPosterMatch[1] : null;

      const download = downloadUrlMatch ? downloadUrlMatch[1] : null;

      extractedData.download = download;
      extractedData.sources.push({
        url: sourceUrl?.src,
        isM3u8: sourceUrl?.type.includes('m3u8'),
        type: sourceUrl?.type,
      });
      extractedData.posterImage = posterImage;
      return extractedData || null;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}
export default MP4Upload;
