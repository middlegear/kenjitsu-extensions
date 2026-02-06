import type { IBase, IBaseEpisodes, IBasePaginated, IHomeResSpecialPages, IResponse } from '../base.js';

export interface IAKAnime extends IBase {
  romaji: string | null;
  type: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
}

export interface IAKSlider extends IAKAnime {
  synopsis: string | null;
  quality: string | null;
  releaseDate: string | null;
  rating: string | null;
}
export interface IAKEpisodes extends IBaseEpisodes {
  title: string | null;
  hasSub: boolean;
  hasDub: boolean;
}

export interface IAKRelatedSeasons {
  id: string | null;
  name: string | null;
  season: string | null;
  totalEpisodes: number | null;
  seasonPoster: string | null;
}

export type AKserver = {
  url: string;
  intro: { start: number | null; end: number | null };
  outro: { start: number | null; end: number | null };
  download: string;
};
export interface IAKInfo extends IBase {
  anilistId: number | null;
  malId: number | null;
  altnames: string | null;
  japanese: string | null;
  status: string | null;
  score: string | null;
  genres: string[] | null;
  studios: string[] | null;
  rating: string | null;
  producers: string[] | null;
  romaji: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
  type: string | null;
  synopsis: string | null;
  releaseDate: string | null;
}

export interface IAKPaginated<T> extends IBasePaginated<T> {
  lastPage: number;
  totalResults: number;
}

export interface IAKHomeResponse<T> extends IHomeResSpecialPages {
  recentlyUpdated: IAKAnime[];
  recentlyCompleted: IAKAnime[];
  recentlyAdded: IAKAnime[];
  data: IAKAnime[];
  trending: { now: IAKAnime[]; daily: IAKAnime[]; weekly: IAKAnime[]; monthly: IAKAnime[] };
  upcoming: IAKAnime[];
}
export interface IAKInfoResponse<T> extends IResponse<T> {
  relatedSeasons: IAKRelatedSeasons[] | [];
  recommendedAnime: IAKAnime[] | [];
  relatedAnime: IAKAnime[] | [];
  providerEpisodes: IAKEpisodes[] | [];
}
export const AKGenres = {
  action: 'action',
  adventure: 'adventure',
  'avant-garde': 'avant-garde',
  'boys-love': 'boys-love',
  comedy: 'comedy',
  demons: 'demons',
  drama: 'drama',
  ecchi: 'ecchi',
  fantasy: 'fantasy',
  'girls-love': 'girls-love',
  gourmet: 'gourmet',
  harem: 'harem',
  horror: 'horror',
  isekai: 'isekai',
  iyashikei: 'iyashikei',
  josei: 'josei',
  kids: 'kids',
  magic: 'magic',
  'mahou-shoujo': 'mahou-shoujo',
  'martial-arts': 'martial-arts',
  mecha: 'mecha',
  military: 'military',
  music: 'music',
  mystery: 'mystery',
  parody: 'parody',
  psychological: 'psychological',
  'reverse-harem': 'reverse-harem',
  romance: 'romance',
  school: 'school',
  'sci-fi': 'sci-fi',
  seinen: 'seinen',
  shoujo: 'shoujo',
  shounen: 'shounen',
  'slice-of-life': 'slice-of-life',
  space: 'space',
  sports: 'sports',
  'super-power': 'super-power',
  supernatural: 'supernatural',
  suspense: 'suspense',
  thriller: 'thriller',
  vampire: 'vampire',
} as const;

export type KaiGenres = keyof typeof AKGenres;
