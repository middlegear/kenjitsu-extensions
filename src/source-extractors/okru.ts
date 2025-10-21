import { FetchClient } from '../config/client.js';

import * as cheerio from 'cheerio';
import type { IVideoSource } from '../types/base.js';

class Okru {
  protected client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }

  private ParseHtml($: cheerio.CheerioAPI) {
    const selector: cheerio.SelectorType = 'div.vid-card.vid-card__fullscreen.h-mod';
    const dataOptions = $(selector).find('div').attr('data-options');
    if (!dataOptions) {
      throw new Error('This provider has no valid streaming source');
    }
    return JSON.parse(dataOptions as string);
  }

  async extract(videoUrl: URL): Promise<IVideoSource> {
    try {
      const extractedData: IVideoSource = {
        sources: [],
      };

      const response = await this.client.get(videoUrl.href);

      if (!response.data) {
        throw new Error(response.statusText);
      }

      const json = this.ParseHtml(cheerio.load(response.data));

      const data = JSON.parse(json.flashvars.metadata);

      const failoverHosts = data.failoverHosts || [];

      const downloadUrl = data.videos.find((v: { name: string }) => v.name === 'hd' || v.name == 'full');
      extractedData.download = downloadUrl.url;

      const hlsUrls = data.ondemandHls || data.hlsManifestUrl;
      extractedData.sources.push({
        url: hlsUrls,
        isM3u8: hlsUrls.includes('m3u8'),
        type: hlsUrls.includes('m3u8') ? 'hls' : 'idk bro',
      });

      /// dash urls have been disabled
      // const possibleDashUrls = data.ondemandDash || data.metadataUrl;
      if (data.ondemandDash)
        extractedData.sources.push({
          url: data.ondemandDash,
          isM3u8: data.ondemandDash.includes('m3u8'),
          type: data.ondemandDash.includes('mpd') ? 'dash' : 'idk',
        });

      failoverHosts.forEach((host: string) => {
        if (host) {
          const failoverHls = hlsUrls.replace(/^(https?:\/\/)[^\/]+/, `$1${host}`);
          // const failoverDash = possibleDashUrls.replace(/^(https?:\/\/)[^\/]+/, `$1${host}`);
          if (failoverHls && hlsUrls) {
            extractedData.sources.push({
              url: failoverHls,
              isM3u8: failoverHls.includes('m3u8'),
              type: failoverHls.includes('m3u8') ? 'hls' : 'idk',
            });
          }
          /// dash urls have been disabled
          // if (failoverDash && possibleDashUrls) {
          //   extractedData.sources.push({
          //     url: failoverDash,
          //     isM3u8: failoverDash.includes('m3u8'),
          //     type: failoverDash.includes('mpd') ? 'dash' : 'idk',
          //   });
          // }
        }
      });

      return extractedData;
    } catch (error) {
      throw new Error(error as string);
    }
  }
}

export default Okru;
