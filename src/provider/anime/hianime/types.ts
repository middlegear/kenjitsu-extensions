export type Anime = {
  id: string | null;
  name: string | null;
  romaji: string | null;
  posterImage: string | null;
  url: string | null;
  duration: string | null;
  type: string | null;
  rating: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
};

export type AnimeInfo = {
  animeId: string | null;
  name: string | null;
  romaji: string | null;
  anilistId: number | null;
  malId: number | null;
  altnames: string | null;
  quality: string | null;
  japanese: string | null;
  rating: string | null;
  airDate: string | null;
  status: string | null;
  malScore: string | null;
  genres: string[] | null;
  studios: string[] | null;
  producers: string | null;
  posterImage: string | null;
  synopsis: string | null;
  duration: number | null;
  type: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
};

export type HCharacters = {
  id: string | null;
  name: string | null;
  posterImage: string | null;
  role: string | null;
  voiceActor: { id: string | null; name: string | null; posterImage: string | null; language: string | null } | null;
};

export type HRelatedAnime = {
  id: string | null;
  name: string | null;
  romaji: string | null;
  type: string | null;
  posterImage: string | null;
  episodes: { sub: number | null; dub: number | null };
  totalEpisodes: number | null;
};
export type EpisodeInfo = {
  episodeId: string | null;
  episodeNumber: number | null;
  title: string | null;
  href: string | null;
};

export type SubServers = {
  serverId: number | null;
  serverName: string | null;
  mediaId: number | null;
};
export type DubServers = SubServers;
export type RawServers = SubServers;

export type ServerInfo = {
  sub: SubServers[];
  dub: DubServers[];
  raw: RawServers[];
  episodeNumber: number | null;
};

export const HiAnimeServers = {
  HD1: 'hd-1',
  HD2: 'hd-2',
  HD3: 'hd-3',
} as const;
export type HiAnimeServers = (typeof HiAnimeServers)[keyof typeof HiAnimeServers];

export type Spotlight = {
  id: string | null;
  spotlight: string | null;
  name: string | null;
  romaji: string | null;
  type: string | null;
  duration: string | null;
  posterImage: string | null;
  startDate: string | null;
  synopsis: string | null;
  quality: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
};

export type Trending = {
  id: string | null;
  number: number | null;
  name: string | null;
  romaji: string | null;
  posterImage: string | null;
};
export type Featured = {
  id: string | null;
  name: string | null;
  romaji: string | null;
  duration?: string | null;
  href?: string | null;

  type: string | null;
  posterImage: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
};
export type TopAnime = {
  id: string | null;
  name: string | null;
  number: number | null;
  romaji: string | null;
  posterImage: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
};
export type HomePage = {
  spotlight: Spotlight[];
  trending: Trending[];
  topAiring: Featured[];
  mostPopular: Featured[];
  favourites: Featured[];
  recentlyCompleted: Featured[];
  topAnime: { daily: TopAnime[]; weekly: TopAnime[]; monthly: TopAnime[] };
  recentlyAdded: Featured[];
  recentlyUpdated: Featured[];
};
export type Airing = {
  id: string | null;
  name: string | null;
  romaji: string | null;
  type: string | null;
  duration: string | null;
  posterImage: string | null;
  rating: string | null;
  synopsis?: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
};
