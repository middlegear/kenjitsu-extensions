import type { IBase } from '../base.js';

export interface IManga extends IBase {
  anilistId?: number | null;
  malId?: number | null;
  volumes?: number | null;
  releaseDate: string | number | null;
  altnames?: string[] | [];
}

export interface IMangaInfo extends IManga {
  synopsis: string | null;
  status: string | null;
  genres: string[] | null;
  official?: boolean;
}

export interface IMangaChapter {
  chapterId: string | null;
  official: boolean;
  volume: string | null;
  language: string | null;
  releaseDate: string | null;
  scanlationGroup: string | null;
  chapterNumber: string | null;
}
