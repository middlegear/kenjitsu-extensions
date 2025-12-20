import { FetchClient } from '../config/client.js';
import { AllAnime } from '../provider/anime/allanime.js';
import { Anizone } from '../provider/anime/anizone.js';
import { HiAnime } from '../provider/anime/hianime.js';
import { Animepahe } from '../provider/anime/animepahe.js';
import type { IMetaDataMap, Provider } from '../types/meta/meta-anime.js';
import { compareTwoStrings, nativeSimilarity } from '../utils/string-similarity.js';
import { Animekai } from '../main.js';

type AnimeSearchResults = {
  id: string | null;
  name: string | null;
  romaji?: string | null; // pahe lacks this
  provider?: string | null;
  type?: string | null;
  native?: string | null;
  season?: string | null;
  totalEpisodes?: number | null;
  releaseDate?: number | string | null;
};

export abstract class BaseAnimeMeta {
  protected client: FetchClient;
  protected allanime: AllAnime;
  protected animekai: Animekai;
  protected anizone: Anizone;
  protected hianime: HiAnime;
  protected animepahe: Animepahe;

  constructor(provider: 'jikan' | 'anilist') {
    let delay = null;
    if (provider === 'jikan') {
      delay = 700;
    } else {
      delay = 200;
    }
    this.client = new FetchClient({ delayBetweenRequests: delay });
    this.animekai = new Animekai();
    this.allanime = new AllAnime();
    this.hianime = new HiAnime();
    this.animepahe = new Animepahe();
    this.anizone = new Anizone();
  }
  /**
   * Extract year from ISO date string (YYYY-MM-DD format)
   * Handles both full dates and partial years
   * @param dateString - Full date like "2018-10-16" or just "2018"
   * @returns Year as number or null if invalid
   */
  private extractYear(dateString: string | null): number | null {
    if (!dateString) return null;

    // Handle full ISO dates (YYYY-MM-DD) or just years (YYYY)
    const yearMatch = dateString.match(/^(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);

      if (year >= 1900 && year <= 2050) {
        return year;
      }
    }

    return null;
  }
  protected createTitleSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  protected createTitleSlugV2(text: string): string {
    return text
      .toLowerCase() // Convert the entire string to lowercase.
      .replace(/:/g, '-')
      .replace(/;/g, '-')
      .replace(/[\s_-]+/g, '-') // Remove all non-word characters EXCEPT spaces.
      .replace(/\s+/g, '-') // Remove all remaining whitespace (spaces, tabs, newlines).
      .trim(); // Remove any leading or trailing whitespace (though the previous step handles most of it).
  }
  protected mapAnimeProviderId(metadata: IMetaDataMap | null, results: AnimeSearchResults[] | null, provider: Provider) {
    const norm = (s: string): string => {
      return s
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/[!:?.,;'"()[\]]/g, '');
    };

    const stripSeason = (s: string): string => {
      return s.replace(/\b(?:season|cour|part)\s*\d+\b|\s+\d+$/gi, '');
    };

    const seasonNumber = (title: string): number => {
      const m = title.match(/(?:season|cour|part)\s*(\d+)|(\d+)$/i);
      return m ? Number(m[1] || m[2]) : 1;
    };

    const ratio = (a: string, b: string): number => {
      return compareTwoStrings(a, b);
    };

    if (!results || results.length === 0 || !metadata || (!metadata.english && !metadata.romaji)) {
      console.error('Invalid input: metadata, results, or both english and romaji titles missing');
      return null;
    }

    let bestMatch: AnimeSearchResults | null = null;
    let bestScore = 0;
    let bestCompared = 0;

    for (const r of results) {
      if (!r.name) {
        // console.log(`Skipping result with missing name: ${r.id}`);
        continue;
      }

      let totalScore = 0;
      let weightSum = 0;
      let compared = 0;

      // ---------- TITLE COMPARISON (35%) ----------
      let titleMatch = 0;
      if (provider === 'anizone' && metadata.romaji && r.name) {
        const cleanMeta = stripSeason(norm(metadata.romaji));
        const cleanRes = stripSeason(norm(r.name));
        titleMatch = ratio(cleanMeta, cleanRes);
        // console.log(
        //   `Romaji title match for ${r.name} (anizone): "${metadata.romaji}" → "${cleanMeta}" vs "${r.name}" → "${cleanRes}" = ${titleMatch}`,
        // );
      } else if (metadata.english && r.name && ['animepahe', 'hianime', 'animekai', 'allanime'].includes(provider)) {
        const cleanMeta = stripSeason(norm(metadata.english));
        const cleanRes = stripSeason(norm(r.name));
        titleMatch = ratio(cleanMeta, cleanRes);
        // console.log(
        //   `English title match for ${r.name} (${provider}): "${metadata.english}" → "${cleanMeta}" vs "${r.name}" → "${cleanRes}" = ${titleMatch}`,
        // );
      }
      totalScore += titleMatch * 0.35;
      weightSum += 0.35;
      compared++;

      // ---------- ROMAJI COMPARISON (25%) ----------
      let romajiMatch = 0;
      if (['hianime', 'animekai', 'allanime'].includes(provider) && metadata.romaji && r.romaji) {
        const cleanMeta = stripSeason(norm(metadata.romaji));
        let cleanRes = stripSeason(norm(r.romaji));
        romajiMatch = ratio(cleanMeta, cleanRes);

        // Boost if romaji is exactly "base + 2" (e.g. "shitai 2")
        const trimmedRes = cleanRes.trim();
        if (trimmedRes.endsWith(' 2') && cleanMeta === trimmedRes.slice(0, -2).trim()) {
          romajiMatch = Math.min(1.0, romajiMatch + 0.15);
        }

        // console.log(
        //   `Romaji match for ${r.name} (${provider}): "${metadata.romaji}" → "${cleanMeta}" vs "${r.romaji}" → "${cleanRes}" = ${romajiMatch}`,
        // );
        totalScore += romajiMatch * 0.25;
        weightSum += 0.25;
        compared++;
      }

      // // ---------- NATIVE COMPARISON (20%) ---------- This might cause problems incase it does then comment it out
      // let nativeMatch = 0;
      // if (provider === 'allanime' && metadata.native && r.native) {
      //   nativeMatch = nativeSimilarity(metadata.native, r.native);
      //   console.log(`Native match for ${r.name} (${provider}): "${metadata.native}" vs "${r.native}" = ${nativeMatch}`);
      //   totalScore += nativeMatch * 0.2;
      //   weightSum += 0.2;
      //   compared++;
      // }

      // ---------- TYPE COMPARISON (10%) ----------
      let typeMatch = 0;
      if (['animepahe', 'anizone', 'hianime', 'animekai'].includes(provider) && metadata.type && r.type) {
        typeMatch = compareTwoStrings(metadata.type, r.type);
        // console.log(`Type match for ${r.name} (${provider}): "${metadata.type}" vs "${r.type}" = ${typeMatch}`);
        totalScore += typeMatch * 0.1;
        weightSum += 0.1;
        compared++;
      }

      // ---------- SEASON  TITLE COMPARISON(10%) ----------
      let seasonMatch = 0;
      if (metadata.english && r.name) {
        const sMeta = seasonNumber(metadata.english);
        const sRes = seasonNumber(r.name);
        seasonMatch = sMeta === sRes ? 1.0 : 0.0;
        // console.log(`Season match for ${r.name}: ${sMeta} vs ${sRes} = ${seasonMatch}`);
        totalScore += seasonMatch * 0.1;
        weightSum += 0.1;
        compared++;
      }

      // ---------- YEAR COMPARISON (15%) ----------
      let yearMatch = 0;
      const resultYear = r.releaseDate ? this.extractYear(r.releaseDate.toString()) : null;
      if (
        ['animepahe', 'anizone'].includes(provider) &&
        metadata.year != null &&
        resultYear != null &&
        !isNaN(Number(metadata.year)) &&
        !isNaN(Number(resultYear))
      ) {
        const yearDiff = Math.abs(Number(metadata.year) - Number(resultYear));
        if (yearDiff === 0) yearMatch = 1.0;
        else if (yearDiff === 1) yearMatch = 0.8;
        else if (yearDiff === 2) yearMatch = 0.5;
        else yearMatch = 0.2;
        // console.log(`Year match for ${r.name} (${provider}): ${metadata.year} vs ${resultYear} = ${yearMatch}`);
        totalScore += yearMatch * 0.15;
        weightSum += 0.15;
        compared++;
      }

      if (compared === 0) {
        console.log(`No comparisons for ${r.name}`);
        continue;
      }

      const weightedAvgScore = totalScore / weightSum;
      // console.log(`Result: ${r.name}, Score: ${weightedAvgScore}, Comparisons: ${compared}`);

      if (weightedAvgScore > bestScore || (weightedAvgScore === bestScore && compared > bestCompared)) {
        bestScore = weightedAvgScore;
        bestMatch = r;
        bestCompared = compared;
      }
    }

    if (!bestMatch || bestScore < 0.3 || !bestMatch.id || !bestMatch.name) {
      // console.log('No valid match found or score too low:', bestScore);
      return null;
    }

    const result = {
      id: bestMatch.id,
      name: bestMatch.name || null,
      romaji: bestMatch.romaji || null,
      provider: provider || null,
      score: bestScore,
    };

    // console.log('Best match:', result);
    return result;
  }
  // ------------------------
  // Anizip integration
  // ------------------------
  protected formatAnizipData(data: any) {
    if (!data || !data.episodes) {
      return { animeTitles: {}, mappings: {}, episodes: [] };
    }

    const titles = {
      english: data.titles?.en || null,
      japanese: data.titles?.ja || null,
      german: data.titles?.de || null,
      romanized: data.titles?.['x-jat'] || data.titles?.['x-zht'] || data.titles?.['x-kot'] || null, // i shouldnt be putting x-zht here cause its chinese
      traditionalChinese: data.titles?.['zh-Hant'] || null,
      simplifiedChinese: data.titles?.['zh-Hans'] || null,
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
          image: episode.image || null,
          rating: episode.rating || null,
          aired: true,
        };
      });

