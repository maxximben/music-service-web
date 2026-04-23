export type Screen = 'landing' | 'sign-in' | 'sign-up';

export type AuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  [key: string]: unknown;
};
