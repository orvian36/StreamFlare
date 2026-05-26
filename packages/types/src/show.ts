export interface ShowDTO {
  SHOW_ID: number;
  TITLE: string;
  START_DATE: string | null;
  END_DATE: string | null;
  COUNTRY: string | null;
  RATING: number;
  TOTAL_VIEWS: number;
  TOTAL_VOTES: number;
  DESCRIPTION: string | null;
  IMAGE_URL: string | null;
  VIDEO_URL: string | null;
  LENGTH: number;
  LANGUAGE: string | null;
  SEASONS: number;
  EPISODES: number;
  PRICE: number;
  MATURITY_RATING: string | null;
}

export interface EpisodeDTO {
  SEASON_NO: number;
  EPISODE_NO: number;
  SHOW_ID: number;
  TITLE: string | null;
  DESCRIPTION: string | null;
  LENGTH: number | null;
  IMAGE_URL: string | null;
  VIDEO_URL: string | null;
}
