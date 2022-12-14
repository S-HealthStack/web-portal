import { UserProfile } from './study';

export type SigninRequest = {
  email: string;
  password: string;
};

export type SigninResponse = {
  id: string;
  email: string;
  jwt: string;
  roles: string[];
  refreshToken: string;
};

export type ResetPasswordRequest = {
  email: string;
  password: string;
  resetToken: string;
  profile?: UserProfile;
};

export type RefreshTokenBody = {
  jwt: string;
  refreshToken: string;
};
