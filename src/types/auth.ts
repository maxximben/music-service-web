export type Screen = 'landing' | 'sign-in' | 'sign-up' | 'home';

export type AuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  [key: string]: unknown;
};
