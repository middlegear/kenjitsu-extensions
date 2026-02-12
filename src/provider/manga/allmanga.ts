import { BaseClass } from '../../models/base.js';
import type { IAllAnime, IAllAnimeInfo } from '../../types/anime/allanime.js';
import type { IMangaSource, IResponse, ISourceBaseResponse } from '../../types/base.js';
import type { IMangaChapter } from '../../types/manga/comix.js';

///priotity no 2
export class AllManga extends BaseClass {
  private baseUrl: string = 'https://api.allanime.day/api'; // api urls

  constructor() {
    super();
  }
  private readonly pageSize: number = 30;
  private searchQuery = `
  query ($search: SearchInput, $limit: Int, $page: Int,  $countryOrigin: VaildCountryOriginEnumType) {
    mangas(search: $search, limit: $limit, page: $page, countryOrigin: $countryOrigin) {
      edges {
        _id
        name
        englishName
        nativeName
        thumbnail
        score
        genres
        status
        slugTime
        season
      }
      pageInfo {
        hasNextPage
        total
      }
    }
  }
`;

  private detailsQuery = `
    query ($id: String!) {
        manga(_id: $id) {
            _id
            name
            nativeName
            englishName
            type
            season
            thumbnail
            description
            authors
            genres
            tags
            status
            altNames 
            score
        }
    }
`;

  private chaptersQuery = `
    query (
        $id: String!
        $chapterNumStart: Float!
        $chapterNumEnd: Float!
    ) {
        episodeInfos(
            showId: $id
            episodeNumStart: $chapterNumStart
            episodeNumEnd: $chapterNumEnd
        ) {
            episodeIdNum
            notes
            uploadDates
        }
    }
`;

  private pageQuery = `
    query (
        $id: String!
        $translationType: VaildTranslationTypeMangaEnumType!
        $chapterNum: String!
    ) {
        chapterPages(
            mangaId: $id
            translationType: $translationType
            chapterString: $chapterNum
        ) {
            edges {
                pictureUrls
                pictureUrlHead
            }
        }
    }
`;

  /**
   * Searches for manga titles using a keyword or phrase.
   *
   * @param query - Search term / keyword (required)
   * @returns Basic manga list (id, titles, poster) or error
   */
  async search(query: string): Promise<IResponse<IAllAnime[] | []>> {
    if (!query) {
      throw new Error('Missing required params: query string ');
    }
    const payload = {
      variables: {
        search: {
          query: query,
          allowAdult: false,
          allowUnknown: false,
        },
        limit: this.pageSize,
        page: 1,
        countryOrigin: 'ALL',
      },
      query: this.searchQuery,
    };
    try {
      const response = await this.client.post(this.baseUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.data) {
        return { data: [], error: response.statusText };
      }

      const manga = response.data.data.mangas.edges.map((item: any) => ({
        id: `${this.createSlug(item.name || item.englishName || item.nativeName)}-${item._id}`,
        romaji: item.name,
        name: item.englishName,
        native: item.nativeName,
        posterImage: `https://wp.youtube-anime.com/aln.youtube-anime.com/${item.thumbnail}`,
        // slugTime: item.slugTime,
      }));

      return {
        data: manga,
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  /**
   * Fetches detailed metadata for a specific manga using its composite ID.
   *
   * @param id - Manga identifier (usually slug-_id format) (required)
   * @returns Detailed manga information (titles, synopsis, genres, score, status, etc.) or error
   */
  async fetchMangaInfo(id: string) {
    if (!id) {
      throw new Error('Missing required params:Id ');
    }
    const buildPayload = (query: string, variables: object) => ({
      query,
      variables,
    });

    const mediaId = id.split('-').at(-1);
    try {
      const animeinfoPayload = buildPayload(this.detailsQuery, { id: mediaId });
      const response = await this.client.post(this.baseUrl, animeinfoPayload);

      const data: IAllAnimeInfo = {
        id: id,
        name: response.data.data.manga.englishName,
        native: response.data.data.manga.nativeName,
        posterImage: 'https://wp.youtube-anime.com/aln.youtube-anime.com/' + response.data.data.manga.thumbnail,
        type: response.data.data.manga.type,
        season: response.data.data.manga.season?.quarter || null,
        releaseDate: response.data.data.manga.season?.year || null,
        score: response.data.data.manga.score,
        genres: response.data.data.manga.genres,
        synopsis: response.data.data.manga.description,
        status: response.data.data.manga.status,
      };
      return { data: data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: null,
      };
    }
  }

  /**
   * Retrieves all available chapters for a manga.
   * Uses a wide chapter range (0–9999) to fetch everything in one request.
   *
   * @param id - Manga identifier (required)
   * @returns List of chapters (chapter number, title/notes, upload date) sorted descending
   */
  async fetchMangaChapters(id: string): Promise<IResponse<IMangaChapter[] | []>> {
    if (!id) {
      throw new Error('Missing required params:Id ');
    }
    const buildPayload = (query: string, variables: object) => ({
      query,
      variables,
    });

    const mediaId = id.split('-').at(-1);
    try {
      const chaptersPayload = buildPayload(this.chaptersQuery, {
        id: `manga@${mediaId}`,
        chapterNumStart: 0,
        chapterNumEnd: 9999,
      });
      const response = await this.client.post(this.baseUrl, chaptersPayload);

      if (!response.data) {
        return { error: response.statusText || 'No episodes available.', data: [] };
      }

      const chapters = response.data.data.episodeInfos
        .map((item: any) => ({
          chapterId: `${id}-chapter-${item.episodeIdNum}`,
          chapterNumber: parseFloat(item.episodeIdNum),
          title: item.notes,
          releaseDate: item.uploadDates?.sub,
        }))
        .sort((a: { chapterNumber: number }, b: { chapterNumber: number }) => a.chapterNumber - b.chapterNumber);

      return { data: chapters };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  /**
   * Fetches all readable pages (image sources) for a specific manga chapter.
   *
   * @param id - Chapter identifier in format {manga-slug-or-id}-chapter-{number} (required)
   * @returns Object containing array of page sources (url + page number) and recommended Referer header
   
   */
  async fetchMangaPages(id: string): Promise<ISourceBaseResponse<IMangaSource[] | []>> {
    if (!id) {
      throw new Error('Missing required params: chapterId ');
    }
    const match = id.match(/([a-z0-9]+)-chapter-(\d+(?:\.\d+)?)/i);
    if (!match) throw new Error('Invalid id format');

    const mangaId = `${match[1]}`;
    const chapterNum = `${match[2]}`;

    const buildPayload = (query: string, variables: object) => ({
      query,
      variables,
    });
    try {
      const pagesPayload = buildPayload(this.pageQuery, {
        id: mangaId,
        translationType: 'sub',
        chapterNum: chapterNum,
      });
      const response = await this.client.post(this.baseUrl, pagesPayload);

      if (!response.data) {
        throw Error(response.statusText);
      }
      // console.log(response.data);

      const normalizedData = response.data.data.chapterPages.edges.flatMap((edge: any) =>
        edge.pictureUrls.map((pic: any) => ({
          url: edge.pictureUrlHead + pic.url,
          page: pic.num,
        })),
      );

      return {
        headers: { Referer: `https://youtu-chan.com/` },
        data: normalizedData,
      };
    } catch (error) {
      return {
        headers: { Referer: null },
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
