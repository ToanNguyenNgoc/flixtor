# CODEBASE_MEMORY.md — Flixtor

> Kiến trúc, flow, module, quyết định kỹ thuật hiện tại.  
> Chỉ ghi những gì **đã tồn tại thật** trong codebase.  
> Không ghi ý tưởng, wishlist, hay kế hoạch chưa implement.

---

## App Overview

- **Tên app**: Flixtor (Netflix-clone streaming app)
- **Bundle ID**: `com.myspa.flixtor`
- **Entry point**: `index.js` → `App.tsx`
- **Platform**: iOS + Android
- **RN version**: 0.86.0 | React 19.2.3
- **Navigation baseline**: React Navigation 8 alpha (`@react-navigation/native`, `bottom-tabs`, `native-stack` đều ở `8.0.0-alpha.30`)
- **New Architecture**: enabled trên Android (`newArchEnabled=true`), Metro/Babel đã chuyển sang stack Reanimated 4 + Worklets

---

## Initialization Flow

```
index.js
  └── AppRegistry.registerComponent('Flixtor', App)

App.tsx (AppInitializer useEffect)
  ├── initializeApiServer() — đọc `@flixtor/app_settings` → set runtime baseURL cho axiosClient
  ├── restoreSession()        — đọc JWT từ Keychain/legacy storage → gọi `/api/auth/me`
  ├── initMyList()            — đọc my list từ AsyncStorage
  ├── initializeContinueWatching() — đọc continue watching từ AsyncStorage
  └── BootSplash.hide({ fade: true })

App.tsx (current bootstrap flow)
  ├── loadFavorites()         — hydrate favorites từ AsyncStorage
  ├── loadHistory()           — hydrate watch history local từ AsyncStorage
  ├── initializeApiServer()   — đọc `@flixtor/app_settings` → set runtime baseURL cho movie data
  ├── restoreSession()        — phục hồi auth nếu user đã từng đăng nhập
  ├── useSystemStatus()
  │     ├── gọi `SystemService.getSystemStatus('app')` ở custom hook `app/hooks/useSystemStatus.ts`
  │     ├── `status === true && blocked === true`  → render `BrandNavigator`
  │     ├── còn lại / lỗi / timeout / sai format   → fallback `RootNavigator`
  │     └── khi app resume từ background → re-check `system-status` một lần với cooldown
  └── giữ `BootSplash` + `SplashScreen` tới khi bootstrap và lần check đầu hoàn tất

Providers wrap order:
  GestureHandlerRootView
    QueryClientProvider (staleTime: 2 min, gcTime: 8 min, retry: 1, no refetchOnWindowFocus/reconnect)
      SafeAreaProvider
        StatusBar (light-content, translucent)
          NavigationContainer (linking prefix: `flixtor://`)
            AppInitializer
              RootNavigator

### Navigation / Platform upgrade notes

- `babel.config.js` dùng `module:@react-native/babel-preset` và `react-native-worklets/plugin` làm plugin cuối để tương thích `react-native-reanimated@4`.
- `metro.config.js` được bọc bằng `wrapWithReanimatedMetroConfig(...)` để Reanimated 4 hoạt động đúng cùng SVG transformer hiện có.
- React Navigation 8 alpha hiện vẫn cần 3 patch-package patch nội bộ cho `@react-navigation/native` và nested `@react-navigation/elements`; patch files đã được regenerate đúng version hiện tại để `postinstall` sạch warning.
- `@tanstack/react-query` đã lên v5, nên các query dùng `gcTime`/`initialPageParam` theo API mới.
- Repo hiện typecheck sạch với baseline mới; `service.ts` được giữ lại như no-op placeholder vì `react-native-track-player` không còn nằm trong stack app và không còn được register ở `index.js`.
- iOS hiện có patch-package `patches/react-native-view-shot+4.0.3.patch` để `react-native-view-shot` nhận đúng `RCTScrollViewComponentView` trên React Native 0.86 / New Architecture.
- `ios/Podfile` đang ép `RNFBAnalytics`, `RNFBApp`, `RNFBAuth`, `RNFBMessaging` về `static_library` và nới `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES` cho các target `RNFB*` để tránh lỗi module header khi build iOS với `use_frameworks! :linkage => :static`.
```

---

## Navigation Architecture

```
App navigator gate
  ├── `BrandNavigator` khi backend trả `blocked = true`
  │     └── BrandScreen: màn hình maintenance/redirect, có CTA mở `redirectUrl` nếu có
  └── `RootNavigator` khi backend cho phép hoặc request check lỗi
        └── Main stack luôn mở
              ├── MainNavigator (bottom-tabs: Home, Search, Filter, Profile)
              ├── Login (mở tùy chọn từ Profile)
              ├── Register (mở tùy chọn từ Profile/Login)
              ├── ForgotPassword (mở tùy chọn từ Login)
              ├── ResetPassword (mở từ deeplink email hoặc navigate nội bộ)
              ├── History (mở từ Profile)
              ├── MovieDetail (slide_from_bottom)
              ├── Setting (slide_from_right)
              └── Watch (fade, orientation handled inside screen)

