import * as cheerio from 'cheerio';
import { ScrapeSwishId } from './scraper.js';
import StreamWish from '../../../source-extractors/streamwish.js';
import type { ExtractedData } from './types.js';
import { FetchClient } from '../../../config/client.js';

export const embedBaseUrl = 'https://www.2embed.cc' as const;

const embedUrl = 'https://yesmovies.baby' as const;
const client = new FetchClient();
client.setProfile('2embed');

const cfClearanceCookie =
  'cf_clearance=I4KTwInnVYqvSIkX0Lz.R.vto96Gnc.AV4hrMHHC5bk-1754824672-1.2.1.1-ReQAs2a11oOGFpkKuY8lh0uMsOmXNOX2xZFY5tAispdnnAvPWQUzYbuGh3rh2nVwP3UKQ8fKegk.rDyjJBgMitk6bilyq8pxuyq5vG0bSeKLYbXDmQh3qM39a4DdllTSdPu2c8ZXEshPyR7EmljSOivJZRapOgoSqQpx2nFFWx4NFvjEYZXLhUQ8zqt__RDO7ePbzWp09PjCHwsnRUG4pGj1Tj9y7lT_6oH9bUziO_Q';

///needs some proper headers https://www.youtube.com/watch?v=JesHXRoJbzw

export async function _getEmbedMovieUrl(tmdbId: number) {
  try {
    const response = await client.get(`${embedBaseUrl}/embed/${tmdbId}`, {
      headers: {
        cookie: cfClearanceCookie,
      },
    });

    const data$ = cheerio.load(response.data);
    const swishUrl = ScrapeSwishId(data$);
    if (!swishUrl || typeof swishUrl !== 'string') {
      throw new Error('Invalid swishUrl from ScrapeSwishId').message;
    }

    const id = swishUrl.split('=').at(1);
    if (!id) {
      throw new Error(`Invalid swishUrl format: ${swishUrl}`).message;
    }

    const referer = new URL(swishUrl);
    console.log(referer.href);

    const packedScriptUrl = await client.get(`${embedUrl}/e/${id}`, {
      headers: {
        Referer: `${referer.origin}/`,
      },
    });

    if (!packedScriptUrl.data) throw new Error('Missing the packedScript Url Html').message;

    const packedScript$ = cheerio.load(packedScriptUrl.data);
    let packedScript: string | null = null;

    packedScript$('script').each((_, el) => {
      const code = packedScript$(el).html();
      if (code?.includes('eval(function(p,a,c,k,e,d)')) {
        packedScript = code;
      }
    });

    if (!packedScript) {
      throw new Error('No packed script found.').message;
    }

    return { data: (await new StreamWish().extract(packedScript)) as ExtractedData };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Unknown Err' };
  }
}
