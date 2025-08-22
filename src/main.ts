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

// const zoro = new HiAnime();
// const data = await zoro.fetchSources('dan-da-dan-season-2-19793-episode-141568', 'hd-2');
// console.log(JSON.stringify(data));

export { Anime, Meta, Anilist, Jikan, HiAnime, AnimeKai, FlixHQ, TheMovieDatabase, TvMaze };
// episode-1019968
