
export interface INyaaTorrentParsed {
  title?: string;
  episodes: string[];
  episodeTitle?: string;
  seasons: string[];
  year?: string;

  releaseGroup?: string;
  releaseVersion?: string;

  source?: string;
  resolution?: string;

  videoTerms: string[];
  audioTerms: string[];

  subtitles?: string;
  language?: string;
  type?: string;
  part?: string;
  volume?: string;

  checksum?: string;
  extension?: string;

  /**
   * The release is explicitly marked as a batch.
   *
   * Examples:
   * [Batch]
   * (Batch)
   */
  batch: boolean;

  /**
   * The release is explicitly marked as complete.
   *
   * Examples:
   * [Complete]
   * [Complete Season]
   * (Complete)
   */
  complete: boolean;
}

export interface INyaaTorrent {
  title: string;
  link: string;
  pubDate: string;

  seeders: number;
  leechers: number;
  downloads: number;

  infoHash: string;
  size: string;

  isTrusted: boolean;
  isRemake: boolean;

  parsed: INyaaTorrentParsed;
}

export interface TorrentStreamFile {
  name: string;
  path: string;
  length: number;
  select(): void;
  deselect(): void;
}

export interface TorrentStreamEngine {
  infoHash: string;
  files: TorrentStreamFile[];
  torrent: {
    name: string;
    infoHash: string;
    length: number;
  };
  on(event: 'ready' | 'torrent' | 'idle', callback: () => void): void;
  on(event: 'error', callback: (err: Error | string) => void): void;
  destroy(callback?: () => void): void;
}

export interface ITorrentFileDetails {
  fileIdx: number;
  name: string;
  path: string;
  filesize: string;
  parsed: INyaaTorrentParsed;
  isExtra: boolean;
}
export interface ITorrentFileGroup {
  name: string;
  fileCount: number;
  filesize: string;

}
export interface ITorrentDetails {
  name: string;
  infoHash: string;
  sources: string[];
  filesize: string;
  title: string;
  parsed: INyaaTorrentParsed;
  groups: ITorrentFileGroup[];
  files: ITorrentFileDetails[];
}
