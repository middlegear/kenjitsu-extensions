import { url } from 'inspector';
import { FetchClient } from '../config/client.js';
import type { IVideoSource } from '../models/types.js';
import * as cheerio from 'cheerio';

class Okru {
  protected client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }

  private ParseHtml($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = 'div.vid-card.vid-card__fullscreen.h-mod';
    const dataOptions = $(selector).find('div').attr('data-options');

    return JSON.parse(dataOptions as string);
  }

  async extract(videoUrl: URL) {
    try {
      const extractedData: IVideoSource = {
        download: null,
        sources: [],
        subtitles: [],
      };

      const response = await this.client.get(videoUrl.href);
      const json = this.ParseHtml(cheerio.load(response.data));
      const data = JSON.parse(json.flashvars.metadata);

      const failoverHosts = data.failoverHosts || [];

      extractedData.download = data.videos[0].url;
      extractedData.sources.push({
        url: data.ondemandHls,
        isM3U8: data.ondemandHls?.includes('m3u8'),
        type: data.ondemandHls.includes('m3u8') ? 'hls' : 'idk',
      });
      extractedData.sources.push({
        url: data.ondemandDash,
        isM3U8: data.ondemandDash.includes('m3u8'),
        type: data.ondemandDash.includes('mpd') ? 'dash' : 'idk',
      });

      failoverHosts.forEach((host: string) => {
        if (host) {
          const failoverHls = data.ondemandHls.replace(/^(https?:\/\/)[^\/]+/, `$1${host}`);
          const failoverDash = data.ondemandDash.replace(/^(https?:\/\/)[^\/]+/, `$1${host}`);

          if (failoverHls) {
            extractedData.sources.push({
              url: failoverHls,
              isM3U8: failoverHls.includes('m3u8'),
              type: failoverHls.includes('m3u8') ? 'hls' : 'idk',
            });
          }
          if (failoverDash) {
            extractedData.sources.push({
              url: failoverDash,
              isM3U8: failoverDash.includes('m3u8'),
              type: failoverDash.includes('mpd') ? 'dash' : 'idk',
            });
          }
        }
      });

      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}

export default Okru;
