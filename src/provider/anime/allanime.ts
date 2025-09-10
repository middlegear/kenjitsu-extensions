import { BaseClass } from '../../models/base-anime.js';
import type {
  AllAnimeServers,
  AllAnimeSourceResponse,
  HISubOrDub,
  IAllAnimeEpisodes,
  IAllAnimeServers,
  IAllSearch,
  IAnimePaginated,
  IResponse,
  IVideoSource,
} from '../../models/types.js';
import FileMoon from '../../source-extractors/filemoon.js';
import MP4Upload from '../../source-extractors/mp4upload.js';
import Okru from '../../source-extractors/okru.js';

export class AllAnime extends BaseClass {
  private readonly baseUrl: string = 'https://api.allanime.day/api';
  constructor() {
    super();
  }

  private readonly pageSize: number = 26;
  private SearchQuery = `
  query ($search: SearchInput, $limit: Int, $page: Int,  $countryOrigin: VaildCountryOriginEnumType) {
    shows(search: $search, limit: $limit, page: $page, countryOrigin: $countryOrigin) {
      edges {
        _id
        name
        englishName
        nativeName
        thumbnail
        slugTime
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

  private EpisodesQuery = `
    query ($_id: String!) {
        show(
            _id: $_id
        ) {
            _id
            availableEpisodesDetail
        }
    }
`;

  private StreamsQuery = `
    query(
        $showId: String!,
        $translationType: VaildTranslationTypeEnumType!,
        $episodeString: String!
    ) {
        episode(
            showId: $showId
            translationType: $translationType
            episodeString: $episodeString
        ) {
            sourceUrls
        }
    }
`;

  private findServerUrl(servers: IAllAnimeServers[], server: AllAnimeServers): string {
    const availableServers = servers.map(s => s.serverId || 'unknown');

    const match = servers.find(s => (s.serverId || '').toLowerCase() === server.toLowerCase());

    if (!match) {
      throw new Error(
        `Server '${server}' not found. ` + `Try one of the available servers: ${availableServers.join(', ')}.`,
      );
    }

    return match.serverUrl;
  }

  async search(query: string, page: number): Promise<IAnimePaginated<IAllSearch[] | []>> {
    if (query.length === 0) {
      throw new Error('Search query cannot be empty.');
    }

    const payload = {
      variables: {
        search: {
          query: query,
          allowAdult: false,
          allowUnknown: false,
        },
        limit: this.pageSize,
        page: page,
        countryOrigin: 'ALL',
      },
      query: this.SearchQuery,
    };
    try {
      const response = await this.client.post(this.baseUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const anime = response.data.data.shows.edges.map((item: any) => ({
        id: item._id,
        title: {
          romaji: item.name,
          english: item.englishName,
          native: item.nativeName,
        },
        thumbnail: item.thumbnail,
        slugTime: item.slugTime,
      }));

      return {
        hasNextPage: response.data.data.shows.pageInfo.hasNextPage,
        currentPage: page,
        data: anime,
      };
    } catch (error) {
      return {
        hasNextPage: false,
        currentPage: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  async fetchEpisodes(id: string): Promise<IResponse<IAllAnimeEpisodes[] | []>> {
    if (id.length === 0) {
      throw new Error('id cannot be empty.');
    }

    const buildPayload = (query: string, variables: object) => ({
      query,
      variables,
    });

    try {
      const episodePayload = buildPayload(this.EpisodesQuery, { _id: id });
      const episodeResponse = await this.client.post(this.baseUrl, episodePayload);
      const available = episodeResponse.data.data.show.availableEpisodesDetail;

      if (!available) {
        return { data: [], error: 'No episodes available.' };
      }

      const allEpisodes = new Set([...(available.sub || []), ...(available.dub || []), ...(available.raw || [])]);

      const episodes = Array.from(allEpisodes)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(ep => ({
          episodeNumber: parseInt(ep),
          episodeId: `allanime-${id}-episode-${ep}`,
          hasSub: available.sub?.includes(ep) || false,
          hasDub: available.dub?.includes(ep) || false,
          hasRaw: available.raw?.includes(ep) || false,
        }));

      return { data: episodes };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
  async fetchServers(id: string, category: HISubOrDub = 'sub'): Promise<IResponse<IAllAnimeServers[] | []>> {
    const buildPayload = (query: string, variables: object) => {
      return {
        query,
        variables,
      };
    };

    const showId = id.split('-').at(1);
    const episode = id.split('-').at(-1);

    try {
      const serverPayload = buildPayload(this.StreamsQuery, {
        showId: showId,
        translationType: category,
        episodeString: String(episode),
      });

      const serverResponse = await this.client.post(this.baseUrl, serverPayload);
      let sourceUrls = serverResponse.data.data.episode.sourceUrls;

      if (!sourceUrls) {
        throw new Error(`No servers found for ${id}.`);
      }

      const serverIdMap: Record<string, string> = {
        ok: 'okru',
        'fm-hls': 'filemoon',
        mp4: 'mp4upload',
        vg: 'listeamed',
      };
      const allowed = ['ok', 'fm-hls', 'mp4', 'vg'];
      const servers = sourceUrls
        .filter((src: { sourceName: string }) => allowed.includes(src.sourceName.toLowerCase()))
        .map((src: { sourceUrl: string; type: string; sourceName: string }) => {
          const key = src.sourceName.toLowerCase();
          return {
            serverUrl: src.sourceUrl,
            type: src.type,
            serverName: src.sourceName,
            serverId: serverIdMap[key] || key,
          };
        });
      return { data: servers };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }

  async fetchSources(
    episodeId: string,
    server: AllAnimeServers = 'mp4upload',
    category: HISubOrDub = 'sub',
  ): Promise<AllAnimeSourceResponse<IVideoSource | null>> {
    //
    if (episodeId.includes('http')) {
      const serverUrl = new URL(episodeId);
      switch (server) {
        case 'mp4upload':
          return {
            headers: { Referer: `${serverUrl.origin}/` },
            data: await new MP4Upload().extract(serverUrl),
          };

        case 'filemoon':
          return {
            headers: { Referer: `${serverUrl.origin}/` },
            data: await new FileMoon().extract(serverUrl),
          };
        case 'okru':
          return {
            headers: { Referer: `${serverUrl.origin}/` },
            data: await new Okru().extract(serverUrl),
          };
      }
    }

    try {
      const fetchservers = (await this.fetchServers(episodeId, category)).data;

      if ('error' in fetchservers) {
        return {
          data: null,
          headers: { Referer: null },
          error: fetchservers.error as string,
        };
      }
      if (!Array.isArray(fetchservers)) {
        return {
          data: null,
          headers: { Referer: null },
          error: (fetchservers as any).error as string,
        };
      }
      const serverUrl = this.findServerUrl(fetchservers, server);

      return await this.fetchSources(serverUrl, server, category);
    } catch (error) {
      return {
        data: null,
        headers: {
          Referer: null,
        },
        error: error instanceof Error ? error.message : 'Unknown Error',
      };
    }
  }
}
