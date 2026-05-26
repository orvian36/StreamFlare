export interface MovieDTO {
  MOVIE_ID: number;
  TITLE: string;
  COUNTRY: string | null;
  RATING: number;
  TOTAL_VIEWS: number;
  TOTAL_VOTES: number;
  DESCRIPTION: string | null;
  IMAGE_URL: string | null;
  VIDEO_URL: string | null;
  LENGTH: number;
  LANGUAGE: string | null;
  PRICE: number;
  MATURITY_RATING: string | null;
  RELEASE_DATE: string;
}

export interface MovieListItem {
  MOVIE_ID: number;
  TITLE: string;
  IMAGE_URL: string | null;
  RATING: number;
}
