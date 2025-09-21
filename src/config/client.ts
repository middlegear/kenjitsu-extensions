import { fetch, Headers } from 'undici';
import { URLSearchParams } from 'url';

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class RequestError extends Error {
  constructor(
    message: string,
    public readonly response: FetchResponse,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  retries?: number;
  timeout?: number;
  profile?: string;
  delayBetweenRequests?: number;
}

export interface FetchResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  config: RequestConfig;
}

export type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
export type ResponseInterceptor = (response: FetchResponse) => Promise<FetchResponse> | FetchResponse;

export class FetchClient {
  private readonly defaultOptions: {
    timeout: number;
    retries: number;
    delayBetweenRequests: number;
    profile: string;
  };
  private readonly profiles: Record<string, { headers: Record<string, string> }>;
  private activeProfile: string;
  private lastRequestTime = 0;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];

  constructor(options: Partial<RequestConfig> = {}) {
    this.defaultOptions = {
      timeout: options.timeout || 10000,
      retries: options.retries || 2,
      delayBetweenRequests: options.delayBetweenRequests || 1000,
      profile: options.profile || 'chrome-desktop',
    };

    this.profiles = {
      'chrome-desktop': {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Sec-CH-UA': '"Chromium";v="140", "Google Chrome";v="140", "Not-A.Brand";v="99"',
          'Sec-CH-UA-Platform': '"Windows"',
          'Sec-CH-UA-Mobile': '?0',
          Priority: 'u=0, i',
        },
      },
      'librewolf-desktop': {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          Priority: 'u=0',
        },
      },
      'normal-fetch': {
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
      },
    };

    this.activeProfile = this.defaultOptions.profile;
  }

  public setProfile(profileName: string): void {
    if (!this.profiles[profileName]) {
      throw new Error(`Profile "${profileName}" does not exist.`);
    }
    this.activeProfile = profileName;
  }

  public useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private async delayIfNeeded(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const baseDelay = this.defaultOptions.delayBetweenRequests;
    const jitter = Math.floor(Math.random() * 250);
    const waitTime = baseDelay + jitter - elapsed;
    if (waitTime > 0) {
      await new Promise(res => setTimeout(res, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  public async request<T = any>(config: RequestConfig): Promise<FetchResponse<T>> {
    let finalConfig: RequestConfig = { ...this.defaultOptions, ...config };

    await this.delayIfNeeded();

    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    const { url, method = 'GET', headers = {}, body, params } = finalConfig;
    const retries = finalConfig.retries ?? this.defaultOptions.retries;

    const profile = this.profiles[this.activeProfile];
    const profileHeaders = profile.headers;

    const mergedHeadersArray = Object.entries({
      ...profileHeaders,
      ...headers,
    }).sort(() => Math.random() - 0.5);

    const finalHeaders = new Headers(Object.fromEntries(mergedHeadersArray));

    const finalUrl = params ? `${url}?${new URLSearchParams(params).toString()}` : url;

    let finalBody: any;
    if (body !== undefined && body !== null) {
      if (body instanceof FormData) {
        finalBody = body;
      } else if (body instanceof URLSearchParams) {
        finalBody = body.toString();
        finalHeaders.set('Content-Type', 'application/x-www-form-urlencoded');
      } else if (typeof body === 'object') {
        finalBody = JSON.stringify(body);
        finalHeaders.set('Content-Type', 'application/json');
      } else {
        finalBody = String(body);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), finalConfig.timeout);

    try {
      const response = await fetch(finalUrl, {
        method,
        headers: finalHeaders,
        body: finalBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let data: T;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as T;
      }

      let responseObj: FetchResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        config: finalConfig,
      };

      for (const interceptor of this.responseInterceptors) {
        responseObj = await interceptor(responseObj);
      }

      if (!response.ok) {
        throw new RequestError(`Request failed with status code ${response.status}`, responseObj);
      }

      return responseObj;
    } catch (error) {
      clearTimeout(timeout);

      const isAbortError = (error as Error).name === 'AbortError';
      if ((isAbortError || error instanceof NetworkError) && retries > 0) {
        return this.request({ ...finalConfig, retries: retries - 1 });
      }

      if (error instanceof RequestError) throw error;

      throw new NetworkError(`Request failed: ${(error as Error).message}`, error as Error);
    }
  }

  public async get<T = any>(url: string, config: Partial<RequestConfig> = {}) {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  public async post<T = any>(url: string, data?: any, config: Partial<RequestConfig> = {}) {
    return this.request<T>({ ...config, url, method: 'POST', body: data });
  }
}
