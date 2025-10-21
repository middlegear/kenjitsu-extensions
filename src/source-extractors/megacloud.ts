import { getClientKey } from '../utils/getClientKey.js';
import { FetchClient } from '../config/client.js';
import type { IVideoSource } from '../types/base.js';

const client = new FetchClient();

class MegaCloud {
  private readonly DEFAULT_CHARSET = Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32));

  private deriveKey(secret: string, nonce: string): string {
    const input = secret + nonce;

    let hash = 0n;
    const multiplier = 31n;
    for (let i = 0; i < input.length; i++) {
      const charCode = BigInt(input.charCodeAt(i));
      hash = charCode + hash * multiplier + (hash << 7n) - hash;
    }
    const modHash = Number(hash % 0x7fffffffffffffffn);

    const xorProcessed = [...input].map(char => String.fromCharCode(char.charCodeAt(0) ^ 247)).join('');

    const shift = (modHash % xorProcessed.length) + 5;
    const rotated = xorProcessed.slice(shift) + xorProcessed.slice(0, shift);

    const reversedNonce = [...nonce].reverse().join('');
    let interleaved = '';
    const maxLen = Math.max(rotated.length, reversedNonce.length);
    for (let i = 0; i < maxLen; i++) {
      interleaved += (rotated[i] || '') + (reversedNonce[i] || '');
    }

    const len = 96 + (modHash % 33);
    const sliced = interleaved.substring(0, len);

    return [...sliced].map(char => String.fromCharCode((char.charCodeAt(0) % 95) + 32)).join('');
  }

  private columnarTranspositionCipher(text: string, key: string): string {
    const cols = key.length;
    const rows = Math.ceil(text.length / cols);

    const grid = Array.from({ length: rows }, () => Array(cols).fill(''));
    const columnOrder = [...key]
      .map((char, idx) => ({ char, idx }))
      .sort((a, b) => a.char.charCodeAt(0) - b.char.charCodeAt(0));

    let i = 0;
    for (const { idx } of columnOrder) {
      for (let row = 0; row < rows; row++) {
        grid[row][idx] = text[i++] || '';
      }
    }

    return grid.flat().join('');
  }

  private deterministicUnshuffle(charset: string[], key: string): string[] {
    let seed = [...key].reduce((acc, char) => (acc * 31n + BigInt(char.charCodeAt(0))) & 0xffffffffn, 0n);

    const random = (limit: number): number => {
      seed = (seed * 1103515245n + 12345n) & 0x7fffffffn;
      return Number(seed % BigInt(limit));
    };

    const result = [...charset];
    for (let i = result.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  private async fetchKey(): Promise<string> {
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

  public decrypt(secret: string, nonce: string, encrypted: string, rounds = 3): string {
    let data = Buffer.from(encrypted, 'base64').toString('utf-8');
    const keyphrase = this.deriveKey(secret, nonce);

    for (let round = rounds; round >= 1; round--) {
      const passphrase = keyphrase + round;

      let seed = [...passphrase].reduce((acc, char) => (acc * 31n + BigInt(char.charCodeAt(0))) & 0xffffffffn, 0n);
      const random = (limit: number): number => {
        seed = (seed * 1103515245n + 12345n) & 0x7fffffffn;
        return Number(seed % BigInt(limit));
      };

      data = [...data]
        .map(char => {
          const idx = this.DEFAULT_CHARSET.indexOf(char);
          if (idx === -1) return char;
          const offset = random(95);
          return this.DEFAULT_CHARSET[(idx - offset + 95) % 95];
        })
        .join('');

      data = this.columnarTranspositionCipher(data, passphrase);

      const shuffled = this.deterministicUnshuffle(this.DEFAULT_CHARSET, passphrase);
      const mapping: Record<string, string> = {};
      shuffled.forEach((c, i) => (mapping[c] = this.DEFAULT_CHARSET[i]));
      data = [...data].map(char => mapping[char] || char).join('');
    }
    const lengthStr = data.slice(0, 4);
    let length = parseInt(lengthStr, 10);
    if (isNaN(length) || length <= 0 || length > data.length - 4) {
      console.error('Invalid length in decrypted string');
      return data;
    }
    return data.slice(4, 4 + length);
  }

  async extract(videoUrl: URL, referer: string): Promise<IVideoSource> {
    const extractedData: IVideoSource = {
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
        const secret = await this.fetchKey();
        const decoded = this.decrypt(secret as string, clientKey, initialResponse.sources);

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
          isM3u8: s.type === 'hls',
          type: s.type,
        }));
      } else {
        if (initialResponse.sources && Array.isArray(initialResponse.sources)) {
          extractedData.sources = initialResponse.sources.map((s: any) => ({
            url: s.file,
            isM3u8: s.type === 'hls',
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
      throw new Error((error as Error).message);
    }
  }
}

export default MegaCloud;
