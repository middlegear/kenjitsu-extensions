import { FetchClient } from '../config/client.js';
import { HiMovies } from '../provider/movies/himovies.js';
import { VidSrc } from '../provider/movies/vidsrc.js';
import type { IMovieProviderResults } from '../types/meta/meta-movie.js';
import { compareTwoStrings } from '../utils/string-similarity.js';

export interface MediaSearchResults {
  id: string | null;
  name: string | null;
  // TV-specific
  seasons?: number | null;
  totalEpisodes?: number | null;
  // Movie-specific
  releaseDate?: number | null;
  duration?: number | null;
  //   provider?: string | null;
}

export interface IMediaTitle {
  name: string | null;
  // TV-specific
  seasons?: number | null;
  totalEpisodes?: number | null;
  // Movie-specific
  releaseDate?: string | null;
  runtime?: number | null;
}

export abstract class BaseMovieMeta {
  protected client: FetchClient;
  protected himovies: HiMovies;
  protected vidsrc: VidSrc;

  constructor() {
    this.client = new FetchClient();
    this.himovies = new HiMovies();
    this.vidsrc = new VidSrc();
  }

  // ------------------------
  // Utilities
  // ------------------------
  protected createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  protected mapMediaProviderId(
    title: IMediaTitle | null,
    results: MediaSearchResults[] | null,
    mediaType: 'TV' | 'Movie',
  ): IMovieProviderResults | null {
    if (!results || results.length === 0 || !title) {
      return null;
    }

    let bestMatch: MediaSearchResults | null = null;
    let bestScore = 0;

    // Extract year from full date for movies
    const titleYear = mediaType === 'Movie' && title.releaseDate ? this.extractYear(title.releaseDate) : null;

    for (const r of results) {
      let totalScore = 0;
      let weightSum = 0;
      let compared = 0;

      // Title comparison (50% weight for both types)
      if (title.name && r.name) {
        const titleSimilarity = compareTwoStrings(title.name, r.name);
        totalScore += titleSimilarity * 0.5;
        weightSum += 0.5;
        compared++;
      }

      // Type-specific comparisons
      if (mediaType === 'TV') {
        // TV: Seasons comparison (35% weight)
        if (title.seasons !== null && r.seasons !== null) {
          const seasonDiff = Math.abs(Number(title.seasons) - Number(r.seasons));
          const seasonMatch = Math.max(0, 1 - seasonDiff / Math.max(Number(title.seasons), Number(r.seasons)));
          totalScore += seasonMatch * 0.35;
          weightSum += 0.35;
          compared++;
        }

        // TV: Total episodes comparison (15% weight)
        if (title.totalEpisodes !== null && r.totalEpisodes !== null) {
          const episodeDiff = Math.abs(Number(title.totalEpisodes) - Number(r.totalEpisodes));

          const episodeMatch = Math.max(0, 1 - episodeDiff / Math.max(Number(title.totalEpisodes), Number(r.totalEpisodes)));

          totalScore += episodeMatch * 0.15;
          weightSum += 0.15;
          compared++;
        }
      } else if (mediaType === 'Movie') {
        // Movie: Year comparison (35% weight)
        if (titleYear !== null && r.releaseDate !== null) {
          const yearDiff = Math.abs(titleYear - Number(r.releaseDate));
          let yearMatch: number;

          if (yearDiff === 0) {
            yearMatch = 1.0;
          } else if (yearDiff === 1) {
            yearMatch = 0.8;
          } else if (yearDiff === 2) {
            yearMatch = 0.5;
          } else {
            yearMatch = 0.2;
          }

          totalScore += yearMatch * 0.35;
          weightSum += 0.35;
          compared++;
        }

        // Movie: Runtime comparison (15% weight)
        if (title.runtime !== null && r.duration !== null) {
          const runtimeDiff = Math.abs(Number(title.runtime) - Number(r.duration));
          let runtimeMatch: number;

          if (runtimeDiff <= 10) {
            runtimeMatch = 1.0;
          } else if (runtimeDiff <= 30) {
            runtimeMatch = 0.7;
          } else if (runtimeDiff <= 60) {
            runtimeMatch = 0.4;
          } else {
            runtimeMatch = 0.1;
          }

          totalScore += runtimeMatch * 0.15;
          weightSum += 0.15;
          compared++;
        }
      }

      if (compared === 0) continue;

      const weightedAvgScore = totalScore / weightSum;

      if (weightedAvgScore > bestScore) {
        bestScore = weightedAvgScore;
        bestMatch = r;
      }
    }

    if (!bestMatch || bestScore < 0.3) {
      return null;
    }

    const result: IMovieProviderResults = {
      id: bestMatch.id || null,
      name: bestMatch.name || null,
    };

    // Add type-specific fields
    if (mediaType === 'TV') {
      result.seasons = bestMatch.seasons || null;
      result.totalEpisodes = bestMatch.totalEpisodes || null;
      //   result.provider = bestMatch.provider || null;
      result.score = bestScore;
    } else {
      result.releaseDate = bestMatch.releaseDate || null;
      result.duration = bestMatch.duration + ' ' + 'minutes' || null;
      //   result.provider = bestMatch.provider || null;
      result.score = bestScore;
    }

    return result;
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
}
