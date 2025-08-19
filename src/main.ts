import { AnimeKai, FlixHQ, Jikan, Meta, TheMovieDatabase, TvMaze, Anilist } from './provider/index.js';
import { HiAnime } from './provider/anime/hianime/index.js';
import { Anime } from './provider/anime/anime.js';
import {
  AnimeKaiServers,
  Seasons,
  SubOrDub,
  Sort,
  StreamingServers,
  TimeWindow,
  JikanStatus,
  AnilistStatus,
  Format,
  Charactersort,
  HiAnimeServers,
  AnimeProvider,
} from './types/index.js';
import { getAnilistMapping } from './provider/meta/anizip/index.js';

export {
  Seasons,
  SubOrDub,
  Sort,
  JikanStatus,
  AnilistStatus,
  Format,
  Charactersort,
  AnimeKaiServers,
  HiAnimeServers,
  TimeWindow,
  StreamingServers,
  AnimeProvider,
};

// const flixhq = new FlixHQ();
// const data = await flixhq.fetchMediaInfo('tv-watch-the-boys-33895');
// const data = await flixhq.fetchMediaInfo('movie-watch-bad-boys-ride-or-die-109831');
// const data = await flixhq.fetchSources('episode-1019968');
// console.log(data);

export { Anime, Meta, Anilist, Jikan, HiAnime, AnimeKai, FlixHQ, TheMovieDatabase, TvMaze };
// episode-1019968
