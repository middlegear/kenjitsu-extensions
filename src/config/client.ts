import { Impit } from 'impit';
import PQueue from 'p-queue';
import type { ImpitOptions, ImpitResponse, RequestInit } from 'impit';

export interface ClientOptions extends ImpitOptions {
  rateLimit?: {
    requestsPerInterval?: number;
    intervalMs?: number;
    concurrency?: number;
  };
  cfProxyUrl?: string;
}

export class Client {
  private readonly impit: Impit;
  private queue?: PQueue;
  private readonly cfProxyUrl?: string;

  constructor(options: ClientOptions = {}) {
    const { rateLimit, cfProxyUrl, ...impitConfig } = options;
    this.impit = new Impit(impitConfig);
    this.cfProxyUrl = cfProxyUrl;

    if (rateLimit) {
      this.queue = new PQueue({
        intervalCap: rateLimit.requestsPerInterval ?? 1,
        interval: rateLimit.intervalMs ?? 1000,
        concurrency: rateLimit.concurrency ?? 1,
        carryoverIntervalCount: false,
      });
    }
  }

  private resolveUrl(url: string | URL): string {
    const target = url.toString();
    if (!this.cfProxyUrl) return target;
    return `${this.cfProxyUrl}/proxy?url=${encodeURIComponent(target)}`;
  }

  public async fetch(url: string | URL, options: RequestInit): Promise<ImpitResponse> {
    const resolvedUrl = this.resolveUrl(url);

    if (this.queue) {
      return this.queue.add(() => this.impit.fetch(resolvedUrl, options));
    }
    return this.impit.fetch(resolvedUrl, options);
  }
}
