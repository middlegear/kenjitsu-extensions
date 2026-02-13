import { BaseClass } from '../../models/base.js';
import { Impit } from 'impit';
const impit = new Impit({
  browser: 'chrome142',
  http3: true,
});
export class Mangahub extends BaseClass {
  async test1() {
    try {
      const response = await impit.fetch('https://api.mghcdn.com/graphql', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://mangahub.io/',
          'Content-Type': 'application/json',
          'x-mhub-access': '74fb8f1f0b48f766920c1f6d4201e2a7',
          Origin: 'https://mangahub.io',
          'Sec-Fetch-Site': 'cross-site',
        },
        body: JSON.stringify({
          query: `{search(x:m01,q:"bleach",limit:10){rows{id,title,slug,image,rank,latestChapter,createdDate}}}`,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  async test2() {
    try {
      const res = await impit.fetch('https://api.mghcdn.com/graphql', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://mangahub.io/',
          Origin: 'https://mangahub.io',
          'Content-Type': 'application/json',
          'x-mhub-access': '74fb8f1f0b48f766920c1f6d4201e2a7',
          'Sec-Fetch-Storage-Access': 'none',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        },
        body: JSON.stringify({
          query: `{chaptersByManga(mangaID:38582){number,title}}`,
        }),
      });

      const data = await res.json();
      return data;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }

  async test3() {
    try {
      const response = await impit.fetch('https://api.mghcdn.com/graphql', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://mangahub.io/',
          Origin: 'https://mangahub.io',
          'Content-Type': 'application/json',
          'x-mhub-access': '74fb8f1f0b48f766920c1f6d4201e2a7',
          'Sec-Fetch-Storage-Access': 'none',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        },
        body: JSON.stringify({
          query: `{chapter(x:m01,slug:"bleach-color",number:602){id,title,mangaID,number,slug,date,pages,noAd,s,manga{id,title,slug,mainSlug,author,isWebtoon,isYaoi,isPorn,isSoftPorn,isLicensed}}}`,
        }),
      });

      if (!response.ok) {
        console.log('Status:', response.status);
        console.log(await response.text());
        throw new Error('Request failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
      };
    }
  }
}
