import { BaseClass } from '../models/base-anime.js';

export class MegaUp extends BaseClass {
  private readonly tokenUrl: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovefeet=';
  private readonly decodeUrlIframe: string = 'https://ilovekai.simplepostrequest.workers.dev/?ilovearmpits=';
  private readonly decodeM3u8: string = 'https://azartx-tools.vercel.app/api/dec-mega';
  private headers = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.5',
    'Alt-Used': 'megaup.live',
    Connection: 'keep-alive',
    Host: 'megaup.live',
    Priority: 'u=0, i',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-GPC': '1',
    TE: 'trailers',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
  };

  constructor() {
    super();
  }

  async GenerateToken(token: string) {
    console.log('[MegaUp] GenerateToken called with:', token);

    try {
      const url = `${this.tokenUrl}${encodeURIComponent(token)}`;
      console.log('[MegaUp] Requesting token URL:', url);

      const response = await this.client.get(url);
      console.log('[MegaUp] Response status:', response.status);
      console.log('[MegaUp] Response data:', response.data);

      return response.data;
    } catch (error) {
      console.error('[MegaUp] GenerateToken error:', error);
      return { error: error instanceof Error ? error.message : 'GenerateToken function failed' };
    }
  }

  async DecodeIframeData(iframe: string) {
    console.log('[MegaUp] DecodeIframeData called with:', iframe);

    try {
      const url = `${this.decodeUrlIframe}${iframe}`;
      console.log('[MegaUp] Requesting iframe decode URL:', url);

      const response = await this.client.get(url);
      console.log('[MegaUp] Response status:', response.status);
      console.log('[MegaUp] Response data:', response.data);

      return response.data;
    } catch (error) {
      console.error('[MegaUp] DecodeIframeData error:', error);
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  async decrypt(data: string) {
    console.log('[MegaUp] decrypt called with data length:', data?.length);

    try {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0';
      const url = `${this.decodeM3u8}?text=${data}&agent=${userAgent}`;

      console.log('[MegaUp] Requesting decrypt URL:', url);

      const response = await this.client.get(url);
      console.log('[MegaUp] Response status:', response.status);
      console.log('[MegaUp] Response data keys:', Object.keys(response.data || {}));

      return response.data.result;
    } catch (error) {
      console.error('[MegaUp] decrypt error:', error);
      return { error: error instanceof Error ? error.message : 'Decode function failed' };
    }
  }

  public async extract(videoUrl: URL) {
    console.log('[MegaUp] extract called with URL:', videoUrl.href);

    const url = videoUrl.href.replace(/\/(e|e2)\//, '/media/');
    console.log('[MegaUp] Rewritten URL:', url);

    try {
      console.log('[MegaUp] Fetching media JSON with headers:', this.headers);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      console.log('[MegaUp] Response status:', response.status);
      const text = await response.text();
      console.log('[MegaUp] Raw response text:', text.slice(0, 500)); // limit size

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let encrypted;
      try {
        encrypted = JSON.parse(text);
        console.log('[MegaUp] Parsed encrypted JSON keys:', Object.keys(encrypted));
      } catch (err) {
        console.error('[MegaUp] Failed to parse JSON response:', err);
        throw err;
      }

      const decryptedResult = await this.decrypt(encrypted.result);
      console.log('[MegaUp] Decrypted result keys:', Object.keys(decryptedResult || {}));

      if (!decryptedResult) {
        throw new Error('Failed to decode video data.');
      }

      const extractedData = {
        sources: (decryptedResult.sources || []).map((s: { file: string }) => ({
          url: s.file,
          isM3U8: s.file.includes('.m3u8') || s.file.endsWith('m3u8'),
        })),
        subtitles: (decryptedResult.tracks || []).map((t: { kind: any; file: any }) => ({
          kind: t.kind,
          url: t.file,
        })),
        download: decryptedResult.download,
      };

      console.log('[MegaUp] Final extracted data:', extractedData);
      return extractedData;
    } catch (error) {
      console.error('[MegaUp] extract error:', error);
      throw new Error(error as string);
    }
  }
}
