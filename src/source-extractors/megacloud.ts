import type { ASource } from '../types/types.js';
import { getClientKey } from '../utils/getClientKey.js';
import { MegacloudDecryptor } from '../utils/megaclouddecrypt.js';
import { FetchClient } from '../config/client.js';

const client = new FetchClient();

class MegaCloud {
  readonly referer: string = `https://hianime.to/`;

  async fetchKey(): Promise<string> {
    const url = 'https://raw.githubusercontent.com/yogesh-hacker/MegacloudKeys/refs/heads/main/keys.json';
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();

      if (typeof jsonData === 'object' && jsonData !== null && 'mega' in jsonData) {
        const key = jsonData.mega;
        if (typeof key === 'string' && key.length > 0) {
          return key;
        }
        console.warn(`'mega' field is empty or not a string from ${url}.`);
      }
      throw new Error(`Invalid 'mega' field or key not found in JSON from ${url}.`);
    } catch (error) {
      throw new Error(`Failed to fetch key from ${url}: ${error as Error}`);
    }
  }

  async extract(videoUrl: URL): Promise<ASource | string> {
    const extractedData: ASource = {
      intro: {
        start: 0,
        end: 0,
      },
      outro: {
        start: 0,
        end: 0,
      },
      subtitles: [],
      sources: [],
    };

    const match = /\/([^\/\?]+)(?:\?|$)/.exec(videoUrl.href);
    const sourceId = match?.[1];
    if (!sourceId) {
      throw new Error('Failed to extract source ID');
    }

    const fullPathname = videoUrl.pathname;
    const lastSlashIndex = fullPathname.lastIndexOf('/');
    const basePathname = fullPathname.substring(0, lastSlashIndex);

    const sourcesBaseUrl = `${videoUrl.origin}${basePathname}/getSources`;

    try {
      const clientKey = await getClientKey(videoUrl.href, this.referer);
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
        const decryptor = new MegacloudDecryptor();

        const secret = await this.fetchKey();
        const decoded = decryptor.decrypt(secret as string, clientKey, initialResponse.sources);

        let sources;
        try {
          sources = JSON.parse(decoded);
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

      extractedData.intro = initialResponse.intro ?? { start: 0, end: 0 };
      extractedData.outro = initialResponse.outro ?? { start: 0, end: 0 };

      if (initialResponse.tracks && Array.isArray(initialResponse.tracks) && initialResponse.tracks.length > 0) {
        extractedData.subtitles = initialResponse.tracks.map((track: any) => ({
          url: track.file,
          lang: track.label || track.kind || 'Unknown',
          default: track.default || false,
        }));
      }

      return extractedData;
    } catch (error) {
      return error instanceof Error ? error.message : 'Boys we are screwed';
    }
  }
}

export default MegaCloud;
