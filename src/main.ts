import { HiAnime } from './provider/anime/hianime.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { FlixHQ } from './provider/movies/flixhq.js';
import { Animekai } from './provider/anime/animekai.js';
import { Animepahe } from './provider/anime/animepahe.js';
import { HiMovies } from './provider/movies/himovies.js';
import { Kaido } from './provider/anime/kaido.js';
import MegaCloud from './source-extractors/megacloud.js';
import RapidCloud from './source-extractors/rapidcloud.js';
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

export {
  Anilist,
  Jikan,
  TheMovieDatabase,
  HiAnime,
  Kaido,
  Animekai,
  Animepahe,
  HiMovies,
  FlixHQ,
  MegaCloud,
  RapidCloud,
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
