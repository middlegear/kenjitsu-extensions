import { FetchClient } from '../config/client.js';
import type { ISource } from '../types/base.js';

export abstract class VideoExtractor {
  protected client: FetchClient;

  constructor() {
    this.client = new FetchClient();
  }

  /**
   * Parses a master.m3u8 file into quality streams.
   * Returns an array of variants with resolution, bandwidth, and URL.
   */
  protected async parseM3u8(masterUrl: string): Promise<ISource[]> {
    try {
      const response = await this.client.get(masterUrl);
      const text = response.data as string;

      const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);
      const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      const variants: ISource[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
          const attrs = this.parseAttributes(lines[i]);
          const url = lines[i + 1];

          const bandwidth = parseInt(attrs['BANDWIDTH'] || '0', 10);
          const isM3u8 = masterUrl.includes('m3u8');
          const resolution = attrs['RESOLUTION'] || '';
          const quality = resolution ? resolution.split('x')[1] + 'p' : `${Math.round(bandwidth / 1000)}kbps`;

          variants.push({
            quality,
            isM3u8,
            type: 'hls',
            url: this.makeAbsoluteUrl(url, baseUrl),
          });
        }
      }

      return variants;
    } catch (error) {
      console.error('Failed to parse m3u8:', error);
      return [];
    }
  }

  /**
   * Parses key-value pairs inside #EXT-X-STREAM-INF lines.
   * e.g. BANDWIDTH=2228400,RESOLUTION=1280x720
   */
  private parseAttributes(line: string): Record<string, string> {
    const attrString = line.replace('#EXT-X-STREAM-INF:', '');
    const attrs: Record<string, string> = {};
    attrString.split(',').forEach(pair => {
      const [key, value] = pair.split('=');
      attrs[key.trim()] = value?.replace(/"/g, '').trim();
    });
    return attrs;
  }

  /**
   * Converts a relative m3u8 URL to absolute if needed.
   */
  private makeAbsoluteUrl(url: string, base: string): string {
    if (url.startsWith('http')) return url;
    return new URL(url, base).toString();
  }
}