Deeplink hiện có:
- `flixtor://app` → mở vào tab `Home`
- `https://link-flixtor.vercel.app?screen=reset-password&token=...` → normalize sang route `ResetPassword`
- JS linking config nằm ở `app/navigation/linking.ts`
- iOS/Android đều đã đăng ký custom URL scheme `flixtor`; iOS có Associated Domain `applinks:link-flixtor.vercel.app`, Android có `https` app-link intent filter cho host này
```

---

## State Management

### Zustand Stores

| Store | File | Persisted |
|---|---|---|
| `useAuthStore` | `features/auth/store/authStore.ts` | Keychain cho access token + AsyncStorage cho refresh token/user/auth provider |
| `useProfileStore` | `features/profile/store/profileStore.ts` | Stub/no-op (guest profile flow đã bypass) |
| `useMyListStore` | `features/my-list/store/myListStore.ts` | AsyncStorage (movies array) |
| `usePlayerStore` | `features/player/store/playerStore.ts` | AsyncStorage (continueWatching) |

### React Query Cache

| Query key | Source | staleTime |
|---|---|---|
| `['home', 'sections']` | homeService.getSections | 30 min |
| `['home', 'banners']` | homeService.getBanners | 30 min |
| `['movie', 'detail', id]` | movieService.getDetail | 30 min |

---

## Data Layer (Mock)

Toàn bộ data hiện tại là mock — `app/services/mock/mockData.ts`:
- **20 movies** với đầy đủ fields (poster, backdrop từ picsum.photos/seed/*)
- **3 profiles** (John, Jane, Kids)
- **Mock user**: `toan@gmail.com`, plan: premium
- **7 home sections**: trending, top10, new_releases, action, comedy, horror, recommended
- **3 hero banners**: Nebula Rising, Shadow Protocol, The Grand Heist
- **4 episodes** cho series m9 (The Crown Chronicles)
- **2 mock downloads**: 1 completed, 1 downloading (62%)
- **3 continue watching items**

### Video URLs (Google CDN samples)
- `BigBuckBunny.mp4`, `ElephantsDream.mp4`, `ForBiggerBlazes.mp4`, `SubaruOutbackOnStreetAndDirt.mp4`

### Để swap mock → real API
Chỉ cần thay implementation trong `features/*/services/*.ts`.  
Hooks và stores không cần sửa.

---

## API Layer

**`app/services/api/axiosClient.ts`**:
- `baseURL` runtime mặc định là `https://flix-api.longdc.click`, vẫn có thể đổi qua `@flixtor/app_settings` cho data server phim
- Auth endpoints `/api/auth/login` và `/api/auth/me` gọi cố định về `https://flix-api.longdc.click` để không bị ảnh hưởng bởi toggle data server
- Request interceptor: tự động lấy JWT từ `TokenStorage` (Keychain trước, AsyncStorage fallback/migration) và gắn `Authorization: Bearer {token}`
- Response interceptor: log lỗi có kiểm soát, không log token; gặp `401` sẽ gọi unauthorized handler để clear session nhưng vẫn giữ app ở guest mode
- Exported wrappers: `get<T>`, `post<T>`, `put<T>`, `del<T>` (type-safe)

**`app/services/api/systemService.ts`**:
- `SystemService.getSystemStatus('app')` luôn gọi tuyệt đối tới `https://flix-api.longdc.click/system-status`
- Request dùng `skipAuth: true` để public endpoint không bị Bearer token/401 flow làm ảnh hưởng
- Parse response chặt chẽ (`status`, `platform`, `blocked`, `redirectUrl`) và để `App.tsx` quyết định fallback nếu response lỗi hoặc timeout

**`app/hooks/useSystemStatus.ts`**:
- Hook dùng chung cho gate trạng thái app: quản lý `isCheckingSystemStatus`, `isBlocked`, `redirectUrl`, `systemStatusError`
- Expose `refetchSystemStatus()` để `BrandNavigator` hoặc nơi khác có thể chủ động check lại
- Tự fallback `isBlocked = false` nếu request lỗi, timeout hoặc backend trả format không hợp lệ
- Có listener `AppState` để silent re-check khi app quay lại foreground, tránh gọi API quá dày bằng cooldown nội bộ

**`app/features/auth/services/authService.ts`**:
- `login(payload)` → `POST /api/auth/login`
- `register(payload)` → `POST /api/auth/register`
- `forgotPassword(payload)` → `POST /api/auth/forgot-password`
- `resetPassword(payload)` → `POST /api/auth/reset-password`
- `getMe()` → `GET /api/auth/me`
- Parse response defensively: bắt buộc phải có `status: true`, `token` và `user` hợp lệ trước khi update store; login/register đều không crash nếu backend trả sai format

**`app/features/history/services/userHistoryService.ts`**:
- `saveHistory(payload)` → `POST /api/user/history`
- `getHistory({ page, limit })` → `GET /api/user/history`
- `deleteHistory(movieSlug)` → `DELETE /api/user/history/{movieSlug}`
- Chỉ được gọi khi user đã đăng nhập; response được normalize để không crash nếu backend trả thiếu `items` hoặc `pagination`

**Auth UX hiện tại**:
- App không bắt buộc đăng nhập để xem phim; guest có thể vào thẳng Home/Search/Watch
- `restoreSession()` vẫn chạy lúc khởi tạo app để phục hồi tài khoản nếu trước đó user đã login/register
- `ProfileScreen` có 2 mode:
  - guest mode: hiện CTA `Đăng nhập tài khoản` và `Đăng ký tài khoản`
  - authenticated mode: hiện hồ sơ thật + refresh profile + logout
- `RegisterScreen` dùng API thật, validate email/displayName/password/confirm password và tự đăng nhập ngay sau khi đăng ký thành công
- `ForgotPasswordScreen` gửi `POST /api/auth/forgot-password` với `platform: 'MOBA'`, không tiết lộ email có tồn tại hay không
- `ResetPasswordScreen` nhận `token` từ deeplink hoặc navigate nội bộ, gọi `POST /api/auth/reset-password` và đưa user về `Login` sau khi đổi mật khẩu thành công
- `LoginScreen` có thêm nút Google Sign-In; hook `useAuthGoogle` chịu trách nhiệm `GoogleSignin.configure()`, `hasPlayServices()`, gọi `signIn()`, map Google user sang payload backend rồi `POST /api/auth/moba/google`
- `authStore` có action dùng chung `setAuthSession(...)` để email login, register và Google login cùng persist session một kiểu; logout sẽ sign out thêm khỏi Google client khi phiên hiện tại đến từ Google

---

## Screen Inventory

| Screen | Path | Auth required |
|---|---|---|
| LoginScreen | `features/auth/screens/LoginScreen.tsx` | No |
| RegisterScreen | `features/auth/screens/RegisterScreen.tsx` | No |
| ForgotPasswordScreen | `features/auth/screens/ForgotPasswordScreen.tsx` | No |
| ResetPasswordScreen | `features/auth/screens/ResetPasswordScreen.tsx` | No |
| BrandScreen | `brand/BrandScreen.tsx` | No (rendered only khi app bị blocked) |
| ProfileSelectionScreen | `features/profile/screens/ProfileSelectionScreen.tsx` | No (stub) |
| HomeScreen | `features/home/screens/HomeScreen.tsx` | No |
| SearchScreen | `features/search/screens/SearchScreen.tsx` | No |
| SettingScreen | `features/settings/screens/SettingScreen.tsx` | No |
| MyListScreen | `features/my-list/screens/MyListScreen.tsx` | No |
| DownloadsScreen | `features/downloads/screens/DownloadsScreen.tsx` | No |
| ProfileScreen | `features/profile/screens/ProfileScreen.tsx` | Optional |
| HistoryScreen | `features/history/screens/HistoryScreen.tsx` | Optional (API chỉ gọi khi logged-in) |
| MovieDetailScreen | `features/movie/screens/MovieDetailScreen.tsx` | No |
| WatchScreen | `features/player/screens/WatchScreen.tsx` | No |

---

## Key Component Behaviors

### HomeScreen
- `HeroBanner` được tách ra `app/components/movie/HeroBanner.tsx`, dùng `react-native-snap-carousel` để render tối đa 5 phim mới nhất dạng slider poster-centric có autoplay/pagination.
- Hero tích hợp sẵn top actions `Search` / `Profile`, badge metadata, nút lưu `My List`, và CTA mở `MovieDetail`.
- `HomeScreen` có thêm khối `Lối tắt khám phá` dưới hero để đi nhanh sang Search hoặc Filter theo type/country.
- `HomeScreen` có thêm block `Tiếp tục xem`: nếu user đã đăng nhập thì ưu tiên lấy từ API history, còn khi guest hoặc API lỗi sẽ fallback về local continue-watching từ `watchHistoryStore`.
- Card trong block `Tiếp tục xem` dùng shared component `ResumeMovieCard`: phần poster/title tái sử dụng trực tiếp `MovieCard`, còn footer hiển thị tập đang xem, progress bar và thời lượng đã xem.
- Khi item `Tiếp tục xem` đang đến từ server history của user đã đăng nhập, card trên Home cũng hiện action xóa trực tiếp và dùng chung optimistic delete flow với `HistoryScreen`.
- Khi user đã đăng nhập và xóa hết server history, Home không fallback sang local continue-watching; block `Tiếp tục xem` sẽ ẩn đúng theo dữ liệu server mới nhất.
- Section `Mới cập nhật` tự loại các phim đã dùng trong hero để tránh lặp ngay đầu trang.
- Home prefetch ảnh cho toàn bộ nhóm hero và 2 poster đầu mỗi section để giảm flash loading lúc vào trang.

### WatchScreen
- `react-native-video` với controls overlay (tap to toggle)
- WatchScreen hiện mở mặc định ở landscape bằng `react-native-orientation-locker`, nhưng vẫn có thể chuyển lại portrait bằng nút xoay hoặc cảm biến sau khi lock ban đầu được nhả.
- Khi rời màn hình sẽ `lockToPortrait()` lại cho app để Home/MovieDetail không bị kẹt xoay.
- WatchScreen vẫn lưu continue-watching local vào `watchHistoryStore`; ngoài ra nếu user đã login thì sẽ queue/throttle `POST /api/user/history` ở các mốc định kỳ, pause, seek ổn định, back, background và end.
- Landscape dùng immersive mode + ẩn status bar; video full-bleed sát hai cạnh màn hình để `Fill` cover trọn khung, còn top/bottom controls mới là phần tôn trọng safe-area và seek bar bám tuyệt đối ở mép dưới.
- Portrait hiện theo chế độ player-only: video `contain` nằm giữa màn hình trên nền đen, chỉ giữ lại controls overlay và ẩn toàn bộ panel metadata/thao tác bên dưới.
- `RootNavigator` mở `Watch` với `animation: 'none'` thay vì `fade` để tránh iOS native-stack giữ nhầm frame portrait khi đẩy sang màn landscape, làm player/video bị lệch khỏi khung nhìn.
- Khi source `m3u8` trên iOS load được audio nhưng native player không render hình kịp, `WatchScreen` sẽ fallback sang `link_embed` sau timeout ngắn hoặc ngay khi native player báo lỗi, để user vẫn xem được video.
- Có nút xoay thủ công trong player; nếu user xoay máy đúng với chiều đã chọn thủ công thì screen sẽ tự nhả lock để quay lại auto-rotate tự nhiên.
- `WatchScreen` tối ưu render bằng cách memo hóa `PlayerMediaSurface`, `EpisodeDrawer`, `QualityDrawer`; nhờ đó native `Video`/`WebView` và các drawer nặng không phải re-render theo mọi nhịp progress.
- Player dùng `progressUpdateInterval` động: khi controls đang hiện hoặc đang seek thì cập nhật nhanh hơn, còn khi controls ẩn sẽ giảm tần suất sync UI để bớt tải CPU/JS thread.
- Controls overlay không còn phủ nền tối toàn màn hình; thay vào đó chỉ top/bottom bars giữ nền mờ để giảm GPU overdraw.
- Controls auto-hide sau 3500ms
- Seek ±10 giây
- Progress được lưu vào `watchHistoryStore` để resume/history tiếp tục hoạt động khi đổi orientation hoặc back khỏi màn xem.

### MovieCard
- Variant: `poster` (2:3), `backdrop` (16:9), `topTen` (với rank number overlay)
- Dùng FastImage với `priority.normal`
- Series indicator badge (chữ "S" đỏ)

### Shared Image Pipeline
- Helper ảnh trong `app/utils/image.ts` chuẩn hoá URL `phimimg.com` và hiện trả trực tiếp URL gốc thay vì đi qua proxy `phimapi.com/image.php`, vì endpoint proxy không còn hoạt động ổn định.
- `prefetchImages()` preload trực tiếp URL ảnh gốc đã normalize.
- `CachedImage` giữ fallback từ URL chính hiện tại sang placeholder, đồng thời vẫn chấp nhận source URL đã được normalize sẵn.
- `CachedImage` chủ động bật native `Image` fallback cho nguồn `.webp` và sẽ tự chuyển sang native fallback nếu `FastImage` báo lỗi decode/load, để poster remote vẫn hiện ổn định trên cả các máy kén định dạng/cache.

### HistoryScreen
- Khi user đã đăng nhập, `HistoryScreen` gọi `GET /api/user/history?page=1&limit=20` qua React Query và hiển thị lịch sử xem dạng grid 2 cột.
- `HistoryScreen` dùng chung `ResumeMovieCard` với Home để giữ đồng nhất visual của poster card và phần metadata/progress khi resume.
- Mỗi card lịch sử xem có action xóa theo `movieSlug`; screen dùng React Query mutation với optimistic cache update để item biến mất ngay trên `HistoryScreen` và cả block `Tiếp tục xem` ở Home.
- Khi user chưa đăng nhập, `HistoryScreen` chỉ hiển thị guest state + CTA `Đăng nhập`, không gọi API protected.

### Android System UI Control
- App có native Android module `SystemUiModule` đăng ký thủ công trong `MainApplication.kt`.
- `app/utils/systemUi.ts` là JS wrapper để gọi `enterImmersive()` / `exitImmersive()` từ React Native.
- `WatchScreen` dùng module này để ép immersive mode khi vào màn xem landscape, giúp navigation/system bars ẩn mặc định và chỉ hiện tạm khi vuốt mép.
- Module này cũng hỗ trợ `setGestureExclusionRect()` / `clearGestureExclusionRects()` để loại trừ vùng slider khỏi system gesture trên Android 10+.

### Platform-Specific Video Seek Bar
- `WatchScreen` render seek bar thông qua component chung `VideoSeekBar`.
- `app/features/player/components/VideoSeekBar.ios.tsx` giữ nguyên native slider `@react-native-community/slider` cho iOS.
- `app/features/player/components/VideoSeekBar.android.tsx` dùng `react-native-gesture-handler` + `react-native-reanimated` để vẽ seek bar custom riêng cho Android, tránh lỗi native slider không nhận drag ổn định trên một số máy.
- `VideoSeekBar` dùng chung props seek (`duration`, `currentTime`, `bufferedTime`, `onSeekStart`, `onSeekChange`, `onSeekComplete`) để logic player trong `WatchScreen` không bị tách nhánh nhiều theo platform.

---

## AsyncStorage Keys

| Key | Data |
|---|---|
| `@flixtor/access_token` | string |
| `@flixtor/refresh_token` | string |
| `@flixtor/user` | User object |
| `@flixtor/selected_profile` | Profile object |
| `@flixtor/my_list` | Movie[] |
| `@flixtor/continue_watching` | ContinueWatchingItem[] |
| `@flixtor/download_queue` | DownloadItem[] |
| `@flixtor/app_settings` | App settings object (`apiServer`) |
| `@flixtor/search_history` | — |

### Auth Session Storage Notes
- JWT hiện được lưu ưu tiên trong `react-native-keychain` với service `com.flixtor.auth.access-token`
- `@flixtor/access_token` chỉ còn đóng vai trò legacy fallback/migration nếu thiết bị đang giữ token cũ trong AsyncStorage

---

## Design System

File: `app/config/theme.ts`

| Token | Value |
|---|---|
| Background | `#080808` |
| Primary (red) | `#E50914` |
| Text | `#FFFFFF` |
| Text secondary | `#B3B3B3` |
| Surface | `#141414` |
| Border | `#2A2A2A` |
| Success | `#46D369` |

Typography: System font (SF Pro iOS / Roboto Android).  
Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

---

## Known Decisions

1. **TrackPlayer removed from index.js** — project cũ dùng cho music app, đã clean khi setup Flixtor.
2. **IS_MOCK = true** — toàn bộ data là mock, không có backend thật.
3. **WatchScreen owns orientation flow** — App hỗ trợ portrait ở đa số màn hình, còn WatchScreen tự mở mặc định ở landscape, cho phép đổi lại portrait khi xem, và khóa portrait lại khi blur/unmount qua `react-native-orientation-locker`.
4. **picsum.photos/seed/** được dùng cho tất cả placeholder images — deterministic URLs.
5. **Hero banner dùng `react-native-snap-carousel` đã patch** — Home slider dựa trên thư viện cũ này, kèm patch tương thích React Native 0.81 trong `patches/react-native-snap-carousel+3.9.1.patch`.
