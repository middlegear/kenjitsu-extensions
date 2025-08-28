import { HiAnime } from './provider/anime/hianime.js';
import { AnimeKai } from './provider/index.js';
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

// export {
//   Seasons,
//   SubOrDub,
//   Sort,
//   JikanStatus,
//   AnilistStatus,
//   Format,
//   Charactersort,
//   AnimeKaiServers,
//   TimeWindow,
//   StreamingServers,
//   AnimeProvider,
// };
const animekai = new HiAnime();
const data = await animekai.fetchAnimeCategory('SPECIALS');
console.log(data);
