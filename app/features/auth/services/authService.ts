import axios, { AxiosError } from 'axios';
import apiClient, { type ApiRequestConfig } from '@/services/api/axiosClient';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GoogleAuthPayload,
  GoogleAuthResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  User,
} from '@/types';

const AUTH_ENDPOINTS = {
  forgotPassword: 'https://flix-api.longdc.click/api/auth/forgot-password',
  googleLogin: 'https://flix-api.longdc.click/api/auth/moba/google',
  login: 'https://flix-api.longdc.click/api/auth/login',
  register: 'https://flix-api.longdc.click/api/auth/register',
  resetPassword: 'https://flix-api.longdc.click/api/auth/reset-password',
  me: 'https://flix-api.longdc.click/api/auth/me',
} as const;

interface ApiErrorPayload {
  error?: string;
  message?: string;
  msg?: string;
  status?: boolean | number | string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeUser(rawUser: unknown): User | null {
  if (!isRecord(rawUser)) {
    return null;
  }

  const {
    id,
    email,
    displayName,
    avatarUrl,
    role,
    emailVerified,
    createdAt,
  } = rawUser;

  if (
    typeof id !== 'string'
    || typeof email !== 'string'
    || typeof displayName !== 'string'
    || typeof role !== 'string'
    || typeof emailVerified !== 'boolean'
    || typeof createdAt !== 'string'
  ) {
    return null;
  }

  return {
    id,
    email,
    displayName,
    avatarUrl: typeof avatarUrl === 'string' && avatarUrl.length > 0 ? avatarUrl : undefined,
    role,
    emailVerified,
    createdAt,
  };
}

function parseLoginResponse(data: unknown): LoginResponse {
  if (!isRecord(data)) {
    throw new Error('Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
  }

  if (data.status !== true) {
    const message = data.message ?? data.msg ?? data.error;
    throw new Error(
      typeof message === 'string' && message.trim().length > 0
        ? message
        : 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.',
    );
  }

  const token = typeof data.token === 'string' ? data.token.trim() : '';
  const refreshToken = typeof data.refreshToken === 'string' && data.refreshToken.trim().length > 0
    ? data.refreshToken.trim()
    : undefined;
  const user = normalizeUser(data.user);

  if (!token || !user) {
    throw new Error('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.');
  }

  return {
    status: true,
    token,
    refreshToken,
    user,
  };
}

function parseRegisterResponse(data: unknown): RegisterResponse {
  if (!isRecord(data)) {
    throw new Error('Đăng ký thất bại. Vui lòng thử lại.');
  }

  if (data.status !== true) {
    const message = data.message ?? data.msg ?? data.error;
    throw new Error(
      typeof message === 'string' && message.trim().length > 0
        ? message
        : 'Đăng ký thất bại. Vui lòng thử lại.',
    );
  }

  const token = typeof data.token === 'string' ? data.token.trim() : '';
  const refreshToken = typeof data.refreshToken === 'string' && data.refreshToken.trim().length > 0
    ? data.refreshToken.trim()
    : undefined;
  const expiresIn = typeof data.expiresIn === 'string' && data.expiresIn.trim().length > 0
    ? data.expiresIn.trim()
    : undefined;
  const refreshExpiresIn = typeof data.refreshExpiresIn === 'string' && data.refreshExpiresIn.trim().length > 0
    ? data.refreshExpiresIn.trim()
    : undefined;
  const user = normalizeUser(data.user);

  if (!token || !user) {
    throw new Error('Phản hồi đăng ký không hợp lệ. Vui lòng thử lại.');
  }

  return {
    status: true,
    token,
    refreshToken,
    expiresIn,
    refreshExpiresIn,
    user,
  };
}

function parseGoogleAuthResponse(data: unknown): GoogleAuthResponse {
  if (!isRecord(data)) {
    throw new Error('Đăng nhập Google thất bại. Vui lòng thử lại.');
  }

  if (data.status !== true) {
    const message = data.message ?? data.msg ?? data.error;
    throw new Error(
      typeof message === 'string' && message.trim().length > 0
        ? message
        : 'Đăng nhập Google thất bại. Vui lòng thử lại.',
    );
  }

  const token = typeof data.token === 'string' ? data.token.trim() : '';
  const refreshToken = typeof data.refreshToken === 'string' && data.refreshToken.trim().length > 0
    ? data.refreshToken.trim()
    : undefined;
  const expiresIn = typeof data.expiresIn === 'string' && data.expiresIn.trim().length > 0
    ? data.expiresIn.trim()
    : undefined;
  const refreshExpiresIn = typeof data.refreshExpiresIn === 'string' && data.refreshExpiresIn.trim().length > 0
    ? data.refreshExpiresIn.trim()
    : undefined;
  const user = normalizeUser(data.user);

  if (!token || !user) {
    throw new Error('Phản hồi đăng nhập Google không hợp lệ. Vui lòng thử lại.');
  }

  return {
    status: true,
    token,
    refreshToken,
    expiresIn,
    refreshExpiresIn,
    user,
  };
}

function parseMeResponse(data: unknown): MeResponse {
  if (!isRecord(data)) {
    throw new Error('Không thể lấy thông tin tài khoản.');
  }

  if (data.status !== true) {
    const message = data.message ?? data.msg ?? data.error;
    throw new Error(
      typeof message === 'string' && message.trim().length > 0
        ? message
        : 'Không thể lấy thông tin tài khoản.',
    );
  }

  const user = normalizeUser(data.user);

  if (!user) {
    throw new Error('Dữ liệu hồ sơ không hợp lệ.');
  }

  return {
    status: true,
    user,
  };
}

function parseStatusMessageResponse(
  data: unknown,
  fallbackMessage: string,
): { msg: string; status: true } {
  if (!isRecord(data)) {
    throw new Error(fallbackMessage);
  }

  if (data.status !== true) {
    const message = data.message ?? data.msg ?? data.error;
    throw new Error(
      typeof message === 'string' && message.trim().length > 0
        ? message
        : fallbackMessage,
    );
  }

  const message = typeof data.msg === 'string' && data.msg.trim().length > 0
    ? data.msg.trim()
    : typeof data.message === 'string' && data.message.trim().length > 0
      ? data.message.trim()
      : fallbackMessage;

  return {
    status: true,
    msg: message,
  };
}

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorPayload | undefined;
    const serverMessage = responseData?.message ?? responseData?.msg ?? responseData?.error;

    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage;
    }

