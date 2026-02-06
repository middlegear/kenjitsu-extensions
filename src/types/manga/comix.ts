import type { IBase } from '../base.js';

export interface IComixManga extends IBase {
  anilistId: number | null;
  malId: number | null;
  volumes?: number | null;
  releaseDate: string | null;
  altnames: string[] | [];
}

export interface IComixInfo extends IComixManga {
  synopsis: string | null;
  status: string | null;
  genres: string[] | null;
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
