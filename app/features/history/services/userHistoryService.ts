import axios, { AxiosError } from 'axios';
import apiClient, { type ApiRequestConfig } from '@/services/api/axiosClient';
import type {
  WatchHistoryItem,
  WatchHistoryMovie,
  WatchHistoryPagination,
  WatchHistoryPayload,
  WatchHistoryResponse,
} from '@/types';

const USER_HISTORY_ENDPOINT = 'https://flix-api.longdc.click/api/user/history';

interface UserHistoryRequestParams {
  limit?: number;
  page?: number;
}

interface UserHistorySaveResponse {
  msg?: string;
  status?: boolean;
}

interface UserHistoryDeleteResponse {
  msg?: string;
  status?: boolean;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
  msg?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeMovie(rawMovie: unknown): WatchHistoryMovie {
  if (!isRecord(rawMovie)) {
    return { name: 'Không rõ tiêu đề' };
  }

  return {
    name: typeof rawMovie.name === 'string' && rawMovie.name.trim().length > 0
      ? rawMovie.name
      : 'Không rõ tiêu đề',
    thumbUrl: typeof rawMovie.thumbUrl === 'string' && rawMovie.thumbUrl.length > 0
      ? rawMovie.thumbUrl
      : undefined,
    posterUrl: typeof rawMovie.posterUrl === 'string' && rawMovie.posterUrl.length > 0
      ? rawMovie.posterUrl
      : undefined,
    year: typeof rawMovie.year === 'number' ? rawMovie.year : undefined,
    type: typeof rawMovie.type === 'string' && rawMovie.type.length > 0
      ? rawMovie.type
      : undefined,
  };
}

function normalizeHistoryItem(rawItem: unknown): WatchHistoryItem | null {
  if (!isRecord(rawItem) || typeof rawItem.movieSlug !== 'string') {
    return null;
  }

  return {
    movieSlug: rawItem.movieSlug,
    episodeSlug: typeof rawItem.episodeSlug === 'string'
      ? rawItem.episodeSlug
      : rawItem.episodeSlug === null
        ? null
        : undefined,
    progressSeconds: typeof rawItem.progressSeconds === 'number'
      ? Math.max(0, Math.floor(rawItem.progressSeconds))
      : 0,
    watchedAt: typeof rawItem.watchedAt === 'string' ? rawItem.watchedAt : '',
    movie: normalizeMovie(rawItem.movie),
  };
}

function normalizePagination(rawPagination: unknown): WatchHistoryPagination {
  if (!isRecord(rawPagination)) {
    return {
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      totalItemsPerPage: 20,
    };
  }

  return {
    totalItems: typeof rawPagination.totalItems === 'number' ? rawPagination.totalItems : 0,
    totalPages: typeof rawPagination.totalPages === 'number' ? rawPagination.totalPages : 1,
    currentPage: typeof rawPagination.currentPage === 'number' ? rawPagination.currentPage : 1,
    totalItemsPerPage: typeof rawPagination.totalItemsPerPage === 'number'
      ? rawPagination.totalItemsPerPage
      : 20,
  };
}

function normalizeHistoryResponse(data: unknown): WatchHistoryResponse {
  if (!isRecord(data) || data.status !== true) {
    throw new Error('Không thể lấy lịch sử xem.');
  }

  const items = Array.isArray(data.items)
    ? data.items
      .map(normalizeHistoryItem)
      .filter((item): item is WatchHistoryItem => item !== null)
    : [];

  return {
    status: true,
    items,
    pagination: normalizePagination(data.pagination),
  };
}

function normalizeSavePayload(payload: WatchHistoryPayload): WatchHistoryPayload {
  const normalizedMovieSlug = payload.movieSlug.trim();
  const normalizedEpisodeSlug = typeof payload.episodeSlug === 'string' && payload.episodeSlug.trim().length > 0
    ? payload.episodeSlug.trim()
    : payload.episodeSlug === null
      ? null
      : undefined;

  return {
    movieSlug: normalizedMovieSlug,
    episodeSlug: normalizedEpisodeSlug,
    progressSeconds: Math.max(0, Math.floor(payload.progressSeconds)),
  };
}

export function getUserHistoryErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorPayload | undefined;
    const serverMessage = responseData?.message ?? responseData?.msg ?? responseData?.error;

    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage;
    }

    if (error.code === AxiosError.ERR_NETWORK) {
      return 'Không thể kết nối để đồng bộ lịch sử xem.';
    }

    if (error.code === AxiosError.ECONNABORTED) {
      return 'Yêu cầu đồng bộ lịch sử xem đã quá thời gian.';
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Đã xảy ra lỗi lịch sử xem.';
}

export const UserHistoryService = {
  async saveHistory(payload: WatchHistoryPayload): Promise<UserHistorySaveResponse> {
    const normalizedPayload = normalizeSavePayload(payload);

    if (!normalizedPayload.movieSlug) {
      throw new Error('Thiếu movieSlug để lưu lịch sử xem.');
    }

    if (!Number.isFinite(normalizedPayload.progressSeconds)) {
      throw new Error('progressSeconds không hợp lệ.');
    }

    const response = await apiClient.post<UserHistorySaveResponse>(
      USER_HISTORY_ENDPOINT,
      normalizedPayload,
      {} as ApiRequestConfig,
    );

    if (response.data?.status !== true) {
      throw new Error(response.data?.msg ?? 'Không thể lưu lịch sử xem.');
    }

    return response.data;
  },

  async getHistory(params: UserHistoryRequestParams = {}): Promise<WatchHistoryResponse> {
    const response = await apiClient.get<unknown>(USER_HISTORY_ENDPOINT, {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    } as ApiRequestConfig);

    return normalizeHistoryResponse(response.data);
  },

  async deleteHistory(movieSlug: string): Promise<UserHistoryDeleteResponse> {
    const normalizedMovieSlug = movieSlug.trim();

    if (!normalizedMovieSlug) {
      throw new Error('Thiếu movieSlug để xóa lịch sử xem.');
    }

    const response = await apiClient.delete<UserHistoryDeleteResponse>(
      `${USER_HISTORY_ENDPOINT}/${encodeURIComponent(normalizedMovieSlug)}`,
      {} as ApiRequestConfig,
    );

    if (response.data?.status !== true) {
      throw new Error(response.data?.msg ?? 'Không thể xóa lịch sử xem.');
    }

    return response.data;
  },
};

export default UserHistoryService;
