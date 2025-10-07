import { BaseClass } from '../../models/base-anime.js';
import type { IVideoSource } from '../../models/types.js';

class InternalDefaultHls extends BaseClass {
  async extract(videoUrl: URL): Promise<IVideoSource | null> {
    const extractedData: IVideoSource = {
      sources: [],
    };
    try {
      const response = await this.client.get(videoUrl.href);
      const initialData = response.data.links[0];

      extractedData.sources.push({
        url: initialData.link,
        isM3u8: initialData.link.includes('m3u8'),
        type: initialData.resolutionStr.toLowerCase(),
      });
      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}
export default InternalDefaultHls;
