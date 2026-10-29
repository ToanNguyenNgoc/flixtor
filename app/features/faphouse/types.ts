export type FaphouseSort = 'latest' | 'oldest' | 'year_desc' | 'year_asc';

export interface FaphouseGenre {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface FaphouseCountry {
  id: string;
  name: string;
  code?: string;
  slug: string;
}

export interface FaphouseActor {
  id: string;
  name: string;
  slug: string;
  biography?: string | null;
  photoUrl?: string | null;
}

export interface FaphouseMedia {
  url: string;
  contentType?: string;
  size?: number;
}

export interface FaphouseMovie {
  id: string;
  title: string;
  originalTitle?: string | null;
  slug: string;
  description?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  releaseYear?: number | null;
  duration?: number | null;
  country?: FaphouseCountry | null;
  language?: string | null;
  genres: FaphouseGenre[];
  actors: FaphouseActor[];
  directors: FaphouseActor[];
  type?: string;
  featured?: boolean;
  media?: FaphouseMedia | null;
  updatedAt?: string;
}

export interface FaphousePagedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface FaphouseApiResponse<T> {
  success: boolean;
  data: T;
}

export interface FaphouseMovieParams {
  page?: number;
  limit?: number;
  sort?: FaphouseSort;
  genre?: string;
  country?: string;
  search?: string;
}

export interface FaphouseFilterState {
  genre: string;
  country: string;
  actor: string;
  sort: FaphouseSort;
}
