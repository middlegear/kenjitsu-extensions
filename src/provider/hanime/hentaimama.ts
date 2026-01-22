// https://hentaimama.io/

import { BaseClass } from '../../models/base.js';

export class HentaiMama extends BaseClass {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://hentaimama.io') {
    super();
    this.baseUrl = baseUrl;
  }
}
