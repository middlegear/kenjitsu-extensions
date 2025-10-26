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
  provider?: string | null;
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
    if (!results || results.length === 0 || !title || !title.name) {
      console.error('Invalid input: title or results missing');
      return null;
    }

    let bestMatch: MediaSearchResults | null = null;
    let bestScore = 0;
    let bestCompared = 0; // Track number of comparisons for tie-breaking

    // Extract year for movies
    const titleYear = mediaType === 'Movie' && title.releaseDate ? this.extractYear(title.releaseDate) : null;

    for (const r of results) {
      if (!r.name) {
        // console.log(`Skipping result with missing name: ${r.id}`);
        continue;
      }

      let totalScore = 0;
      let weightSum = 0;
      let compared = 0;

      // Title comparison (40% weight)
      const titleSimilarity = compareTwoStrings(title.name, r.name);
      // console.log(`Comparing titles "${title.name}" vs "${r.name}": ${titleSimilarity}`);
      totalScore += titleSimilarity * 0.4;
      weightSum += 0.4;
      compared++;

      if (mediaType === 'TV') {
        // Seasons comparison (40% weight)
        let seasonMatch = 0;
        if (title.seasons != null && r.seasons != null && !isNaN(Number(title.seasons)) && !isNaN(Number(r.seasons))) {
          const seasonDiff = Math.abs(Number(title.seasons) - Number(r.seasons));
          seasonMatch = Math.max(0, 1 - seasonDiff / Math.max(Number(title.seasons), Number(r.seasons)));
        }
        // console.log(`Seasons diff for ${r.name}: ${title.seasons} vs ${r.seasons}, Match: ${seasonMatch}`);
        totalScore += seasonMatch * 0.4;
        weightSum += 0.4;
        compared++;

        // Episodes comparison (20% weight)
        let episodeMatch = 0;
        if (
          title.totalEpisodes != null &&
          r.totalEpisodes != null &&
          !isNaN(Number(title.totalEpisodes)) &&
          !isNaN(Number(r.totalEpisodes))
        ) {
          const episodeDiff = Math.abs(Number(title.totalEpisodes) - Number(r.totalEpisodes));
          episodeMatch = Math.max(0, 1 - episodeDiff / Math.max(Number(title.totalEpisodes), Number(r.totalEpisodes)));
        }
        // console.log(`Episodes diff for ${r.name}: ${title.totalEpisodes} vs ${r.totalEpisodes}, Match: ${episodeMatch}`);
        totalScore += episodeMatch * 0.2;
        weightSum += 0.2;
        compared++;
      } else if (mediaType === 'Movie') {
        // Year comparison (40% weight)
        let yearMatch = 0;
        const resultYear = r.releaseDate ? this.extractYear(r.releaseDate.toString()) : null;
        if (titleYear !== null && resultYear !== null && !isNaN(titleYear) && !isNaN(resultYear)) {
          const yearDiff = Math.abs(titleYear - resultYear);
          if (yearDiff === 0) yearMatch = 1.0;
          else if (yearDiff === 1) yearMatch = 0.8;
          else if (yearDiff === 2) yearMatch = 0.5;
          else yearMatch = 0.2;
        }
        // console.log(`Year diff for ${r.name}: ${titleYear} vs ${resultYear}, Match: ${yearMatch}`);
        totalScore += yearMatch * 0.4;
        weightSum += 0.4;
        compared++;

        // Runtime comparison (20% weight)
        let runtimeMatch = 0;
        if (title.runtime != null && r.duration != null && !isNaN(Number(title.runtime)) && !isNaN(Number(r.duration))) {
          const runtimeDiff = Math.abs(Number(title.runtime) - Number(r.duration));
          if (runtimeDiff <= 10) runtimeMatch = 1.0;
          else if (runtimeDiff <= 30) runtimeMatch = 0.7;
          else if (runtimeDiff <= 60) runtimeMatch = 0.4;
          else runtimeMatch = 0.1;
        }
        // console.log(`Runtime diff for ${r.name}: ${title.runtime} vs ${r.duration}, Match: ${runtimeMatch}`);
        totalScore += runtimeMatch * 0.2;
        weightSum += 0.2;
        compared++;
      }

      if (compared === 0) {
        // console.log(`No comparisons for ${r.name}`);
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

    const result: IMovieProviderResults = {
      id: bestMatch.id,
      name: bestMatch.name,
      score: bestScore,
      provider: bestMatch.provider || null,
    };

    if (mediaType === 'TV') {
      result.seasons = bestMatch.seasons || null;
      result.totalEpisodes = bestMatch.totalEpisodes || null;
    } else {
      result.releaseDate = bestMatch.releaseDate || null;
      result.duration = bestMatch.duration ? `${bestMatch.duration} minutes` : null;
    }

    // console.log('Best match:', result);
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
