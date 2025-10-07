import type { IVideoSource } from '../../main.js';
import { BaseClass } from '../../models/base-anime.js';

class InternalAK extends BaseClass {
  async extract(videoUrl: URL): Promise<IVideoSource | null> {
    const extractedData: IVideoSource = {
      sources: [],
    };
    try {
      const response = await this.client.get(videoUrl.href);
      const initialData = response.data.links[0];
      extractedData.sources = initialData.rawUrls.vids.map((s: any) => ({
        url: s.url,
        isM3u8: s.url.includes('m3u8'),
        type: s.mime_type,
        quality: `${s.height}p`,
      }));
      extractedData.tracks = initialData.rawUrls.audios.map((t: any) => ({
        url: t.url,
        type: t.mime_type,
        quality: `${Math.round(t.bandwidth / 1000)}kbps`,
      }));

      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}
export default InternalAK;