    if (error.code === AxiosError.ERR_NETWORK) {
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.';
    }

    if (error.code === AxiosError.ECONNABORTED) {
      return 'Yêu cầu bị quá thời gian. Vui lòng thử lại.';
    }

    switch (error.response?.status) {
      case 400:
        return 'Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.';
      case 401:
        return 'Email hoặc mật khẩu không đúng.';
      case 403:
        return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.';
      case 409:
        return 'Email này đã được sử dụng.';
      case 422:
        return 'Thông tin đăng ký chưa hợp lệ. Vui lòng kiểm tra lại.';
      case 404:
        return 'Không tìm thấy dịch vụ xác thực.';
      case 500:
      case 502:
      case 503:
        return 'Máy chủ đang bận. Vui lòng thử lại sau.';
      default:
        break;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
}

export const AuthService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<unknown>(
      AUTH_ENDPOINTS.login,
      payload,
      { skipAuth: true } as ApiRequestConfig,
    );

    return parseLoginResponse(response.data);
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<unknown>(
      AUTH_ENDPOINTS.register,
      payload,
      { skipAuth: true } as ApiRequestConfig,
    );

    return parseRegisterResponse(response.data);
  },

  async googleLogin(payload: GoogleAuthPayload): Promise<GoogleAuthResponse> {
    const response = await apiClient.post<unknown>(
      AUTH_ENDPOINTS.googleLogin,
      payload,
      { skipAuth: true } as ApiRequestConfig,
    );

    return parseGoogleAuthResponse(response.data);
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<unknown>(
      AUTH_ENDPOINTS.forgotPassword,
      payload,
      { skipAuth: true } as ApiRequestConfig,
    );

    return parseStatusMessageResponse(
      response.data,
      'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.',
    );
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<unknown>(
      AUTH_ENDPOINTS.resetPassword,
      payload,
      { skipAuth: true } as ApiRequestConfig,
    );

    return parseStatusMessageResponse(
      response.data,
      'Không thể đặt lại mật khẩu. Vui lòng thử lại.',
    );
  },

  async getMe(): Promise<MeResponse> {
    const response = await apiClient.get<unknown>(AUTH_ENDPOINTS.me);
    return parseMeResponse(response.data);
  },

  async logout(): Promise<void> {
    return Promise.resolve();
  },
};

export default AuthService;
