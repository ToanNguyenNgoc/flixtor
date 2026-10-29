import axios from 'axios';
import { FAPHOUSE_API_BASE_URL, FAPHOUSE_PAGE_SIZE } from '@/utils/constants';
import type { KKDetailResponse } from '@/types';
import type {
  FaphouseActor,
  FaphouseApiResponse,
  FaphouseCountry,
  FaphouseGenre,
  FaphouseMovie,
  FaphouseMovieParams,
  FaphousePagedData,
} from '../types';

// Instance riêng: không dùng axiosClient để không gắn Bearer token của app vào server bên thứ ba.
const faphouseClient = axios.create({
  baseURL: FAPHOUSE_API_BASE_URL,
  timeout: 20000,
  headers: { accept: 'application/json' },
});

async function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await faphouseClient.get<FaphouseApiResponse<T>>(url, { params });
  return res.data.data;
}

export const FaphouseService = {
  getMovies(params: FaphouseMovieParams = {}): Promise<FaphousePagedData<FaphouseMovie>> {
    return getData('/api/public/movies', {
      sort: 'latest',
      page: 1,
      limit: FAPHOUSE_PAGE_SIZE,
      ...params,
    });
  },

  getMovieDetail(slug: string): Promise<FaphouseMovie> {
    if (!slug) {
      throw new Error('Missing faphouse movie slug');
    }
    return getData(`/api/public/movies/${encodeURIComponent(slug)}`);
  },

  async getGenres(): Promise<FaphouseGenre[]> {
    return (await getData<FaphousePagedData<FaphouseGenre>>('/api/public/genres')).items;
  },

  async getCountries(): Promise<FaphouseCountry[]> {
    return (await getData<FaphousePagedData<FaphouseCountry>>('/api/public/countries')).items;
  },

  async getActors(): Promise<FaphouseActor[]> {
    return (await getData<FaphousePagedData<FaphouseActor>>('/api/public/actors')).items;
  },
};

/**
 * Chuyển phim Faphouse sang shape detail của KKPhim để WatchScreen dùng lại nguyên player hiện có.
 * File MP4 được đưa vào một tập duy nhất qua `link_mp4`.
 */
export function toWatchDetail(movie: FaphouseMovie): KKDetailResponse {
  const hasMedia = Boolean(movie.media?.url);

  return {
    status: true,
    movie: {
      _id: movie.id,
      name: movie.title,
      slug: movie.slug,
      origin_name: movie.originalTitle ?? undefined,
      content: movie.description ?? undefined,
      type: 'single',
      poster_url: movie.posterUrl ?? undefined,
      thumb_url: movie.backdropUrl ?? movie.posterUrl ?? undefined,
      year: movie.releaseYear ?? undefined,
    },
    episodes: hasMedia
      ? [{
        server_name: 'Faphouse',
        server_data: [{
          name: 'Full',
          slug: 'full',
          link_mp4: movie.media?.url,
        }],
      }]
      : [],
  };
}
