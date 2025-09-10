import { FetchClient } from '../config/client.js';
import type { IVideoSource, ISubtitles } from '../models/types.js';
import { unpack } from '../utils/unpacker.js';

// Constants for subtitle preferences
const PREF_SUBTITLE_KEY = 'pref_filemoon_sub_lang_key';
const PREF_SUBTITLE_DEFAULT = 'eng';

// Simulated preferences store (replace with localStorage or other mechanism if needed)
const preferences: Record<string, string> = {
  [PREF_SUBTITLE_KEY]: PREF_SUBTITLE_DEFAULT, // Default to English subtitles
};

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
        subtitles: [],
        posterImage: null,
      };

      // Fetch the initial page
      const response = await this.client.get(videoUrl.href);
      const iframeSrcMatch = response.data.match(/<iframe[^>]+src="([^"]+)"/);

      if (!iframeSrcMatch || !iframeSrcMatch[1]) {
        throw new Error('Iframe source not found.');
      }

      // Fetch the iframe content
      const iframeSrc = iframeSrcMatch[1];
      const packerUrlResponse = await this.client.get(iframeSrc, {
        headers: {
          Referer: `${videoUrl.origin}/`,
          Origin: videoUrl.origin,
        },
      });

      const finalScript = unpack(packerUrlResponse.data);

      const m3u8Regex = /file:"(https?:\/\/[^"]+\.m3u8[^"]*)"/;
      const m3u8Match = finalScript.match(m3u8Regex);

      if (m3u8Match && m3u8Match[1]) {
        const sources = await this.parseHlsPlaylist(m3u8Match[1], videoUrl.origin);
        extractedData.sources.push(...sources);
      } else {
        throw new Error('No .m3u8 URL found in script.');
      }

      const subUrlRegex = /fetch\('([^']+\.json[^']*)'\)/;
      const subUrlMatch = finalScript.match(subUrlRegex);
      const subUrl = videoUrl.searchParams.get('sub.info') || (subUrlMatch && subUrlMatch[1]);

      if (subUrl) {
        try {
          const subResponse = await this.client.get(subUrl, {
            headers: {
              Referer: `${videoUrl.origin}/`,
              Origin: videoUrl.origin,
            },
          });
          const subtitleData: Array<{ file: string; label: string }> = JSON.parse(subResponse.data);

          const subPref = preferences[PREF_SUBTITLE_KEY] || PREF_SUBTITLE_DEFAULT;
          const subtitleTracks: ISubtitles[] = subtitleData
            .map((sub, index) => ({
              url: sub.file,
              lang: sub.label,
              default:
                subPref !== '' && sub.label.toLowerCase().includes(subPref.toLowerCase()) && index === 0 ? true : null,
            }))
            .filter(track => subPref === '' || track.lang?.toLowerCase().includes(subPref.toLowerCase()));
          extractedData.subtitles = subtitleTracks;
        } catch (error) {
          console.error('Failed to fetch or parse subtitles:', error);
        }
      }

      const thumbnailRegex = /image:"(https?:\/\/[^"]+\.jpg)"/;
      const thumbnailMatch = finalScript.match(thumbnailRegex);
      if (thumbnailMatch && thumbnailMatch[1]) {
        extractedData.posterImage = thumbnailMatch[1];
      }

      extractedData.download = videoUrl.href.replace('/e/', '/download/').replace('.html', '');

      return extractedData;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  private async parseHlsPlaylist(
    masterUrl: string,
    referer: string,
  ): Promise<
    Array<{
      url: string | null;
      isM3U8: boolean | null;
      type: string | null;
      quality: string | null;
    }>
  > {
    try {
      const response = await this.client.get(masterUrl, {
        headers: {
          Referer: `${referer}/`,
          Origin: referer,
        },
      });
      const playlistText = response.data;

      const lines = playlistText.split('\n');
      const sources: Array<{
        url: string | null;
        isM3U8: boolean | null;
        type: string | null;
        quality: string | null;
      }> = [];

      sources.push({
        url: masterUrl,
        isM3U8: true,
        type: 'hls',
        quality: 'Multi-Quality',
      });

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
          const resolutionMatch = lines[i].match(/RESOLUTION=(\d+x\d+)/);
          const bandwidthMatch = lines[i].match(/BANDWIDTH=(\d+)/);
          let quality: string;

          if (resolutionMatch) {
            quality = ` ${resolutionMatch[1].split('x')[1]}p`;
          } else if (bandwidthMatch) {
            quality = `${Math.round(parseInt(bandwidthMatch[1]) / 1000)}kbps`;
          } else {
            quality = 'Unknown';
          }

          // Get the variant playlist URL
          const variantUrl = lines[i + 1];
          if (variantUrl && !variantUrl.startsWith('#')) {
            const fullUrl = new URL(variantUrl, masterUrl).href;
            sources.push({
              url: fullUrl,
              isM3U8: fullUrl.includes('.m3u8'),
              type: 'hls',
              quality,
            });
          }
        }
      }

      return sources;
    } catch (error) {
      console.error('Failed to parse HLS playlist:', error);

      return [
        {
          url: masterUrl,
          isM3U8: true,
          type: 'hls',
          quality: 'Multi-Quality',
        },
      ];
    }
  }
}

export default FileMoon;
