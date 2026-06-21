// ─── KKPhim API Endpoints ─────────────────────────────────

export const ENDPOINTS = {
  // Phim mới cập nhật
  LATEST_V3: '/danh-sach/phim-moi-cap-nhat-v3',
  LATEST_V2: '/danh-sach/phim-moi-cap-nhat-v2',
  LATEST: '/danh-sach/phim-moi-cap-nhat',

  // Chi tiết phim
  MOVIE_DETAIL: (slug: string) => `/phim/${encodeURIComponent(slug)}`,

  // Danh sách theo type
  MOVIE_LIST: (typeList: string) => `/v1/api/danh-sach/${encodeURIComponent(typeList)}`,

  // Tìm kiếm
  SEARCH: '/v1/api/tim-kiem',

  // Thể loại
  CATEGORIES: '/the-loai',
  MOVIES_BY_CATEGORY: (slug: string) => `/v1/api/the-loai/${encodeURIComponent(slug)}`,

  // Quốc gia
  COUNTRIES: '/quoc-gia',
  MOVIES_BY_COUNTRY: (slug: string) => `/v1/api/quoc-gia/${encodeURIComponent(slug)}`,

  // Năm
  MOVIES_BY_YEAR: (year: string) => `/v1/api/nam/${encodeURIComponent(year)}`,

  // TMDB
  TMDB: (type: string, id: string) => `/tmdb/${type}/${id}`,
};

// Type lists
export const MOVIE_TYPE_LIST = {
  PHIM_BO: 'phim-bo',
  PHIM_LE: 'phim-le',
  TV_SHOWS: 'tv-shows',
  HOAT_HINH: 'hoat-hinh',
  PHIM_VIETSUB: 'phim-vietsub',
  PHIM_THUYET_MINH: 'phim-thuyet-minh',
  PHIM_LONG_TIENG: 'phim-long-tieng',
} as const;
