import type { IResponse } from '../base.js';

export interface IAllChapters {
  chapterId: string | null;
  chapterNumber: number | null;
}
export interface IAllMangaInfoResponse<T> extends IResponse<T> {
  providerChapters: IAllChapters[] | [];
}
