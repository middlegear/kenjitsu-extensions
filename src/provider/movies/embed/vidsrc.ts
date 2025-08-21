import * as cheerio from 'cheerio';

import { EmbedServers, type ExtractedData } from './types.js';
import { getFrame, getServersHash } from './scraper.js';

import CloudStreamPro from '../../../source-extractors/cloudstreampro.js';

import { FetchClient } from '../../../config/client.js';

export const vidsrcBaseUrl = 'https://vidsrc.io/embed' as const;

const client = new FetchClient();
async function _getRCP(hash: string) {
  try {
    const rcp = await client.get(`https://cloudnestra.com/rcp/${hash}`, {
      headers: {
        Referer: 'https://vidsrc.io/',
      },
    });
    /// shida  iko hapa
    console.log(rcp.data);

    const frame$ = cheerio.load(rcp.data);
    const iframe = getFrame(frame$);
    const srcp = await client.get(`https://cloudnestra.com/${iframe}`, {
      headers: {
        Referer: `https://cloudnestra.com/rcp/${hash}`,
      },
    });
    return srcp.data;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown Err' };
  }
}
async function _getMovieHash(tmdbId: number, server: EmbedServers = EmbedServers.CloudStream) {
  try {
    const response = await client.get(`${vidsrcBaseUrl}/${tmdbId}/`);
    const data$ = cheerio.load(response.data);
    const servers = getServersHash(data$);

    if (!Array.isArray(servers) || servers.length === 0) {
      throw new Error('No servers found');
    }
    const index = servers.findIndex(s => s.name === server);
    if (index === -1) {
      throw new Error(`Server ${server} not found`).message;
    }

    const serverId = servers[index].hash;
    const rcpData = await _getRCP(serverId);
    console.log(rcpData);

    if (!rcpData) {
      throw new Error('Failed to retrieve rcp data').message;
    }

    return rcpData;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown Err' };
  }
}
async function _getTvHash(
  tmdbId: number,
  season: number,
  episodeNumber: number,
  server: EmbedServers = EmbedServers.CloudStream,
) {
  try {
    const response = await client.get(`${vidsrcBaseUrl}/${tmdbId}/${season}-${episodeNumber}/`);
    const data$ = cheerio.load(response.data);
    const servers = getServersHash(data$);

    if (!Array.isArray(servers) || servers.length === 0) {
      throw new Error('No servers found');
    }
    const index = servers.findIndex(s => s.name === server);
    if (index === -1) {
      throw new Error(`Server ${server} not found`).message;
    }

    const serverId = servers[index].hash;
    const rcpData = await _getRCP(serverId);

    if (!rcpData) {
      throw new Error('Failed to retrieve rcp data').message;
    }

    return rcpData;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown Err' };
  }
}
interface SuccessResponse {
  data: ExtractedData;
}
interface ErrorResponse {
  data: null;
  error: string;
}
export type EmbedSrcResponse = SuccessResponse | ErrorResponse;
export async function _getVidSrcMovieUrl(tmdbId: number): Promise<EmbedSrcResponse> {
  if (!tmdbId) {
    return { data: null, error: 'Missing required params: tmdbId!' };
  }
  try {
    const data = await _getMovieHash(tmdbId);

    console.log(data);

    const data$: cheerio.CheerioAPI = cheerio.load(data);

    return { data: new CloudStreamPro().extract(data$) as ExtractedData };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown Err' };
  }
}

export async function _getVidSrcTvUrl(tmdbId: number, season: number, episodeNumber: number): Promise<EmbedSrcResponse> {
  if (!tmdbId) {
    return {
      data: null,
      error: 'Missing required params: tmdbId! ',
    };
  }
  try {
    const data = await _getTvHash(tmdbId, season, episodeNumber);

    const data$: cheerio.CheerioAPI = cheerio.load(data);

    return { data: new CloudStreamPro().extract(data$) as ExtractedData };
    //
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown Err' };
  }
}
