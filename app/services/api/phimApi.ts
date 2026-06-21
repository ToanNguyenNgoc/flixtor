// ─── KKPhim API Service ───────────────────────────────────
import apiClient from './axiosClient';
import { ENDPOINTS, MOVIE_TYPE_LIST } from './endpoints';
import type {
  KKCategory, KKCountry, KKDetailResponse, KKListResponse, KKMovie, MovieFilterParams,
} from '@/types';

// ─── Helpers ──────────────────────────────────────────────

function extractItems(data: KKListResponse): KKMovie[] {
  return data?.data?.items ?? data?.items ?? [];
}

function extractPagination(data: KKListResponse) {
  return data?.data?.params?.pagination ?? data?.pagination ?? null;
}

// ─── Latest movies ────────────────────────────────────────

export async function getLatestMovies(page = 1): Promise<KKListResponse> {
  const res = await apiClient.get(ENDPOINTS.LATEST_V3, { params: { page } });
  return res.data;
}

// ─── Movie detail ─────────────────────────────────────────

export async function getMovieDetail(slug: string): Promise<KKDetailResponse> {
  if (!slug) throw new Error('Missing movie slug');
  const res = await apiClient.get(ENDPOINTS.MOVIE_DETAIL(slug));
  return res.data;
}

// ─── Search ───────────────────────────────────────────────

export async function searchMovies(
  keyword: string,
  page = 1,
  limit = 12,
  signal?: AbortSignal,
): Promise<KKMovie[]> {
  const data = await searchMoviesPage(keyword, page, limit, signal);
  return extractItems(data);
}

export async function searchMoviesPage(
  keyword: string,
  page = 1,
  limit = 12,
  signal?: AbortSignal,
): Promise<KKListResponse> {
  const q = keyword.trim();
  if (q.length < 2) return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
  const res = await apiClient.get(ENDPOINTS.SEARCH, {
    signal,
    params: { keyword: q, page, limit },
  });
  return res.data;
}

// ─── Movie list by type ────────────────────────────────────

export async function getMovieList({
  typeList = MOVIE_TYPE_LIST.PHIM_BO,
  page = 1,
  sortField = 'modified.time',
  sortType = 'desc',
  lang = '',
  category = '',
  country = '',
  year = '',
  limit = 24,
}: MovieFilterParams & { typeList?: string }): Promise<KKListResponse> {
  const res = await apiClient.get(ENDPOINTS.MOVIE_LIST(typeList), {
    params: {
      page,
      sort_field: sortField,
      sort_type: sortType,
      sort_lang: lang || undefined,
      category: category || undefined,
      country: country || undefined,
      year: year || undefined,
      limit,
    },
  });
  return res.data;
}

// ─── Categories ───────────────────────────────────────────

export async function getCategories(): Promise<KKCategory[]> {
  const res = await apiClient.get(ENDPOINTS.CATEGORIES);
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.filter((item: KKCategory) => item?.name && item?.slug);
}

// ─── Countries ────────────────────────────────────────────

export async function getCountries(): Promise<KKCountry[]> {
  const res = await apiClient.get(ENDPOINTS.COUNTRIES);
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.filter((item: KKCountry) => item?.name && item?.slug);
}

// ─── Movies by category ───────────────────────────────────

export async function getMoviesByCategory({
  category = '',
  page = 1,
  sortField = 'modified.time',
  sortType = 'desc',
  lang = '',
  country = '',
  year = '',
  limit = 24,
}: MovieFilterParams): Promise<KKListResponse> {
  if (!category) throw new Error('Missing category slug');
  const res = await apiClient.get(ENDPOINTS.MOVIES_BY_CATEGORY(category), {
    params: {
      page,
      sort_field: sortField,
      sort_type: sortType,
      sort_lang: lang || undefined,
      country: country || undefined,
      year: year || undefined,
      limit,
    },
  });
  return res.data;
}

// ─── Movies by country ────────────────────────────────────

export async function getMoviesByCountry({
  country = '',
  page = 1,
  sortField = 'modified.time',
  sortType = 'desc',
  lang = '',
  category = '',
  year = '',
  limit = 24,
}: MovieFilterParams): Promise<KKListResponse> {
  if (!country) throw new Error('Missing country slug');
  const res = await apiClient.get(ENDPOINTS.MOVIES_BY_COUNTRY(country), {
    params: {
      page,
      sort_field: sortField,
      sort_type: sortType,
      sort_lang: lang || undefined,
      category: category || undefined,
      year: year || undefined,
      limit,
    },
  });
  return res.data;
}

// ─── Movies by year ───────────────────────────────────────

export async function getMoviesByYear({
  year = '',
  page = 1,
  sortField = 'modified.time',
  sortType = 'desc',
  lang = '',
  category = '',
  country = '',
  limit = 24,
}: MovieFilterParams): Promise<KKListResponse> {
  if (!year) throw new Error('Missing year');
  const res = await apiClient.get(ENDPOINTS.MOVIES_BY_YEAR(year), {
    params: {
      page,
      sort_field: sortField,
      sort_type: sortType,
      sort_lang: lang || undefined,
      category: category || undefined,
      country: country || undefined,
      limit,
    },
  });
  return res.data;
}

export { extractItems, extractPagination };
