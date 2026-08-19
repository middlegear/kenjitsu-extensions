import * as cheerio from 'cheerio';
import { parse as parseAnitomy } from 'anitomy-ng';
import parseTorrent from 'parse-torrent';
import torrentStream from 'torrent-stream';

import type { ClientOptions } from '../../config/client.js';
import { BaseClass } from '../../models/base.js';
import type { IBasePaginated, IResponse } from '../../types/base.js';
import type {
  INyaaTorrent,
  ITorrentDetails,
  ITorrentFileDetails,
  ITorrentFileGroup,
  TorrentStreamEngine,
} from '../../types/torrents.js';

const EXTRAS_SEGMENT = /^extras$/i;

class Nyaa extends BaseClass {
  private readonly baseUrl: string;
  private static trackersCache: string[] = [];
  private static isTrackersInitialized = false;

  private static readonly ANIME_TRACKERS = [
    'udp://nyaa.tracker.wf:7777/announce',
    'udp://anidex.moe:6969/announce',
    'udp://tracker.anirena.com:80/announce',
    'udp://tracker.uw0.xyz:6969/announce',
    'udp://t.nyaatracker.com:80/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.opentrackr.org:1337/announce',
  ];

  constructor(baseUrl: string = 'https://nyaa.si', options: ClientOptions = {}) {
    super(options);
    this.baseUrl = baseUrl;
  }

