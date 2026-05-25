export interface UserDTO {
  name: string;
  email: string;
  dob: string;
  country: string;
  phone: string | null;
  joined: string;
  maxProfiles: number;
}

export interface SignupRequest {
  NAME: string;
  EMAIL: string;
  DOB: string;
  COUNTRY: string;
  CREDIT_CARD: string;
  PASSWORD: string;
  PHONE?: string;
}

export interface LoginRequest {
  EMAIL: string;
  PASSWORD: string;
}

export interface AuthResponse {
  EMAIL: string;
  token: string;
}

export interface UpdatePhoneRequest {
  EMAIL: string;
  Phone: string;
}

export interface UpdatePasswordRequest {
  EMAIL: string;
  OLD_PASS: string;
  NEW_PASS: string;
  NEW_PASS_CON: string;
}

export interface MovieWatchHistoryItem {
  RATING: number | null;
  WATCHED_UPTO: number;
  TITLE: string;
  TIME: string;
  IMAGE_URL: string;
  PID?: string;
}

export interface ShowWatchHistoryItem {
  TITLE: string;
  RATING: number | null;
  SEASON_NO: number;
  EPISODE_NO: number;
  WATCHED_UPTO: number;
  PID?: string;
}
