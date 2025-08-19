import { Decrypter } from '../utils/decrypt.js';
import { getClientKey } from '../utils/getClientKey.js';
import { FetchClient } from '../config/client.js';

export type sources = {
  url: string;
  isM3U8: boolean;
  type: string;
};

export type subtitles = {
  url: string;
  lang: string;
  default?: boolean;
};

export type ExtractedData = {
  subtitles: subtitles[];
  sources: sources[];
};
const client = new FetchClient();
class VidCloud {
  private primaryKeyUrl = 'https://raw.githubusercontent.com/yogesh-hacker/MegacloudKeys/refs/heads/main/keys.json';
  async fetchKey(url: string): Promise<string> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      if (typeof jsonData === 'object' && jsonData !== null && 'rabbit' in jsonData) {
        const key = jsonData.rabbit;
        if (typeof key === 'string' && key.length > 0) {
          return key;
        }
      }

      throw new Error(`Invalid 'rabbit' field or key not found in JSON from ${url}.`);
    } catch (error) {
      throw new Error(`Failed to fetch key from ${url}: ${error as Error}`);
    }
  }

  async extract(videoUrl: URL, referer: string = 'https://flixhq.to/'): Promise<ExtractedData | string> {
    const extractedData: ExtractedData = {
      subtitles: [],
      sources: [],
    };

    const match = /\/([^\/\?]+)(?:\?|$)/.exec(videoUrl.href);
    const sourceId = match?.[1];

    if (!sourceId) {
      return new Error('Failed to fetch sourceId').message;
    }

    const fullPathname = videoUrl.pathname;
    const lastSlashIndex = fullPathname.lastIndexOf('/');
    const basePathname = fullPathname.substring(0, lastSlashIndex);
    const sourcesBaseUrl = `${videoUrl.origin}${basePathname}/getSources`;
    try {
      const clientKey = await getClientKey(videoUrl.href, referer);
      if (!clientKey) {
        throw new Error('Failed to fetch ClientKey');
      }

      const { data: initialResponse } = await client.get(sourcesBaseUrl, {
        params: {
          id: sourceId,
          _k: clientKey,
        },

        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Referer: videoUrl.href,
        },
      });

      if (!initialResponse.sources) {
        throw new Error('Boys we are fucked.It will take a while to fix this. Touch some grass');
      }

      if (initialResponse.encrypted) {
        const key = await this.fetchKey(this.primaryKeyUrl);
        const decryptor = new Decrypter();
        const decrypted = decryptor.decrypt(initialResponse.sources, clientKey, key);
        let sources;
        try {
          sources = JSON.parse(decrypted);
        } catch {
          throw new Error('Decrypted sources is not valid JSON.');
        }
        if (!Array.isArray(sources)) {
          throw new Error('Decrypted sources is not an array.');
        }

        extractedData.sources = sources.map((s: any) => ({
          url: s.file,
          isM3U8: s.type === 'hls',
          type: s.type,
        }));
      } else {
        if (initialResponse.sources && Array.isArray(initialResponse.sources)) {
          extractedData.sources = initialResponse.sources.map((s: any) => ({
            url: s.file,
            isM3U8: s.type === 'hls',
            type: s.type,
          }));
        }
      }

      if (initialResponse.tracks && Array.isArray(initialResponse.tracks) && initialResponse.tracks.length > 0) {
        extractedData.subtitles = initialResponse.tracks.map((track: any) => ({
          url: track.file,
          lang: track.label || track.kind || 'Unknown',
          default: track.default || false,
        }));
      }

      return extractedData;
    } catch (error) {
      return error instanceof Error ? error.message : 'Fatal Error';
    }
  }
}

export default VidCloud;
