import { ApiResponse } from '../../types/api';

const getApiBaseUrl = (): string => {
  return (import.meta as any).env?.VITE_API_BASE_URL || '';
};

export class ApiClient {
  static async get<T>(endpoint: string, fallbackEmpty: T): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return fallbackEmpty;
      }

      const json = await response.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      return fallbackEmpty;
    }
  }

  static async post<TReq, TRes>(endpoint: string, body: TReq): Promise<TRes> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Request to ${endpoint} failed (${response.status}): ${text}`);
    }

    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  }
}
