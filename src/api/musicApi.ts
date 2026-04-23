import { API_BASE_URL } from './authApi';
import type { SearchResponse } from '../types/search';

function getAuthHeader(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchHistory(accessToken: string, signal?: AbortSignal): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/history`, {
    method: 'GET',
    headers: getAuthHeader(accessToken),
    signal,
  });

  return parseResponse<SearchResponse>(response);
}

export async function fetchSearch(
  accessToken: string,
  request: string,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ request });
  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeader(accessToken),
    signal,
  });

  return parseResponse<SearchResponse>(response);
}

export async function fetchTrackUrl(accessToken: string, songId: number): Promise<string> {
  const params = new URLSearchParams({ songId: String(songId) });
  const response = await fetch(`${API_BASE_URL}/search/play?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeader(accessToken),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