    const images = data.images || null;
    return {
      images,
      titles,
      mappings,
      episodes: transformedEpisodes,
    };
  }

  protected anilistAnizip(id: number) {
    return this.fetchAnizipByMapping('anilist_id', id);
  }

  protected malAnizip(id: number) {
    return this.fetchAnizipByMapping('mal_id', id);
  }

  protected mergeEpisodeData(providerEp: any, aniZipEp: any, provider: string) {
    const episodeNumber = providerEp.episodeNumber || aniZipEp?.episodeAnizipNumber || null;
    const rating = aniZipEp?.rating || null;
    const aired = aniZipEp?.aired || null;
    const episodeId = providerEp?.episodeId || null;
    const title = providerEp?.title || aniZipEp?.title?.english || aniZipEp?.title?.romanizedJapanese || null;
    const overview = aniZipEp?.overview || null;
    const thumbnail = providerEp?.teaser || providerEp?.thumbnail || aniZipEp?.image || null;
    const airDate = providerEp?.airDate || aniZipEp?.airDate || null;
    const hasDub = providerEp?.hasDub || null;
    const hasSub = providerEp?.hasDub || null;
    // const hasRaw = providerEp.hasDub || null; disabled since i cant fetch raw sources from allanime

    return {
      episodeNumber,
      episodeId,
      title,
      rating,
      aired,
      airDate,
      overview,
      thumbnail,
      provider,
      hasDub,
      hasSub,
      // hasRaw,
    };
  }

  protected async fetchAnizipByMapping(type: 'anilist_id' | 'mal_id', id: number) {
    if (!id) return { error: `Missing required param: ${type}`, data: null };

    try {
      const response = await this.client.get(`https://api.ani.zip/mappings?${type}=${id}`);
      if (!response.data) throw new Error(response.statusText);

      const results = this.formatAnizipData(response.data);
      return {
        images: results.images,
        titles: results.titles,
        episodes: results.episodes,
        mapping: results.mappings,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
}
