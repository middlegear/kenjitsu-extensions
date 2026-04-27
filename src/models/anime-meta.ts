import { FetchClient } from '../config/client.js';

import { Anizone } from '../provider/anime/anizone.js';

import { Animepahe } from '../provider/anime/animepahe.js';

import { Aniwatch } from '../provider/anime/aniwatch.js';
import { Kaido } from '../provider/anime/kaido.js';

import { AniZip } from '../provider/meta/anizip.js';
import type { IMetaDataMap, Provider } from '../types/meta/meta-anime.js';
import { compareTwoStrings } from '../utils/string-similarity.js';

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

export default abstract class BaseAnimeMeta {
  protected client: FetchClient;

  protected anizone: Anizone;
  protected aniwatch: Aniwatch;
  protected animepahe: Animepahe;
  protected kaido: Kaido;
  protected anizip: AniZip;

  constructor(provider: 'jikan' | 'anilist') {
    let delay = null;
    if (provider === 'jikan') {
      delay = 1000;
    } else {
      delay = 200;
    }
    this.client = new FetchClient({ delayBetweenRequests: delay });

    this.aniwatch = new Aniwatch();
    this.animepahe = new Animepahe();
    this.anizone = new Anizone();
    this.kaido = new Kaido();

    this.anizip = new AniZip();
  }
  /**
   * Extract year from ISO date string (YYYY-MM-DD format)
   * Handles both full dates and partial years
   * @param dateString - Full date like "2018-10-16" or just "2018"
   * @returns Year as number or null if invalid
   */
  protected extractYear(dateString: string | null): number | null {
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
      .toLowerCase()
      .replace(/:/g, '-')
      .replace(/;/g, '-')
      .replace(/[\s_-]+/g, '-')
      .replace(/\s+/g, '-')
      .trim();
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

    const seasonNumber = (title: string): number | null => {
      if (!title) return null;
      const m = title.match(/(?:season|cour|part)\s*(\d+)|(\d+)$/i);
      return m ? Number(m[1] || m[2]) : null; // Return null if no season found
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
      } else if (metadata.english && r.name && ['animepahe', 'hianime', 'animekai', 'allanime'].includes(provider)) {
        const cleanMeta = stripSeason(norm(metadata.english));
        const cleanRes = stripSeason(norm(r.name));
        titleMatch = ratio(cleanMeta, cleanRes);
      }
      totalScore += titleMatch * 0.35;
      weightSum += 0.35;
      compared++;

      // ---------- ROMAJI COMPARISON (25%) ----------
      let romajiMatch = 0;
      if (['hianime', 'allanime'].includes(provider) && metadata.romaji && r.romaji) {
        const cleanMeta = stripSeason(norm(metadata.romaji));
        let cleanRes = stripSeason(norm(r.romaji));
        romajiMatch = ratio(cleanMeta, cleanRes);

        // Boost for common "title 2" sequel pattern
        const trimmedRes = cleanRes.trim();
        if (trimmedRes.endsWith(' 2') && cleanMeta === trimmedRes.slice(0, -2).trim()) {
          romajiMatch = Math.min(1.0, romajiMatch + 0.15);
        }

        totalScore += romajiMatch * 0.25;
        weightSum += 0.25;
        compared++;
      }

      // ---------- TYPE COMPARISON (10%) ----------
      let typeMatch = 0;
      if (['animepahe', 'anizone', 'hianime'].includes(provider) && metadata.type && r.type) {
        typeMatch = compareTwoStrings(metadata.type, r.type);
        totalScore += typeMatch * 0.1;
        weightSum += 0.1;
        compared++;
      }

      // ---------- ENGLISH SEASON MATCH (10%) ----------
      let englishSeasonMatch = 0;
      if (metadata.english && r.name) {
        const sMeta = seasonNumber(metadata.english);
        const sRes = seasonNumber(r.name);
        if (sMeta !== null && sRes !== null) {
          englishSeasonMatch = sMeta === sRes ? 1.0 : 0.0;
          totalScore += englishSeasonMatch * 0.1;
          weightSum += 0.1;
          compared++;
        }
      }

      // ---------- NEW: ROMAJI SEASON MATCH (10%) - Huge boost on exact match ----------
      let romajiSeasonMatch = 0;
      if (metadata.romaji && r.romaji) {
        const sMeta = seasonNumber(metadata.romaji);
        const sRes = seasonNumber(r.romaji);
        if (sMeta !== null && sRes !== null) {
          romajiSeasonMatch = sMeta === sRes ? 1.0 : 0.0;
          totalScore += romajiSeasonMatch * 0.1;
          weightSum += 0.1;
          compared++;
        }
      }

      // ---------- YEAR COMPARISON (20%) - With reward + punishment ----------
      if (['animepahe', 'anizone'].includes(provider) && metadata.year != null && r.releaseDate) {
        const metaYear = Number(metadata.year);
        const resultYear = this.extractYear(r.releaseDate.toString());

        if (resultYear != null && !isNaN(metaYear) && !isNaN(resultYear)) {
          const diff = Math.abs(metaYear - resultYear);

          let yearScore = 0;
          if (diff === 0) {
            yearScore = 1.0; // +0.20 total
          } else if (diff === 1) {
            yearScore = -0.6; // -0.12 total
          } else if (diff <= 3) {
            yearScore = -1.0; // -0.20 total
          } else {
            yearScore = -1.5; // -0.30 total
          }

          totalScore += yearScore * 0.2;
          weightSum += 0.2;
          compared++;
        }
      }

      if (compared === 0) {
        continue;
      }

      const weightedAvgScore = totalScore / weightSum;

      if (weightedAvgScore > bestScore || (weightedAvgScore === bestScore && compared > bestCompared)) {
        bestScore = weightedAvgScore;
        bestMatch = r;
        bestCompared = compared;
      }
    }

    if (!bestMatch || bestScore < 0.3 || !bestMatch.id || !bestMatch.name) {
      return null;
    }

    const result = {
      id: bestMatch.id,
      name: bestMatch.name || null,
      romaji: bestMatch.romaji || null,
      provider: provider || null,
      score: bestScore,
    };

    return result;
  }
  protected mergeEpisodeData(providerEp: any, aniZipEp: any, provider: string) {
    const episodeNumber = providerEp.episodeNumber || aniZipEp?.episodeAnizipNumber || null;
    const rating = aniZipEp?.rating || null;
    const aired = aniZipEp?.aired || null;
    const episodeId = providerEp?.episodeId || null;
    const title = aniZipEp?.title?.english || aniZipEp?.title?.romanizedJapanese || providerEp?.title || null;
    const overview = aniZipEp?.overview || null;
    const thumbnail = aniZipEp?.image || providerEp?.teaser || providerEp?.thumbnail || null;
    const airDate = providerEp?.airDate || aniZipEp?.airDate || null;
    const hasDub = providerEp?.hasDub ?? null;
    const hasSub = providerEp?.hasSub ?? null;
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
}
