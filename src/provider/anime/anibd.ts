import { AnimeParser } from '../../models/animeparser.js';
import type { ClientOptions } from '../../config/client.js';
import type {
  IAnimeInfoResponse,
  IBaseAnime,
  IBaseAnimeEpisodes,
  IBaseAnimeInfo,
  IBaseAnimePaginated,
} from '../../types/anime.js';
import type { IResponse, ISourceBaseResponse, IVideoSource } from '../../types/base.js';

class AniBD extends AnimeParser {
  constructor(baseUrl: string = 'https://anibd.app', options: ClientOptions = {}) {
    super(baseUrl, options);
  }

  async search(query: string, page: number = 1): Promise<IBaseAnimePaginated<IBaseAnime[] | []>> {
    if (!query) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        error: this.formatHttpError(400),
        status: 400,
      };
    }
    try {
      const response = await this.client.fetch(
        `https://eng.animeapps.top/api/search3.php?keyword=${query}&page=${page}&limit=20/`,
        {
          method: 'GET',
          headers: {
            Referer: `${this.baseUrl}/`,
            Origin: this.baseUrl,
          },
        },
      );
      if (!response.ok) {
        return {
          hasNextPage: false,
          currentPage: 0,
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const data: IBaseAnime[] = result.data.map((item: any) => ({
        id: item.postid,
        name: item.postname,
        posterImage: item.ani_cover_large,
        romaji: null,
        type: item.anitypes,
        anilistId: item.anilist || null,
      }));
      return {
        hasNextPage: result.pagination.current_page < result.pagination.total_pages,
        currentPage: result.pagination.current_page,
        data: data,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }

  async fetchAnimeInfo(id: string): Promise<IAnimeInfoResponse<IBaseAnimeInfo | null>> {
    try {
      const response = await this.client.fetch(`https://eng.animeapps.top/api/single.php?postid=${id}`, {
        method: 'GET',
        headers: {
          Referer: `${this.baseUrl}/`,
          Origin: this.baseUrl,
        },
      });
      if (!response.ok) {
        return {
          data: null,
          providerEpisodes: [],
          error: response.statusText,
          status: response.status,
        };
      }
      const result = await response.json();
      const info: IBaseAnimeInfo = {
        id: result.data.postid,
        name: result.data.english,
        romaji: result.data.romaji,
        anilistId: result.data.anilist,
        altTiles: result.data.anisynonyms,
        native: result.data.native,
        posterImage: result.data.ani_cover_large || result.data.ani_cover_medium || result.data.ani_banner,
        totalEpisodes: result.data.ani_episodes,
        synopsis: result.data.postcontent,
        releaseDate: result.data.ani_start_date || result.data.postyear,
        type: result.data.anitypes,
        studios: result.data.poststudios,
        genres: result.data.postanigenres,
      };

      const episodesResponse = await this.client.fetch(`https://epeng.animeapps.top/api2.php?epid=${info.anilistId}`, {
        method: 'GET',
        headers: {
          Referer: `https://anibd.bluesagenaturals.com/`,
          Origin: `https://anibd.bluesagenaturals.com`,
        },
      });
      if (!episodesResponse.ok) {
        return {
          data: null,
          providerEpisodes: [],
          error: episodesResponse.statusText,
          status: episodesResponse.status,
        };
      }
      const episodesResult = await episodesResponse.json();

      const episodes: IBaseAnimeEpisodes[] = episodesResult
        .flatMap((server: any) =>
          server.server_data.map((episode: any) => ({
            episodeId: episode.link,
            episodeNumber: Number(episode.slug),
            title: episode.name,
            hasDub: server.server_name.toLowerCase().includes('dub'),
            hasSub: server.server_name.toLowerCase().includes('sub'),
          })),
        )
        .filter((ep: IBaseAnimeEpisodes) => Number.isInteger(ep.episodeNumber));

      return {
        data: info,
        providerEpisodes: episodes as IBaseAnimeEpisodes[],
      };
    } catch (error) {
      return {
        data: null,
        providerEpisodes: [],
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }

  async fetchEpisodes(id: number): Promise<IResponse<IBaseAnimeEpisodes[] | []>> {
    if (!id) {
      return {
        data: [],
        error: 'Missing required params an anilistId',
        status: 400,
      };
    }
    if (Number.isNaN(Number(id))) {
      return {
        data: [],
        error: 'The id provided isnt a valid Id, provide an anilistId',
        status: 400,
      };
    }
    try {
      const episodesResponse = await this.client.fetch(`https://epeng.animeapps.top/api2.php?epid=${id}`, {
        method: 'GET',
        headers: {
          Referer: `https://anibd.bluesagenaturals.com/`,
          Origin: `https://anibd.bluesagenaturals.com`,
        },
      });
      if (!episodesResponse.ok) {
        return {
          data: [],
          error: episodesResponse.statusText,
          status: episodesResponse.status,
        };
      }
      const episodesResult = await episodesResponse.json();

      const episodes: IBaseAnimeEpisodes[] = episodesResult
        .flatMap((server: any) =>
          server.server_data.map((episode: any) => ({
            episodeId: episode.link,
            episodeNumber: Number(episode.slug),
            title: episode.name,
            hasDub: server.server_name.toLowerCase().includes('dub'),
            hasSub: server.server_name.toLowerCase().includes('sub'),
          })),
        )
        .filter((ep: IBaseAnimeEpisodes) => Number.isInteger(ep.episodeNumber));
      return {
        data: episodes,
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown err',
        status: 500,
      };
    }
  }
  async fetchSources(episodeId: string): Promise<ISourceBaseResponse<IVideoSource | null>> {
    if (!episodeId) {
      return {
        headers: { Referer: null },
        data: null,
        error: 'Missing required params: episodeId',
        status: 400,
      };
    }

    try {
      const response = await this.client.fetch(`https://epeng.animeapps.top/apilink.php?data=${episodeId}`, {
        method: 'GET',
        headers: {
          Referer: 'https://anibd.bluesagenaturals.com/',
          Origin: 'https://anibd.bluesagenaturals.com',
        },
      });

      if (!response.ok) {
        return {
          headers: { Referer: null },
          data: null,
          error: response.statusText,
          status: response.status,
        };
      }

      const servers = await response.json();

      const extractedData: IVideoSource = {
        sources: [],
        subtitles: [],
      };

      let referer: string | null = null;

      for (const { server, link } of servers) {
        const embedResponse = await this.client.fetch(link, {
          method: 'GET',
          headers: {
            Referer: 'https://anibd.bluesagenaturals.com/',
            Origin: 'https://anibd.bluesagenaturals.com',
          },
        });

        if (!embedResponse.ok) {
          continue;
        }

        const html = await embedResponse.text();
        const embedUrl = new URL(link);

        referer ??= `${embedUrl.origin}/`;

        const parsed = this.parseSources(html, embedUrl, server);

        extractedData.sources.push(...parsed.sources);
        extractedData.subtitles!.push(...(parsed.subtitles ?? []));
      }

      if (!extractedData.sources.length) {
        return {
          headers: { Referer: null },
          data: null,
          error: 'No valid sources found',
          status: 404,
        };
      }

      return {
        headers: { Referer: referer },
        data: extractedData,
      };
    } catch (error) {
      return {
        headers: { Referer: null },
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }
  private parseSources(html: string, embedUrl: URL, server: string): IVideoSource {
    interface PlayerConfig {
      videoUrl: string;
      tracks?: {
        label: string;
        file: string;
        default?: boolean;
      }[];
    }

    let videoUrl: string;
    let tracks: PlayerConfig['tracks'] = [];

    const configMatch = html.match(/const\s+config\s*=\s*({[\s\S]*?});/);

    if (configMatch) {
      const config = Function(`return (${configMatch[1]})`)() as PlayerConfig;

      videoUrl = new URL(config.videoUrl, embedUrl).toString();
      tracks = config.tracks ?? [];
    } else {
      const artMatch = html.match(/new\s+Artplayer\s*\(\s*{[\s\S]*?url\s*:\s*['"]([^'"]+)['"][\s\S]*?}\s*\)/);

      if (!artMatch) {
        throw new Error('Neither config nor Artplayer configuration found');
      }

      videoUrl = new URL(artMatch[1], embedUrl).toString();
    }

    const isM3u8 = videoUrl.endsWith('.m3u8');
    const quality = videoUrl.match(/(\d{3,4})p/)?.[1] ?? 'unknown';

    return {
      sources: [
        {
          url: videoUrl,
          isM3u8,
          type: isM3u8 ? 'hls' : 'unknown',
          quality: `${server}-${quality}`,
        },
      ],
      subtitles: tracks.map(track => ({
        url: new URL(track.file, embedUrl).toString(),
        lang: track.label,
        default: track.default ?? false,
      })),
    };
  }
}
export { AniBD };
