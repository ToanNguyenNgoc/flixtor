# AGENTS.md — Flixtor React Native

> Instruction file cho AI agents (Codex, Claude, Gemini, etc.).  
> Đọc file này **đầu tiên** trước khi làm bất kỳ task nào trong repo.

---

## 1. Scope của repo

**Flixtor** — ứng dụng streaming video kiểu Netflix, xây dựng bằng **React Native CLI + TypeScript**.  
Target platform: iOS & Android.  
Bundle ID: `com.myspa.flixtor` (iOS), `com.flixtor` (Android — cần verify).  
App name trong `app.json`: `Flixtor`.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native CLI 0.86.0 |
| Language | TypeScript (strict) |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| State | Zustand ^5 |
| Server state / cache | @tanstack/react-query 4.33 |
| HTTP | Axios 1.5 |
| Video | react-native-video ^6 |
| Image | react-native-fast-image ^8 |
| Storage | @react-native-async-storage/async-storage ^2 |
| Gradient | react-native-linear-gradient |
| Animation | react-native-reanimated 3.19 |
| Gestures | react-native-gesture-handler ^2 |
| Safe area | react-native-safe-area-context |
| Slider | @react-native-community/slider |
| Splash | react-native-bootsplash ^7 |
| Forms | react-hook-form 7.52 |
| Patch tool | patch-package |

---

## 3. Cấu trúc thư mục

```
/
├── index.js                  # Entry point → App.tsx
├── App.tsx                   # Root: providers (GestureHandler, QueryClient, SafeArea, Navigation)
├── app/                      # Toàn bộ source code (alias @/ → app/)
│   ├── types/index.ts        # Shared TypeScript interfaces
│   ├── config/
│   │   ├── theme.ts          # Design tokens (colors, typography, spacing, etc.)
│   │   └── env.ts            # Environment config (IS_MOCK, API_BASE_URL)
│   ├── utils/
│   │   ├── formatTime.ts
│   │   ├── storage.ts        # AsyncStorage wrappers + StorageKeys
│   │   ├── debounce.ts       # debounce() + throttle()
│   │   └── constants.ts      # App-wide constants
│   ├── services/
│   │   ├── api/
│   │   │   ├── axiosClient.ts   # Axios instance + request/response interceptors
│   │   │   └── endpoints.ts     # API endpoint constants
│   │   └── mock/
│   │       └── mockData.ts      # Full mock dataset (20+ movies, profiles, sections)
│   ├── navigation/
│   │   ├── types.ts             # RootStackParamList, AuthStackParamList, MainTabParamList
│   │   ├── AuthNavigator.tsx    # Login / Register / ForgotPassword stack
│   │   ├── MainNavigator.tsx    # Bottom tabs (Home, Search, MyList, Downloads, Profile)
│   │   └── RootNavigator.tsx    # Auth-gated root (checks isAuthenticated + selectedProfile)
│   ├── store/                   # (reserved for global appStore if needed)
│   ├── components/
│   │   ├── common/              # AppHeader, EmptyState, ErrorState, LoadingSkeleton, ProgressBar
│   │   ├── movie/               # MovieCard, MovieCarousel, HeroBanner, SectionHeader
│   │   └── profile/             # ProfileAvatar
│   └── features/
│       ├── auth/                # Login, Register, ForgotPassword, Splash + authStore
│       ├── profile/             # ProfileSelection, ProfileScreen + profileStore
│       ├── home/                # HomeScreen, homeService, useHomeSections
│       ├── movie/               # MovieDetailScreen, movieService, useMovieDetail
│       ├── player/              # VideoPlayerScreen, useVideoProgress, playerStore
│       ├── search/              # SearchScreen, searchService, useSearchMovies
│       ├── my-list/             # MyListScreen, myListStore
│       └── downloads/           # DownloadsScreen (mock)
├── android/
├── ios/
├── docs/                        # Memory files (CODEBASE_MEMORY, CHANGE_MEMORY, FEATURE_BACKLOG)
└── patches/                     # patch-package patches
```

---

## 4. Path Alias

`@/` → `app/` (configured in both `babel.config.js` và `tsconfig.json`)

---

## 5. Build / Test / Lint Commands

```bash
# Dev server
npm start
# or with cache reset
npm run reset-cache

# Run on iOS
npm run ios           # react-native run-ios

# Run on Android
npm run android       # react-native run-android

# Lint
npm run lint          # eslint . (extends @react-native)

# Test
npm test              # jest (preset: react-native) — Needs verification (no test files found yet)

# iOS pods
npm run install:ios   # bundle install && cd ios && pod cache clean --all && bundle exec pod install

# Android release
npm run build:apk     # cd android && ./gradlew clean && ./gradlew assembleRelease
npm run build:aab     # cd android && ./gradlew clean && ./gradlew bundleRelease
```

