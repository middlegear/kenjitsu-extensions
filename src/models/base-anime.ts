import { FetchClient } from '../config/client.js';

export abstract class BaseClass {
  protected readonly client: FetchClient;

  protected constructor() {
    this.client = new FetchClient();
  }

  protected createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  protected normalizeKey(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  protected getMappedValue<T extends string, U extends string>(input: T, mapping: Record<string, U>): U {
    const normalized = this.normalizeKey(input);
    if (!(normalized in mapping)) {
      throw new Error(`Invalid: ${input}. Must be one of: ${Object.keys(mapping).join(', ')}`);
    }
    return mapping[normalized];
  }
}

interface AnimeSchedule {
  malId: number;
  anilistId: number;
  bannerImage: string;
  image: string;
  title: { romaji: string; english: string | null; native: string | null };
  format: string;
  status?: string;
  popularity?: number;
  score?: number;
  genres?: string[];
  episodes?: number | null;
  synopsis?: string;
  season?: string | null;
  releaseDate: string;
  endDate: string;
  nextAiringEpisode: { episode: number; id: number; airingAt: number; timeUntilAiring: number };
  color?: string;
  duration?: number | null;
}
