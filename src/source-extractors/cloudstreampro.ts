import type { CheerioAPI } from 'cheerio';
import { ScrapeCloudStreampro } from '../provider/movies/embed/scraper.js';
import type { subtitles, sources, ExtractedData } from './vidcloud.js';

class CloudStreamPro {
  //
  extract(data: CheerioAPI): ExtractedData {
    const result = ScrapeCloudStreampro(data);

    const sources: sources[] = [];
    if (result.file) {
      sources.push({
        url: result.file,
        isM3U8: result.file.endsWith('.m3u8'),
        type: result.file.endsWith('.m3u8') ? 'hls' : 'unknown',
      });
    }

    const extractedData: ExtractedData = {
      subtitles: [], // there is none will have to implement fetching logic
      sources: sources,
    };

    return extractedData;
  }
}

export default CloudStreamPro;
