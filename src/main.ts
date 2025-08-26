import { FlixHQ, Jikan, Meta, TheMovieDatabase, TvMaze, Anilist } from './provider/index.js';

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
  AnimeProvider,
} from './types/index.js';
import { HiAnime } from './provider/anime/hianime/hianime.js';
export {
  Seasons,
  SubOrDub,
  Sort,
  JikanStatus,
  AnilistStatus,
  Format,
  Charactersort,
  AnimeKaiServers,
  TimeWindow,
  StreamingServers,
  AnimeProvider,
};

// const hianime = new HiAnime();
// const data = await hianime.fetchSources('solo-leveling-18718-episode-119497', HiAnimeServers.HD2, SubOrDub.DUB);

// console.log(JSON.stringify(data));
// console.log(data);
export { Anime, Meta, Anilist, Jikan, HiAnime, FlixHQ, TheMovieDatabase, TvMaze };
