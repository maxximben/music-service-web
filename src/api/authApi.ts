import type { AuthPayload } from '../types/auth';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString().trim() || 'http://localhost:8080';

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object') {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
  } catch {
    // Ignore parse errors and return fallback below.
  }

  return `Request failed: ${response.status} ${response.statusText}`;
}

export async function signInRequest(email: string, password: string): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/sign-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return (await response.json()) as AuthPayload;
}

export async function signUpRequest(email: string, username: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sign-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}
