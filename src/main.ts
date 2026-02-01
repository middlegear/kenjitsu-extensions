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
import type { IMovieCountry, IMovieGenre } from './types/movies/movie.js';
import type { HIGenre } from './types/anime/zoro.js';
import type { IMetaFormat, Seasons } from './types/meta/meta-anime.js';
import type { IAnimeCategory } from './types/base.js';
import { AkiH } from './provider/hanime/aki-h.js';
import { HentaiTv } from './provider/hanime/hentaitv.js';

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
  type IMovieCountry,
  type IMovieGenre,
  type HIGenre,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
};

// const data = await new Animepahe().fetchSources(
//   'pahe-4a9abc55-0a54-c544-3e14-736c79ddafe7-$session$-d5065ceff02b39e97b4b324e7d344606b19c23f97138e0329b2476cffe2a79e2',
// );
// console.log(data.data);
// const data = await new Anilist().fetchAnimePaheProviderEpisodes(185857);
// console.log(data);