  static formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, i);

    return `${value.toFixed(2)} ${units[i]}`;
  }

  private async initTrackers(): Promise<string[]> {
    if (Nyaa.isTrackersInitialized && Nyaa.trackersCache.length > 0) {
      return Nyaa.trackersCache;
    }

    try {
      const response = await this.client.fetch(
        'https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt',
        {
          signal: AbortSignal.timeout(2000),
        },
      );

      if (response.ok) {
        const text = await response.text();

        const bestTrackers = text
          .split('\n')
          .map(t => t.trim())
          .filter(t => t.length > 0);

        Nyaa.trackersCache = Array.from(new Set([...bestTrackers, ...Nyaa.ANIME_TRACKERS]));
      } else {
        Nyaa.trackersCache = Nyaa.ANIME_TRACKERS;
      }
    } catch {
      Nyaa.trackersCache = Nyaa.ANIME_TRACKERS;
    }

    Nyaa.isTrackersInitialized = true;
    return Nyaa.trackersCache;
  }

  private buildMagnetLink(infoHash: string, title?: string, trackers: string[] = []): string {
    const trackerList = trackers.length > 0 ? trackers : Nyaa.ANIME_TRACKERS;

    const trackerParams = trackerList.map(tr => `tr=${encodeURIComponent(tr)}`).join('&');

    const nameParam = title ? `&dn=${encodeURIComponent(title)}` : '';

    return `magnet:?xt=urn:btih:${infoHash}${nameParam}&${trackerParams}`;
  }

  private buildHtmlUrl(
    query: string,
    page: number = 1,
    filter: 0 | 1 | 2 = 0,
    sort: string = 'seeders',
    order: string = 'desc',
  ): string {
    const url = new URL(this.baseUrl);

    url.searchParams.set('q', query);
    url.searchParams.set('p', String(page));
    url.searchParams.set('c', '1_2');
    url.searchParams.set('f', String(filter));
    url.searchParams.set('s', sort);
    url.searchParams.set('o', order);

    return url.toString();
  }

  private buildRssUrl(query: string, page: number = 1, filter: 0 | 1 | 2 = 0): string {
    const url = new URL(this.baseUrl);

    url.searchParams.set('page', 'rss');
    url.searchParams.set('q', query);
    url.searchParams.set('p', String(page));
    url.searchParams.set('c', '1_2');
    url.searchParams.set('f', String(filter));

    return url.toString();
  }

  private parseTorrentName(name: string) {
    const elements = parseAnitomy(name);

    const parsed = {
      title: undefined as string | undefined,
      episodes: [] as string[],
      episodeTitle: undefined as string | undefined,
      seasons: [] as string[],
      year: undefined as string | undefined,
      releaseGroup: undefined as string | undefined,
      releaseVersion: undefined as string | undefined,
      source: undefined as string | undefined,
      resolution: undefined as string | undefined,
      videoTerms: [] as string[],
      audioTerms: [] as string[],
      subtitles: undefined as string | undefined,
      language: undefined as string | undefined,
      type: undefined as string | undefined,
      part: undefined as string | undefined,
      volume: undefined as string | undefined,
      checksum: undefined as string | undefined,
      extension: undefined as string | undefined,

      // Torrent-level signals.
      batch: /\[\s*batch\s*\]|\(\s*batch\s*\)/i.test(name),
      complete: /\[\s*complete(?:\s+season)?\s*\]|\(\s*complete(?:\s+season)?\s*\)/i.test(name),
    };

    for (const element of elements) {
      switch (element.kind) {
        case 'title':
          parsed.title ??= element.value;
          break;

        case 'episode':
          parsed.episodes.push(element.value);
          break;

        case 'episode_title':
          parsed.episodeTitle ??= element.value;
          break;

        case 'season':
          parsed.seasons.push(element.value);
          break;

        case 'year':
          parsed.year ??= element.value;
          break;

        case 'release_group':
          parsed.releaseGroup ??= element.value;
          break;

        case 'release_version':
          parsed.releaseVersion ??= element.value;
          break;

        case 'source':
          parsed.source ??= element.value;
          break;

        case 'video_resolution':
          parsed.resolution ??= element.value;
          break;

        case 'video_term':
          parsed.videoTerms.push(element.value);
          break;

        case 'audio_term':
          parsed.audioTerms.push(element.value);
          break;

        case 'subtitles':
          parsed.subtitles ??= element.value;
          break;

        case 'language':
          parsed.language ??= element.value;
          break;

        case 'type':
          parsed.type ??= element.value;
          break;

        case 'part':
          parsed.part ??= element.value;
          break;

        case 'volume':
          parsed.volume ??= element.value;
          break;

        case 'file_checksum':
          parsed.checksum ??= element.value;
          break;

        case 'file_extension':
          parsed.extension ??= element.value;
          break;
      }
    }

    return parsed;
  }

  private parseHtml(htmlString: string): INyaaTorrent[] {
    const $ = cheerio.load(htmlString);
    const items: INyaaTorrent[] = [];

    $('table.torrent-list tbody tr').each((_, element) => {
      const $row = $(element);
      const $tds = $row.find('td');

      if ($tds.length < 8) return;

      const $titleCell = $tds.eq(1);

      const $titleLink = $titleCell
        .find('a')
        .filter((_, el) => {
          const href = $(el).attr('href') || '';

          return href.startsWith('/view/') && !$(el).hasClass('comments');
        })
        .first();

      const title = $titleLink.attr('title')?.trim() || $titleLink.text().trim();

      const relativeLink = $titleLink.attr('href') || '';

      const link = relativeLink ? (relativeLink.startsWith('http') ? relativeLink : `${this.baseUrl}${relativeLink}`) : '';

      const $downloadCell = $tds.eq(2);

      const magnetLink = $downloadCell.find('a[href^="magnet:"]').attr('href') || '';

      let infoHash = '';

      if (magnetLink) {
        const match = magnetLink.match(/urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/i);

        if (match) {
          infoHash = match[1].toLowerCase();
        }
      }

      const size = $tds.eq(3).text().trim();
      const pubDate = $tds.eq(4).text().trim();
      const seeders = parseInt($tds.eq(5).text().trim(), 10) || 0;
      const leechers = parseInt($tds.eq(6).text().trim(), 10) || 0;
      const downloads = parseInt($tds.eq(7).text().trim(), 10) || 0;

      const isTrusted = $row.hasClass('success');
      const isRemake = $row.hasClass('danger');

      if (title) {
        items.push({
          title,
          link,
          pubDate,
          seeders,
          leechers,
          downloads,
          infoHash,
          size,
          isTrusted,
          isRemake,
          parsed: this.parseTorrentName(title),
        });
      }
    });

    return items;
  }

  private parseRssXml(xmlString: string): INyaaTorrent[] {
    const $ = cheerio.load(xmlString, { xmlMode: true });
    const items: INyaaTorrent[] = [];

    $('item').each((_, element) => {
      const $el = $(element);

      const getXmlText = (tag: string): string => $el.find(tag).text().trim();

      const title = getXmlText('title');

      items.push({
        title,
        link: getXmlText('link'),
        pubDate: getXmlText('pubDate'),
        seeders: parseInt(getXmlText('nyaa\\:seeders'), 10) || 0,
        leechers: parseInt(getXmlText('nyaa\\:leechers'), 10) || 0,
        downloads: parseInt(getXmlText('nyaa\\:downloads'), 10) || 0,
        infoHash: getXmlText('nyaa\\:infoHash'),
        size: getXmlText('nyaa\\:size'),
        isTrusted: getXmlText('nyaa\\:trusted') === 'Yes',
        isRemake: getXmlText('nyaa\\:remake') === 'Yes',
        parsed: this.parseTorrentName(title),
      });
    });

    return items;
  }

  async search(
    query: string,
    page: number = 1,
    filter: 0 | 1 | 2 = 0,
    sort: 'seeders' | 'leechers' | 'downloads' | 'size' | 'id' = 'seeders',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<IBasePaginated<INyaaTorrent[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        status: 400,
        error: 'Query parameter is required',
      };
    }

    try {
      const url = this.buildHtmlUrl(query, page, filter, sort, order);

      const response = await this.client.fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }

      const htmlText = await response.text();
      const data = this.parseHtml(htmlText);

      return {
        hasNextPage: data.length >= 75,
        currentPage: page,
        data,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async searchRss(query: string, page: number = 1, filter: 0 | 1 | 2 = 0): Promise<IBasePaginated<INyaaTorrent[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        status: 400,
        error: 'Query parameter is required',
      };
    }

    try {
      const url = this.buildRssUrl(query, page, filter);

      const response = await this.client.fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          data: [],
          error: response.statusText,
        };
      }

      const xmlText = await response.text();
      const data = this.parseRssXml(xmlText);

      return {
        hasNextPage: data.length >= 75,
        currentPage: page,
        data,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  private static splitPathSegments(path: string): string[] {
    return path.split(/[/\\]+/).filter(Boolean);
  }

  private static deriveGroupKey(path: string): string {
    const parts = Nyaa.splitPathSegments(path);

    if (parts.length <= 2) return 'root';

    return parts[1];
  }

  private static isExtraFile(path: string): boolean {
    return Nyaa.splitPathSegments(path).some(segment => EXTRAS_SEGMENT.test(segment));
  }

  private static processAndSortFiles<
    T extends {
      path?: string;
      name: string;
      length: number;
    },
  >(
    rawFiles: readonly T[],
  ): {
    sortedFiles: ITorrentFileDetails[];
    groups: ITorrentFileGroup[];
  } {
    const sortedRaw = [...rawFiles].sort((a, b) => {
      const pathA = a.path || a.name;
      const pathB = b.path || b.name;

      return pathA < pathB ? -1 : pathA > pathB ? 1 : 0;
    });

    const sortedFiles: ITorrentFileDetails[] = sortedRaw.map((file, index) => {
      const path = file.path || file.name;

      return {
        fileIdx: index + 1,
        name: file.name,
        path,
        filesize: Nyaa.formatBytes(file.length),
        isExtra: Nyaa.isExtraFile(path),
      };
    });

    const groupOrder: string[] = [];

    const groupMap = new Map<
      string,
      {
        count: number;
        bytes: number;
      }
    >();

    sortedRaw.forEach(file => {
      const path = file.path || file.name;
      const key = Nyaa.deriveGroupKey(path);

      const entry = groupMap.get(key);

      if (entry) {
        entry.count += 1;
        entry.bytes += file.length;
      } else {
        groupMap.set(key, {
          count: 1,
          bytes: file.length,
        });

        groupOrder.push(key);
      }
    });

    const groups: ITorrentFileGroup[] = groupOrder.map(name => {
      const entry = groupMap.get(name)!;

      return {
        name,
        fileCount: entry.count,
        filesize: Nyaa.formatBytes(entry.bytes),
      };
    });

    return {
      sortedFiles,
      groups,
    };
  }

  async fetchInfoHashDetails(infoHash: string, timeoutMs: number = 5000): Promise<IResponse<ITorrentDetails | null>> {
    this.initTrackers().catch(() => {});

    try {
      const torrentUrl = `${this.baseUrl}/download/${infoHash}.torrent`;

      const response = await this.client.fetch(torrentUrl, {
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const parsed = await parseTorrent(buffer);

        if (parsed.files && parsed.files.length > 0) {
          const filesize = Nyaa.formatBytes(parsed.length || 0);
          const fileCount = parsed.files.length;

          const { sortedFiles, groups } = Nyaa.processAndSortFiles(parsed.files);

          const trackers = Nyaa.trackersCache.length > 0 ? Nyaa.trackersCache : Nyaa.ANIME_TRACKERS;

          const sources = [...trackers.map(tr => `tracker:${tr}`), `dht:${infoHash}`];

          const result: ITorrentDetails = {
            name: parsed.name || 'Unknown',
            infoHash: parsed.infoHash || infoHash,
            sources,
            filesize,
            title: `${parsed.name}\n${filesize} ${fileCount} file${fileCount !== 1 ? 's' : ''}`,
            groups,
            files: sortedFiles,
          };
          return { data: result };
        }
      }
    } catch (error) {
      console.error('Could not download torrent file', error);
    }

    const trackers = Nyaa.trackersCache.length > 0 ? Nyaa.trackersCache : Nyaa.ANIME_TRACKERS;

    const magnetURI = this.buildMagnetLink(infoHash, undefined, trackers);

    return new Promise<IResponse<ITorrentDetails | null>>(resolve => {
      let isDone = false;

      const engine = torrentStream(magnetURI, {
        trackers,
        dht: true,
        tracker: true,
        connections: 50,
      }) as unknown as TorrentStreamEngine & {
        removeAllListeners?: () => void;
      };

      const cleanupAndExit = (error?: Error, details?: ITorrentDetails) => {
        if (isDone) return;

        isDone = true;
        clearTimeout(timer);

        try {
          if (typeof engine.removeAllListeners === 'function') {
            engine.removeAllListeners();
          } else {
            engine.on('error', () => {});
          }
        } catch {}

        try {
          engine.destroy(() => {});
        } catch {}

        if (error) {
          resolve({ data: null, error: error.message });
        } else if (details) {
          resolve({ data: details });
        } else {
          resolve({ data: null, error: 'Unknown error occurred' });
        }
      };

      const timer = setTimeout(() => {
        cleanupAndExit(new Error(`Timed out fetching metadata for infoHash: ${infoHash}`));
      }, timeoutMs);

      const handleMetadata = () => {
        if (isDone) return;

        const { torrent, files: engineFiles } = engine;

        if (!torrent || !engineFiles || engineFiles.length === 0) {
          return;
        }

        const filesize = Nyaa.formatBytes(torrent.length);
        const fileCount = engineFiles.length;

        const { sortedFiles, groups } = Nyaa.processAndSortFiles(engineFiles);

        const sources = [...trackers.map(tr => `tracker:${tr}`), `dht:${torrent.infoHash}`];

        const details: ITorrentDetails = {
          name: torrent.name,
          infoHash: torrent.infoHash,
          sources,
          filesize,
          title: `${torrent.name}\n${filesize} ${fileCount} file${fileCount !== 1 ? 's' : ''}`,
          groups,
          files: sortedFiles,
        };

        cleanupAndExit(undefined, details);
      };

      engine.on('torrent', handleMetadata);
      engine.on('ready', handleMetadata);

      engine.on('error', (err: Error | string) => {
        cleanupAndExit(typeof err === 'string' ? new Error(err) : err);
      });
    });
  }
}

export { Nyaa };
