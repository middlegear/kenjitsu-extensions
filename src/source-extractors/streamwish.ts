import type { IVideoSource } from '../types/base.js';
import { unpack } from '../utils/unpacker.js';

// this class need to be refactored so i pass embed src url under the URL interface object for resuablity
// this server has been omited from allanime
class StreamWish {
  private readonly baseUrl: string = 'https://yesmovies.baby';

  async extract(data: string): Promise<IVideoSource | null> {
    //
    const extractedData: IVideoSource = {
      subtitles: [],
      sources: [],
    };
    if (!data) throw new Error('Missing data to unpack').message;
    try {
      const final = unpack(data);

      const linksRegex = /var links=({.+?});/;
      const linksMatch = final?.match(linksRegex);

      if (!linksMatch || !linksMatch[1]) {
        throw new Error('Could not find the links object.').message;
      }

      const linksJsonString = linksMatch[1];
      let linksObject;

      linksObject = JSON.parse(linksJsonString);

      const domain = this.baseUrl;

      for (const key in linksObject) {
        if (linksObject.hasOwnProperty(key) && linksObject[key]) {
          let url = linksObject[key];

          if (url.includes('.m3u8')) {
            if (url.startsWith('/')) {
              url = `${domain}${url}`;
            }

            extractedData.sources.push({
              url: url,
              isM3u8: url.includes('m3u8'),
              type: url.includes('m3u8') ? 'hls' : 'raise issue for investigation',
              // default: url.includes(domain),
            });
          }
        }
      }

      const subtitleMatches = final?.match(/{file:"([^"]+)",(label:"([^"]+)",)?kind:"(thumbnails|captions)"/g) || [];

      extractedData.subtitles = subtitleMatches.map(item => {
        const lang = item?.match(/label:"([^"]+)"/)?.[1] ?? '';
        const url = item?.match(/file:"([^"]+)"/)?.[1] ?? '';
        const kind = item?.match(/kind:"([^"]+)"/)?.[1] ?? '';
        if (kind.includes('thumbnail')) {
          return {
            lang: kind,
            url: `https://streamhg.com${url}`,
          };
        }
        return {
          lang: lang,
          url: url,
        };
      });
      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}
export default StreamWish;
