import { BaseClass } from '../../models/base-anime.js';
import type { IVideoSource } from '../../models/types.js';

class InternalYtMP4 extends BaseClass {
  async extract(videoUrl: URL) {
    const extractedData: IVideoSource = {
      sources: [],
    };
    try {
      extractedData.sources.push({
        url: videoUrl.href,
        isM3u8: videoUrl.href.includes('m3u8'),
        type: 'video/mp4',
      });
      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}
export default InternalYtMP4;
