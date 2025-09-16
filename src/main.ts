import { HiAnime } from './provider/anime/hianime.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { FlixHQ } from './provider/movies/flixhq/index.js';
import { Animekai } from './provider/anime/animekai.js';
import { Animepahe } from './provider/anime/animepahe.js';
import { HiMovies } from './provider/movies/himovies.js';

import {
  type IMovieCountry,
  type IMovieGenre,
  type KaiGenres,
  type HIGenre,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
  type IAnime,
  type IMetaAnime,
  type IMetaMovie,
  type IAnimeInfo,
  type IVideoSource,
  type IMetaMovieInfo,
  type IMovieOrTv,
  type ISubOrDub,
} from './models/types.js';
import { AllAnime } from './provider/anime/allanime.js';

export {
  Anilist,
  Jikan,
  TheMovieDatabase,
  HiAnime,
  Animekai,
  Animepahe,
  HiMovies,
  FlixHQ,
  type IMovieCountry,
  type IMovieGenre,
  type KaiGenres,
  type HIGenre,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
  type IAnime,
  type IMetaAnime,
  type IMetaMovie,
  type IAnimeInfo,
  type IVideoSource,
  type IMetaMovieInfo,
  type IMovieOrTv,
  type ISubOrDub,
};

// const data = await new Animepahe().fetchSources(
//   'pahe-7e7e2276-8adc-3c2d-e655-9df8397d0ee3-$session$-5d08385463e07eeabb6e6d1d182ca6ff9619c920089a4dc84fe09718da3fef6a',
// );
// console.log(data);
