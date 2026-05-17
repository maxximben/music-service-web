import { API_BASE_URL } from './authApi';
import type { SearchResponse } from '../types/search';
import type { PlaylistResponse } from '../types/playlist';

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

export async function fetchLibrary(accessToken: string, signal?: AbortSignal): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/library`, {
    method: 'GET',
    headers: getAuthHeader(accessToken),
    signal,
  });

  return parseResponse<SearchResponse>(response);
}

export async function fetchPlaylist(
  accessToken: string,
  playlistId: number,
  signal?: AbortSignal,
): Promise<PlaylistResponse> {
  const params = new URLSearchParams({ playlistId: String(playlistId) });
  const response = await fetch(`${API_BASE_URL}/playlist?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeader(accessToken),
    signal,
  });

  return parseResponse<PlaylistResponse>(response);
}

export async function createPlaylist(accessToken: string, title: string): Promise<PlaylistResponse> {
  const response = await fetch(`${API_BASE_URL}/playlist/create`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  return parseResponse<PlaylistResponse>(response);
}

export async function deletePlaylist(accessToken: string, playlistId: number): Promise<void> {
  const params = new URLSearchParams({ playlistId: String(playlistId) });
  const response = await fetch(`${API_BASE_URL}/playlist?${params.toString()}`, {
    method: 'DELETE',
    headers: getAuthHeader(accessToken),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
}