> **Lint**: ESLint extends `@react-native`. Runs cleanly on current codebase — needs verification after each PR.  
> **Test**: Jest preset `react-native`. No test files exist yet — **Needs verification**.

---

## 6. Coding Conventions

### TypeScript
- TypeScript strict mode. **Không dùng `any`** trừ khi bắt buộc (phải comment lý do).
- Mọi props interface phải được đặt tên rõ ràng (không dùng inline anonymous types cho component props).
- Type imports phải dùng `import type { ... }` khi chỉ dùng cho type checking.

### Components
- Dùng `memo()` cho mọi list item component (MovieCard, ProfileAvatar, etc.).
- FlatList thay vì ScrollView cho danh sách có thể scroll dài.
- Không dùng inline style ở FlatList `renderItem` — extract ra `StyleSheet.create`.

### State
- **Zustand** cho global persistent state (auth, profile, myList, player progress).
- **React Query** cho server/async data với cache (home sections, movie detail, search).
- Không dùng useState cho data cần share giữa nhiều screen.

### Services & API
- Mock service nằm trong `app/services/mock/mockData.ts`.
- Để swap mock → real API: chỉ cần thay implementation trong `features/*/services/*.ts`, không sửa hooks hay stores.
- axiosClient tự động gắn Bearer token qua interceptor.

### Navigation
- Sử dụng `useNavigation<Nav>()` với typed navigation params từ `@/navigation/types.ts`.
- Mọi navigation call phải type-safe — không dùng string literal route name mà không có type.

### Styling
- Design tokens từ `@/config/theme.ts` — **không hardcode màu, font size, spacing**.
- StyleSheet.create bắt buộc — không dùng object literal inline cho style prop (ngoại lệ: flex:1 wrapper nếu thực sự cần).

### Encoding
- Tất cả file phải lưu **UTF-8 without BOM**.
- User-facing text string phải dùng Unicode literal đúng chuẩn — không escape needlessly.
- Nếu có text tiếng Việt trong source: đảm bảo editor + git config `core.quotepath=false`.

---

## 7. Context Efficiency Rules

- **Đọc file trước khi sửa** — không assume nội dung từ memory nếu file đã có thể thay đổi.
- **Đọc đủ, không đọc thừa** — chỉ mở file liên quan trực tiếp đến task.
- **File-first reading order** (khi bắt đầu task mới):
  1. `AGENTS.md` (file này)
  2. `docs/CODEBASE_MEMORY.md`
  3. `docs/CHANGE_MEMORY.md`
  4. File cụ thể liên quan đến task
- Không scan toàn bộ `node_modules`, `android/`, `ios/`, `patches/`.
- Khi cần hiểu một feature: đọc `features/<name>/` theo thứ tự `types → service → store → hook → screen`.

---

## 8. Memory Update Rules

| File | Cập nhật khi nào |
|---|---|
| `docs/CODEBASE_MEMORY.md` | Có thay đổi kiến trúc, thêm module mới, thay đổi flow quan trọng |
| `docs/CHANGE_MEMORY.md` | Sau khi hoàn thành task — ghi ngắn gọn: ngày, file đã sửa, lý do |
| `docs/FEATURE_BACKLOG.md` | Khi có ý tưởng/follow-up feature chưa implement — Status: proposed |

**Rules cứng:**
- ❌ KHÔNG ghi ý tưởng chưa implement vào `CHANGE_MEMORY.md`.
- ❌ KHÔNG ghi ý tưởng chưa implement vào `CODEBASE_MEMORY.md`.
- ❌ KHÔNG tự implement follow-up feature khi chưa được yêu cầu.
- ✅ Ghi follow-up feature vào `FEATURE_BACKLOG.md` sau khi hoàn thành task.

---

## 9. Feature Suggestion Rules

Sau khi hoàn thành một feature, **luôn** gợi ý 2-3 follow-up feature liên quan.  
Format gợi ý:

```
## Follow-up suggestions
1. [Feature name] — [lý do liên quan, 1 câu]
2. [Feature name] — [lý do liên quan, 1 câu]
```

Nếu user không confirm, không implement. Ghi vào `FEATURE_BACKLOG.md` với `Status: proposed`.

---

## 10. Final Checklist (trước khi trả lời)

- [ ] Đã đọc AGENTS.md và CODEBASE_MEMORY.md trước khi làm?
- [ ] Code dùng design tokens từ `theme.ts`, không hardcode?
- [ ] Types đầy đủ, không có `any` không cần thiết?
- [ ] StyleSheet.create cho tất cả styles?
- [ ] memo() cho list item components?
- [ ] Đã cập nhật CHANGE_MEMORY.md (nếu có thay đổi thực)?
- [ ] Đã cập nhật CODEBASE_MEMORY.md (nếu thay đổi kiến trúc)?
- [ ] Đã ghi follow-up features vào FEATURE_BACKLOG.md?
- [ ] File encoding UTF-8?
- [ ] Không implement follow-up chưa được approve?
