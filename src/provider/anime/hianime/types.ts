export interface ITrending {
  id: string | null;
  // number: number | null; // disabled for now
  name: string | null;
  romaji: string | null;
  posterImage: string | null;
}

export interface ITopAnime extends ITrending {
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
}
export interface IFeatured extends ITopAnime {
  url: string | null;
  type: string | null;
}

export interface IAnime extends IFeatured {
  duration: string | null;
  rating?: string | null; //optional but can be scraped revist this
}
export interface ISpotlight extends IAnime {
  synopsis: string | null;
  startDate: string | null;
  spotlight?: string | null; /// for only spotlight
  quality: string | null;
}
export interface IAnimeInfo extends ISpotlight {
  anilistId: number | null;
  malId: number | null;
  altnames: string | null;
  japanese: string | null;
  rating: string | null;
  status: string | null;
  malScore: string | null;
  genres: string[] | null;
  studios: string[] | null;
  producers: string | null;
}

export type HomePage = {
  spotlight: IAnime[];
  trending: ITrending[];
  topAiring: IFeatured[];
  mostPopular: IFeatured[];
  favourites: IFeatured[];
  recentlyCompleted: IFeatured[];
  topAnime: { daily: ITopAnime[]; weekly: ITopAnime[]; monthly: ITopAnime[] };
  recentlyAdded: IFeatured[];
  recentlyUpdated: IFeatured[];
};

export interface ISearchSuggestions {
  id: string | null;
  name: string | null;
  romaji: string | null;
  posterImage: string | null;
  startDate: string | null;
  type: string | null;
  duration: string | null;
}
export type HCharacters = {
  id: string | null;
  name: string | null;
  posterImage: string | null;
  role: string | null;
  voiceActor: { id: string | null; name: string | null; posterImage: string | null; language: string | null } | null;
};

export type RelatedSeasons = {
  id: string | null;
  name: string | null;
  season: string | null;
  seasonPoster: string | null;
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
