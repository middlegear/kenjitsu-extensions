interface Title {
  en?: string;
  ja?: string;
  de?: string;
  'x-jat'?: string;
}

interface Mappings {
  animeplanet_id: string;
  kitsu_id: number;
  mal_id: number;
  type: string;
  anilist_id: number;
  anisearch_id: number;
  anidb_id: number;
  notifymoe_id: string;
  livechart_id: number;
  imdb_id: string;
  themoviedb_id: number;
}

interface Episode {
  length: number;
  airdate: string;
  summary: string | undefined;
  episode: number;
  episodeNumber: number;
  title: { en?: string; ja?: string; de?: string; 'x-jat'?: string };
  airDate: string;
  airDateUtc: string;
  runtime: number;
  overview?: string;
  image?: string;
  rating?: string;
}

interface ApiResponse {
  images: any;
  titles: Title;
  mappings: Mappings;
  episodes: { [key: string]: Episode };
}

export function transformData(data: ApiResponse) {
  if (!data || !data.episodes) {
    return { animeTitles: {}, mappings: {}, episodes: [] };
  }

  const titles = {
    english: data.titles?.en || data.titles?.['x-jat'] || null,
    japanese: data.titles?.ja || null,
    german: data.titles?.de || null,
    romanizedJapanese: data.titles?.['x-jat'] || null,
  };

  const mappings = {
    animePlanetId: data.mappings?.animeplanet_id || null,
    kitsuId: data.mappings?.kitsu_id || null,
    malId: data.mappings?.mal_id || null,
    anilistId: data.mappings?.anilist_id || null,
    anisearchId: data.mappings?.anisearch_id || null,
    anidbId: data.mappings?.anidb_id || null,
    notifymoeId: data.mappings?.notifymoe_id || null,
    livechartId: data.mappings?.livechart_id || null,
    imdbId: data.mappings?.imdb_id || null,
    themoviedbId: data.mappings?.themoviedb_id || null,
  };

  const episodeKeys = Object.keys(data.episodes);

  const transformedEpisodes = episodeKeys
    .filter(key => /^\d+$/.test(key))
    .map(key => {
      const episode = data.episodes[key];
      return {
        episodeAnizipNumber: Number(episode.episode || episode.episodeNumber) || null,
        title: {
          english: episode.title?.en || episode.title?.['x-jat'] || null,
          japanese: episode.title?.ja || null,
          german: episode.title?.de || null,
          romanizedJapanese: episode.title?.['x-jat'] || null,
        },
        airDate: episode.airDate || episode.airdate,
        runtime: episode.runtime || episode.length,
        overview: episode.overview || episode.summary,
        image: episode.image || 'No image available',
        rating: episode.rating || null,
        aired: true,
      };
    });

  const images = data.images || null;
  return {
    images: images,
    animeTitles: titles,
    mappings: mappings,
    episodes: transformedEpisodes,
  };
}
