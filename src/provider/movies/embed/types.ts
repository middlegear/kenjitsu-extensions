export const MediaType = {
  Movie: 'movie',
  Tv: 'tv',
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export type vidServers = {
  name: string;
  hash: string;
};

export const EmbedServers = {
  CloudStream: 'cloudstream',
  TwoEmbed: '2embed',
  // SuperEmbed: 'superembed',
} as const;
export type EmbedServers = (typeof EmbedServers)[keyof typeof EmbedServers];

export type sources = {
  url: string;
  isM3U8: boolean;
  type: string;
  default?: boolean;
};

export type subtitles = {
  url: string;
  lang: string;
};

export type ExtractedData = {
  subtitles: subtitles[];
  sources: sources[];
};
