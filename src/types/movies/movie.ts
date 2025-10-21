import type { IBasePaginated, IHomeResSpecialPages, IResponse } from '../base.js';

export interface IMovieTvBase {
  id: string | null;
  name: string | null;
  posterImage: string | null;
  type: 'Movie' | 'TV' | null;
  quality?: string | null;
}
export interface IMovieSlider extends IMovieTvBase {
  synopsis: string | null;
  score: number | null;
  duration: string | null;
  genre: string[] | null;
}
export interface IMovie extends IMovieTvBase {
  type: 'Movie';
  releaseDate: string | number | null;
  duration: string | null;
}

export interface ITvShow extends IMovieTvBase {
  type: 'TV';
  seasons: number | null;
  totalEpisodes: number | null;
}

export interface IMovieInfo extends IMovieTvBase {
  releaseDate: string | null;
  synopsis: string | null;
  duration: string | null;
  production: string[] | null;
  country: string[] | null;
  casts: string[] | null;
  trailer: string | null;
  score: number | null;
  genre: string[] | null;
}
export type IMovieOrTv = IMovie | ITvShow;

export interface IMovieInfoResponse<T> extends IResponse<T> {
  recommended: IMovieOrTv[] | [];
  providerEpisodes: IMovieEpisodes[] | [];
}

export interface IMovieEpisodes {
  title: string | null;
  episodeId: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
}

export interface IMovieServers {
  serverId: string | null;
  serverName: string | null;
}

export interface IHomeHIResponse<T> extends IHomeResSpecialPages {
  featured?: IMovieSlider[] | [];
  trending: {
    Movies: IMovieOrTv[] | [];
    Tv: IMovieOrTv[] | [];
  };
  recentReleases: {
    Movies: IMovieOrTv[] | [];
    Tv: IMovieOrTv[] | [];
  };
  upcoming: IMovieOrTv[] | [];
}

export interface IZPaginated<T> extends IBasePaginated<T> {
  lastPage: number;
}
export const HIMovieGenres = {
  action: 'action',
  actionandadventure: 'action-adventure',
  adventure: 'adventure',
  animation: 'animation',
  biography: 'biography',
  comedy: 'comedy',
  crime: 'crime',
  documentary: 'documentary',
  drama: 'drama',
  family: 'family',
  fantasy: 'fantasy',
  history: 'history',
  horror: 'horror',
  kids: 'kids',
  music: 'music',
  mystery: 'mystery',
  news: 'news',
  reality: 'reality',
  romance: 'romance',
  scifiandfantasy: 'sci-fi-fantasy',
  sciencefiction: 'science-fiction',
  soap: 'soap',
  talk: 'talk',
  thriller: 'thriller',
  tvmovie: 'tv-movie',
  war: 'war',
  warandpolitics: 'war-politics',
  western: 'western',
} as const;

export type IMovieGenre = keyof typeof HIMovieGenres;

export const HIMovieCountryCode = {
  argentina: 'AR',
  australia: 'AU',
  austria: 'AT',
  belgium: 'BE',
  brazil: 'BR',
  canada: 'CA',
  china: 'CN',
  czechrepublic: 'CZ',
  denmark: 'DK',
  finland: 'FI',
  france: 'FR',
  germany: 'DE',
  hongkong: 'HK',
  hungary: 'HU',
  india: 'IN',
  ireland: 'IE',
  israel: 'IL',
  italy: 'IT',
  japan: 'JP',
  luxembourg: 'LU',
  mexico: 'MX',
  netherlands: 'NL',
  newzealand: 'NZ',
  norway: 'NO',
  poland: 'PL',
  romania: 'RO',
  russia: 'RU',
  southafrica: 'ZA',
  southkorea: 'KR',
  spain: 'ES',
  sweden: 'SE',
  switzerland: 'CH',
  taiwan: 'TW',
  thailand: 'TH',
  unitedkingdom: 'GB',
  unitedstates: 'US',
} as const;

export type IMovieCountry = keyof typeof HIMovieCountryCode;

export const HIMoviesCountryID = {
  argentina: '11',
  australia: '151',
  austria: '4',
  belgium: '44',
  brazil: '190',
  canada: '147',
  china: '101',
  czechrepublic: '231',
  denmark: '222',
  finland: '158',
  france: '3',
  germany: '96',
  hongkong: '93',
  hungary: '72',
  india: '105',
  ireland: '196',
  israel: '24',
  italy: '205',
  japan: '173',
  luxembourg: '91',
  mexico: '40',
  netherlands: '172',
  newzealand: '122',
  norway: '219',
  poland: '23',
  romania: '170',
  russia: '109',
  southafrica: '200',
  southkorea: '135',
  spain: '62',
  sweden: '114',
  switzerland: '41',
  taiwan: '119',
  thailand: '57',
  unitedkingdom: '180',
  unitedstates: '129',
} as const;

export const HIMoviesGenreID = {
  action: '10',
  actionandadventure: '24',
  adventure: '18',
  animation: '3',
  biography: '37',
  comedy: '7',
  crime: '2',
  documentary: '11',
  drama: '4',
  family: '9',
  fantasy: '13',
  history: '19',
  horror: '14',
  kids: '27',
  music: '15',
  mystery: '1',
  news: '34',
  reality: '22',
  romance: '12',
  scifiandfantasy: '31',
  sciencefiction: '5',
  soap: '35',
  talk: '29',
  thriller: '16',
  tvmovie: '8',
  war: '17',
  warandpolitics: '28',
  western: '6',
} as const;
