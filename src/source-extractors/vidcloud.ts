import { getClientKey } from '../utils/getClientKey.js';
import { FetchClient } from '../config/client.js';
import type { IVideoSource } from '../models/types.js';

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
  private DefaultCharacterSet: string[] = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));
  private readonly characterSet: string[];

  constructor(characterSet: string[] = this.DefaultCharacterSet) {
    this.characterSet = [...characterSet];
  }

  private LinearCongruentialPrng(seed: number): () => number {
    let currentSeed = seed >>> 0;
    return () => {
      currentSeed = (currentSeed * 16807) % 2147483647;
      return currentSeed;
    };
  }

  private hashKeyphraseToSeed(keyphrase: string): number {
    let seed = 0;
    for (let i = 0; i < keyphrase.length; i++) {
      seed = (seed << 5) - seed + keyphrase.charCodeAt(i);
      seed |= 0;
    }
    return seed;
  }

  private FisherYatesShuffle(array: string[], keyphrase: string): string[] {
    const seed = this.hashKeyphraseToSeed(keyphrase);
    const prng = this.LinearCongruentialPrng(seed);
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = prng() % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  private ColumnarTranspositionCipher(encryptedText: string, keyphrase: string): string {
    const cols = keyphrase.length;
    const key = keyphrase.split('').map((char, index) => ({ char, index }));
    const sortedKey = key.sort((a, b) => a.char.localeCompare(b.char));

    const numRows = Math.ceil(encryptedText.length / cols);
    const numFullCols = encryptedText.length % cols || cols;

    const decryptedGrid: string[][] = Array.from({ length: numRows }, () => Array(cols).fill(''));

    let charIndex = 0;
    for (const { index: originalColIndex } of sortedKey) {
      for (let row = 0; row < numRows; row++) {
        if (row === numRows - 1 && originalColIndex >= numFullCols) {
          continue;
        }
        decryptedGrid[row][originalColIndex] = encryptedText[charIndex++];
      }
    }
    return decryptedGrid.flat().join('');
  }

  public decrypt(encrypted: string, nonce: string, secret: string, iterations: number = 3): string {
    if (!encrypted || !nonce || !secret) {
      throw new Error('Missing encrypted data, nonce, or secret.');
    }

    let result: string;
    try {
      result = Buffer.from(encrypted, 'base64').toString('utf8');
    } catch (error) {
      throw new Error(`Base64 decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const keyphrase = secret + nonce;

    for (let i = 1; i <= iterations; i++) {
      const passphrase = keyphrase + i;

      const shuffled = this.FisherYatesShuffle(this.characterSet, passphrase);
      const mapping = new Map<string, string>();
      this.characterSet.forEach((char, idx) => {
        mapping.set(shuffled[idx], char);
      });
      result = result
        .split('')
        .map(c => mapping.get(c) || c)
        .join('');

      result = this.ColumnarTranspositionCipher(result, passphrase);

      const seed = this.hashKeyphraseToSeed(passphrase);
      const prng = this.LinearCongruentialPrng(seed);
      result = result
        .split('')
        .map(char => {
          const charIndex = this.characterSet.indexOf(char);
          if (charIndex === -1) {
            return char;
          }
          const offset = prng() % this.characterSet.length;
          return this.characterSet[(charIndex - offset + this.characterSet.length) % this.characterSet.length];
        })
        .join('');
    }

    const lengthStr = result.slice(0, 4);
    const content = result.slice(4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length) || length <= 0 || length > content.length) {
      console.error('Invalid length prefix. Returning full decrypted string.');
      return content;
    }

    return content.slice(0, length);
  }

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

  async extract(videoUrl: URL, referer: string = 'https://flixhq.to/'): Promise<IVideoSource> {
    const extractedData: IVideoSource = {
      subtitles: [],
      sources: [],
    };

    const match = /\/([^\/\?]+)(?:\?|$)/.exec(videoUrl.href);
    const sourceId = match?.[1];

    if (!sourceId) {
      throw new Error('Failed to fetch sourceId').message;
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

        const decrypted = this.decrypt(initialResponse.sources, clientKey, key);
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
      throw new Error(error as string).message;
    }
  }
}

export default VidCloud;
