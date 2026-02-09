import { HiAnime } from './provider/anime/hianime.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { FlixHQ } from './provider/movies/flixhq.js';
import { Animekai } from './provider/anime/animekai.js';
import { Animepahe } from './provider/anime/animepahe.js';
import { HiMovies } from './provider/movies/himovies.js';
import { Kaido } from './provider/anime/kaido.js';
import { Anizone } from './provider/anime/anizone.js';
import { AllAnime } from './provider/anime/allanime.js';
import { Comix } from './provider/manga/comix.js';
import { WeebCentral } from './provider/manga/weebcentral.js';
import { AkiH } from './provider/hanime/aki-h.js';
import { HentaiTv } from './provider/hanime/hentaitv.js';
import type { IMovieCountry, IMovieGenre } from './types/movies/movie.js';
import type { HIGenre } from './types/anime/zoro.js';
import type { IMetaFormat, Seasons } from './types/meta/meta-anime.js';
import type { IAnimeCategory } from './types/base.js';

export {
  Anilist,
  Jikan,
  TheMovieDatabase,
  HiAnime,
  Kaido,
  Animekai,
  Animepahe,
  Anizone,
  HiMovies,
  FlixHQ,
  AllAnime,
  AkiH,
  HentaiTv,
  Comix,
  WeebCentral,
  type IMovieCountry,
  type IMovieGenre,
  type HIGenre,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
};
