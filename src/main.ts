import { HiAnime } from './provider/anime/hianime.js';
import { AnimeKai, FlixHQ } from './provider/index.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/index.js';
import { TvMaze } from './provider/index.js';

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
import { NewAnimekai } from './provider/anime/animekai/newClass.js';

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
// export { Anilist, Jikan, TheMovieDatabase, TvMaze, HiAnime, AnimeKai, FlixHQ };

const data = await new NewAnimekai().getAnimeInfo('solo-leveling-season-2-arise-from-the-shadow-x7rq');
// console.log(JSON.stringify(data));
console.log(data);
