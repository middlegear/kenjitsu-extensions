import * as cheerio from 'cheerio';
import { BaseClass } from '../../models/base-anime.js';

export class Anizone extends BaseClass {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'https://anizone.to') {
    super();
    this.baseUrl = baseUrl;
  }
}
