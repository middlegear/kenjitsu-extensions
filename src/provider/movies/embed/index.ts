import { _getEmbedMovieUrl } from './2embed.js';
import { EmbedServers, type ExtractedData } from './types.js';
import { _getVidSrcMovieUrl } from './vidsrc.js';

interface SuccessResponse {
  data: ExtractedData;
}
interface ErrorResponse {
  data: null;
  error: string;
}
export type EmbedSrcResponse = SuccessResponse | ErrorResponse;
export async function getMovieUrl(tmdbId: number, server: EmbedServers): Promise<EmbedSrcResponse> {
  try {
    switch (server) {
      case EmbedServers.CloudStream:
        const data = await _getVidSrcMovieUrl(tmdbId);
        if ('error' in data) return { data: null, error: data.error as string };

        return { data: data.data as ExtractedData };
      case EmbedServers.TwoEmbed:
        const data2 = await _getEmbedMovieUrl(tmdbId);
        if ('error' in data2) return { data: null, error: data2.error as string };

        return { data: data2.data as ExtractedData };
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
