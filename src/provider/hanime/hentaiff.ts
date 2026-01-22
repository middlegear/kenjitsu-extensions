import { BaseClass } from '../../models/base.js';

export class HentaiFF extends BaseClass {
  private baseUrl: string;
  constructor(baseurl: string = 'https://hentaiff.com') {
    super();
    this.baseUrl = baseurl;
  }
}
