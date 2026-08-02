# CHANGE_MEMORY.md — Flixtor

> Log thay đổi thực đã làm.  
> ❌ Không ghi ý tưởng hay kế hoạch chưa implement ở đây.

---

## 2026-07-05 — Fix: ảnh không load + video chỉ có tiếng không có hình

**Files đã sửa:**
- `ios/Flixtor/Info.plist`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/res/xml/network_security_config.xml` [NEW]

**Thay đổi:**
- **iOS**: Thêm `NSAllowsArbitraryLoadsForMedia = true` và `NSExceptionDomains` cho `phimimg.com`, `phimapi.com`, `longdc.click`, `flix-api.longdc.click`. Trước đó `NSAllowsArbitraryLoads = false` không có exception nào → ATS block hết ảnh và stream video.
- **Android**: Thay `android:usesCleartextTraffic="${usesCleartextTraffic}"` (biến chưa được set trong build.gradle → undefined → block cleartext) bằng `true`. Thêm `android:networkSecurityConfig="@xml/network_security_config"`.
- **Android**: Tạo `res/xml/network_security_config.xml` với `base-config cleartextTrafficPermitted="true"` để video m3u8/HLS từ CDN HTTP phát được.

**Lý do:** FastImage/axios không load được ảnh trên iOS vì ATS block. Video react-native-video chỉ phát audio (không có hình) trên Android vì cleartext traffic bị block do biến gradle chưa resolve.

## 2026-08-02 — Fix triệt để bug xoay màn hình WatchScreen (portrait → landscape snap lại)

**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx`

**Root cause:** `unlockAllOrientations()` bị gọi ở 3 nơi bất kể trạng thái auto-rotate. Khi auto-rotate **TẮT**, gọi `unlockAllOrientations()` giải phóng app lock → hệ thống (auto-rotate OFF) lập tức ép về portrait → màn hình "snap" lại dù vừa lock landscape.

**3 chỗ đã sửa:**
1. `handleDeviceOrientationChange` (line ~614): Khi device đến đúng orientation → chỉ clear `manualOrientationLockRef`, chỉ gọi `unlockAllOrientations()` nếu `isAutoRotateEnabledRef.current === true`.
2. `useFocusEffect → getDeviceOrientation callback` (line ~661): Same fix.
3. `toggleOrientation` timer (auto-rotate OFF, landscape case, line ~1328): Bỏ `unlockAllOrientations()` khỏi timer — chỉ clear lock guard, giữ nguyên `lockToLandscapeLeft/Right`.

**Behavior sau fix:**
- Auto-rotate **TẮT**: Lock cứng trái/phải theo `lastLandscapeOrientationRef`, không bao giờ unlock → ổn định.
- Auto-rotate **BẬT**: Unlock sau khi sensor xác nhận → sensor tự do điều hướng (xoay full).

---

## 2026-08-02 — Sửa MainNavigator iOS bị nháy trắng khi chuyển tab Liquid Glass

**Files đã sửa:**
- `App.tsx`
- `app/navigation/MainNavigator.tsx`
- `app/features/auth/screens/SplashScreen.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Truyền custom dark theme vào `NavigationContainer` để React Navigation không còn fallback sang `LightTheme` nền trắng trong lúc native tab/stack transition trên iOS.
- `MainNavigator` thêm `sceneStyle` nền tối, tắt tab animation và giữ `inactiveBehavior: 'none'` để scene khi đổi tab ổn định hơn, giảm flash trắng trên iOS.
- Với iPhone có `isLiquidGlassSupported`, tab bar native được ép `backgroundColor` và `shadowColor` sang trong suốt để glass bar không còn ám nền trắng.
- `SplashScreen` đổi fallback background từ trắng sang nền tối của app để tránh các frame trắng ngắn nếu overlay render trước ảnh splash.

**Lý do:** User báo trên iOS khi `isLiquidGlassSupported` bật, mỗi lần chuyển tab màn hình bị nháy trắng và tab bar nhìn trắng đục thay vì trong suốt.

## 2026-08-02 — Bỏ overlay loading/splash React Native ở App bootstrap

**Files đã sửa:**
- `App.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Xóa `HomeScreenSkeleton` và `SplashScreen` overlay khỏi `NavigationContainer` khi app đang bootstrap.
- Giữ native `BootSplash.hide({ fade: true })`, nhưng chuyển sang trigger bằng `useEffect` khi `shouldShowLoading` kết thúc để không còn phụ thuộc `onLayout` của overlay.
- Cập nhật memory docs để phản ánh app không còn dùng hybrid React Native splash overlay trong startup flow.

**Lý do:** User xác nhận phần overlay loading/splash này không còn cần thiết và muốn bỏ đi.

## 2026-08-02 — Thêm background playback và Picture in Picture cho WatchScreen

**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx`
- `android/app/src/main/AndroidManifest.xml`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- `WatchScreen` bật `playInBackground`, `playWhenInactive`, `enterPictureInPictureOnLeave` và `showNotificationControls` cho native `react-native-video`.
- Thêm nút `PiP` trong control bar để user chủ động vào Picture in Picture; khi PiP active app sẽ tự đóng overlays/control phụ và save tiến độ ngay.
- Gắn metadata title/subtitle/artwork vào `Video` source để lock screen / notification controls có nội dung đúng hơn.
- Android manifest được bổ sung `android:supportsPictureInPicture="true"`, các quyền foreground media playback và `VideoPlaybackService` của `react-native-video`.

**Lý do:** User muốn cập nhật tính năng xem trong nền và Picture in Picture cho màn xem phim.

## 2026-08-02 — Sửa WatchScreen nhớ sai hướng landscape khi bấm nút xoay

**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Thêm `returnLandscapeOrientationRef` để lưu lại landscape side gần nhất và dùng lại khi user chuyển portrait → landscape bằng nút xoay.
- Khi thiết bị đang khóa auto-rotate, logic mới không còn suy ra lại hướng landscape từ trạng thái hiện tại của máy; thay vào đó app quay về đúng side trước đó (`LEFT` hoặc `RIGHT`) mà user vừa xem.
- `handleOrientationChange` không còn được phép ghi đè hướng landscape đã nhớ nếu callback orientation đến trong lúc manual lock đang ép sang orientation khác; nhờ vậy các callback lệch nhịp lúc chuyển về portrait không còn làm đổi `LEFT` thành `RIGHT`.
- Layout player giờ bám theo viewport thực thay vì state `currentOrientation`, và nhánh `auto-rotate OFF` không còn `unlockAllOrientations()` trước khi lock sang `LANDSCAPE-LEFT/RIGHT`; nhờ vậy app không còn rơi vào trạng thái UI landscape nhưng viewport thực vẫn portrait.
- Khi auto-rotate của thiết bị đang mở, app vẫn ưu tiên theo hướng cầm máy hiện tại như trước.

**Lý do:** User báo đang ở xoay trái, bấm về dọc rồi bấm xoay lại thì player nhảy sang xoay phải; mong muốn là quay lại đúng xoay trái khi thiết bị đang khóa xoay.

## 2026-08-02 — Refactor lại flow orientation của WatchScreen để fix dứt điểm portrait ↔ landscape-left

**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`

**Thay đổi:**
- Bỏ hẳn `lockToLandscape()` chung chung trong `WatchScreen`; screen giờ chỉ khóa bằng `lockToLandscapeLeft()` hoặc `lockToLandscapeRight()` để tránh native iOS tự suy ra lại side và làm lệch trái/phải sau khi vừa đi qua portrait.
- Gom orientation state về 3 ref rõ ràng: `uiOrientationRef` (UI orientation thật), `preferredLandscapeOrientationRef` (landscape side cần nhớ), và `pendingOrientationRef` (orientation đang chờ native settle).
- `handleOrientationChange` chỉ chấp nhận event khớp với pending target; các event lệch nhịp trong lúc đang transition không còn được phép ghi đè remembered landscape side.
- Khi bấm về portrait, app ưu tiên lưu lại side landscape từ chính UI đang hiển thị thay vì từ `deviceOrientation`, nhờ vậy flow `landscape-left -> portrait -> landscape` quay lại đúng bên trái cả khi sensor/device orientation đang báo lệch.

**Lý do:** Sau các bản fix trước, user vẫn gặp lỗi từ portrait quay lại landscape-left bị sai hướng hoặc render lệch khung. Root cause còn lại là `lockToLandscape()` và `deviceOrientation` vẫn xen vào flow nhớ side, làm state orientation không còn một nguồn sự thật ổn định.

## 2026-08-02 — Đổi cặp nút xoay thủ công của WatchScreen sang portrait ↔ landscape-right

**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`

**Thay đổi:**
- Thêm hằng `MANUAL_TOGGLE_LANDSCAPE_ORIENTATION = LANDSCAPE-RIGHT` để nút xoay thủ công luôn ưu tiên xoay phải khi đi từ portrait sang landscape.
- Khi user bấm về portrait, `preferredLandscapeOrientationRef` cũng được reset về `LANDSCAPE-RIGHT`; nhờ vậy lần bấm xoay tiếp theo sẽ quay lại xoay phải thay vì giữ side trái trước đó.
- Cập nhật memory docs để phản ánh behavior mới của manual rotate.

**Lý do:** User xác nhận flow xoay đã ổn, nhưng muốn cặp xoay thủ công đổi từ `xoay trái ↔ dọc` sang `xoay phải ↔ dọc`.

## 2026-08-02 — Thêm player preferences trong ProfileScreen cho hướng xoay và PiP

**Files đã sửa:**
- `app/features/player/store/playerPreferencesStore.ts` [NEW]
- `app/features/player/screens/WatchScreen.tsx`
- `app/features/profile/screens/ProfileScreen.tsx`
- `app/utils/storage.ts`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Tạo `usePlayerPreferencesStore` persist riêng cho player preferences, lưu `manualLandscapeOrientation` (`left/right`, mặc định `left`) và `pictureInPictureEnabled` (mặc định `true`).
- `ProfileScreen` có thêm section `Trình phát` cho cả guest mode lẫn authenticated mode, cho phép user đổi hướng xoay thủ công `LEFT/RIGHT` và bật/tắt `Picture in Picture` trực tiếp.
- `WatchScreen` không còn hardcode hướng xoay thủ công hay PiP nữa; nút rotate giờ đọc side từ player preferences store, còn auto-enter/nút `PiP` chỉ bật khi setting PiP đang `ON`.
- Bổ sung `StorageKeys.PLAYER_PREFERENCES` để tách riêng player settings khỏi `APP_SETTINGS` của API server.

**Lý do:** User muốn cấu hình `RIGHT/LEFT` (mặc định `LEFT`) và `on/off Picture in Picture` (mặc định `on`) ngay trong `ProfileScreen.tsx`.

## 2026-08-01 — Sửa CachedImage không hiển thị poster `.webp`

**Files đã sửa:**
- `app/components/common/CachedImage.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Thêm nhận diện source remote `.webp` trong `CachedImage` để bật `FastImage` native fallback (`Image`) ngay từ đầu thay vì cố decode hoàn toàn bằng pipeline riêng của `FastImage`.
- Khi lượt tải đầu bằng `FastImage` báo lỗi, component sẽ tự chuyển sang native fallback trước khi rơi về placeholder, giúp các URL ảnh hợp lệ nhưng kén decoder/cache vẫn hiển thị được.
- Bỏ `console.log(targetSource)` thừa trong render path của `CachedImage`.

**Lý do:** User báo `targetSource` đã có `uri` đúng nhưng poster từ `phimimg.com` dạng `.webp` vẫn không render trên app.

## 2026-08-01 — Sửa toàn bộ lỗi `StyleSheet.absoluteFillObject`

**Files đã sửa:**
- `app/components/common/CachedImage.tsx`
- `app/components/movie/HeroBanner.tsx`
- `app/features/movie/screens/MovieDetailScreen.tsx`
- `app/features/player/components/EmbedPlayer.tsx`
- `app/features/player/screens/WatchScreen.tsx`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Thay toàn bộ chỗ dùng `StyleSheet.absoluteFillObject` trong app bằng `StyleSheet.absoluteFill` hoặc spread từ `StyleSheet.absoluteFill` tuỳ context để tương thích với typings React Native hiện tại.
- Giữ nguyên layout tuyệt đối của backdrop, poster, loading overlay, drawer overlay và player overlay sau khi đổi constant style.
- Xác nhận lại bằng `tsc` rằng lỗi `Property 'absoluteFillObject' does not exist on type 'typeof StyleSheet'` đã hết trên toàn bộ source app.

**Lý do:** User yêu cầu fix dứt điểm lỗi TypeScript `ts(2551)` cho toàn bộ `StyleSheet.absoluteFillObject`.

## 2026-08-01 — Sửa MainNavigator Android không chuyển được tab

**Files đã sửa:**
- `app/navigation/MainNavigator.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Viết `AndroidTabBar` riêng cho `MainNavigator` và render qua prop `tabBar` khi chạy trên Android.
- Tab press trên Android giờ đi qua `navigation.emit('tabPress')` và `CommonActions.navigate(...)` trực tiếp, không còn phụ thuộc vào phần tab bar mặc định của `@react-navigation/bottom-tabs` alpha.
- Giữ iOS theo implementation hiện có, đồng thời bảo toàn label/icon hiện tại và thêm `tabBarHideOnKeyboard` cho Android.

**Lý do:** User báo `MainNavigator` trên Android không thể chuyển tab khi bấm vào bottom tabs.

## 2026-08-01 — Sửa splash Android không hiển thị full màn hình

**Files đã sửa:**
- `App.tsx`
- `app/assets/image/index.ts`
- `app/assets/image/bootsplash.png` [NEW]
- `app/features/auth/screens/SplashScreen.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Thêm asset `app/assets/image/bootsplash.png` từ artwork full-screen hiện có để React Native có thể render splash toàn màn hình ổn định.
- `SplashScreen.tsx` được đổi từ text/loading đơn giản sang ảnh full-screen và nhận `onLayout` callback.
- `App.tsx` không còn hide native `BootSplash` ngay sau bootstrap; thay vào đó app chờ `SplashScreen` overlay render xong frame đầu tiên rồi mới `BootSplash.hide({ fade: true })`, nhờ vậy Android không còn chỉ hiện logo vuông nhỏ ở giữa trong suốt lúc bootstrap.

**Lý do:** User báo splash Android không full màn hình dù đã có artwork ở `drawable/bootsplash_logo.png`.

## 2026-08-01 — Sửa lỗi `installDebug` không cài được app trên emulator

**Files đã sửa:**
- `android/gradle.properties`
- `android/app/build.gradle`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Đổi mặc định `reactNativeArchitectures` từ `armeabi-v7a,arm64-v8a,x86,x86_64` xuống `arm64-v8a,x86_64` để giảm kích thước APK debug cho máy dev hiện tại.
- Sửa cú pháp khai báo `ndkVersion`, `buildToolsVersion`, `compileSdk` sang dạng `=` trong `android/app/build.gradle` để bớt warning deprecated của Gradle 9.
- Xác nhận lại bằng build + `adb install` rằng APK debug giảm từ khoảng `325M` xuống `189M` và cài được lại trên emulator.

**Lý do:** `:app:installDebug` fail với `INSTALL_FAILED_INSUFFICIENT_STORAGE` do APK debug universal quá lớn so với dung lượng trống còn lại của emulator.

---

## 2026-07-05 — Fix WatchScreen: video bị tràn ra ngoài màn hình


**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx`

**Thay đổi:**
- Bỏ điều kiện `isLandscapeViewport` khỏi `isLandscape` — orientation state là nguồn duy nhất, không phụ thuộc `window.width/height` chưa kịp update.
- Thêm `playerW / playerH` explicit dimensions cho `playerSurface` trong landscape mode (lấy `max/min` của `window.width` và `window.height`).
- Đổi `videoFrame` từ `absoluteFillObject` sang `flex: 1, position: 'relative'` để `Video` con dùng `absoluteFill` hoạt động đúng trong flex container.
- `playerSurfaceLandscape` bỏ `flex: 1`, dùng `alignSelf: 'stretch'` + explicit `width/height`.

**Lý do:** Video bị render ra ngoài màn hình (controls hiện xoay 90° ở cạnh phải) vì `isLandscape = false` khi viewport chưa update sau khi native đã xoay, làm layout dùng sai dimensions.

## 2026-07-05 — Sửa source ảnh hỏng và thêm fallback video iOS

**Files đã sửa:**
- `app/utils/image.ts`
- `app/utils/episode.ts`
- `app/features/player/screens/WatchScreen.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Bỏ image proxy `phimapi.com/image.php` trong helper ảnh và trả trực tiếp URL gốc `phimimg.com`, vì proxy hiện trả `404`.
- Gắn `fallbackUri` từ `link_embed` vào `VideoSource` khi episode có `m3u8`, để player có đường lui nếu native video không render được hình.
- Trên iOS, `WatchScreen` sẽ tự chuyển sang embed player khi source `m3u8` báo lỗi hoặc không `onReadyForDisplay` trong một khoảng ngắn, giảm trường hợp chỉ nghe tiếng mà không có hình.

**Lý do:** User báo poster/source ảnh không load và player có tiếng nhưng không hiện hình khi phát phim.

---

## 2026-07-05 — Nâng React Native lên 0.86.0

**Files đã sửa:**
- `AGENTS.md`
- `package.json`
- `package-lock.json`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Đồng bộ `react-native` lên `0.86.0`.
- Đồng bộ các package lõi `@react-native/*` (`new-app-screen`, `babel-preset`, `eslint-config`, `metro-config`, `typescript-config`) lên `0.86.0`.
- Cập nhật `react` và `react-test-renderer` lên `19.2.3` để khớp peer dependencies của RN 0.86.
- Refresh `package-lock.json` theo dependency tree mới.

**Lý do:** User yêu cầu chuyển baseline framework của app sang React Native `0.86.0`.

## 2026-07-05 — Sửa blocker iOS build sau khi lên RN 0.86

**Files đã sửa:**
- `ios/Podfile`
- `patches/react-native-view-shot+4.0.3.patch`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Thêm patch-package cho `react-native-view-shot@4.0.3` để `RNViewShot.mm` hỗ trợ `RCTScrollViewComponentView` trên React Native 0.86 / New Architecture.
- Cập nhật `ios/Podfile` để ép các pod `RNFB*` đang dùng sang `static_library` và cho phép non-modular includes trong framework modules, tránh lỗi compile header của React Native Firebase khi build iOS.
- Reinstall Pods sau khi cập nhật Podfile để project native nhận cấu hình mới.

**Lý do:** Build iOS bị dừng ở `react-native-view-shot` và sau đó vướng thêm compile error từ React Native Firebase sau khi nâng React Native lên `0.86.0`.

## 2026-07-05 — Sửa layout màn Watch bị lệch khung trên iOS

**Files đã sửa:**
- `app/navigation/RootNavigator.tsx`
- `app/features/player/screens/WatchScreen.tsx`
- `docs/CODEBASE_MEMORY.md`
- `docs/CHANGE_MEMORY.md`
- `docs/FEATURE_BACKLOG.md`

**Thay đổi:**
- Đổi transition của screen `Watch` từ `fade` sang `none` để tránh bug iOS native-stack/react-native-screens giữ nhầm frame portrait khi push sang màn landscape.
- Chỉ áp dụng layout landscape của `WatchScreen` khi viewport React Native thực sự có `width > height`, tránh render control/video theo orientation "ảo" trước khi màn hình xoay xong.

**Lý do:** User báo giao diện trình phát phim trên iOS bị tràn/out khỏi màn hình dù màn Watch đã xoay ngang đúng.

## 2026-05-12 — Initial scaffold (52 files)

**Foundation**: types/index.ts, config/theme.ts, config/env.ts, utils/\*, services/api/\*, services/mock/mockData.ts  
**Navigation**: AuthNavigator, MainNavigator (5 tabs), RootNavigator (auth-gated)  
**Stores**: authStore, profileStore, myListStore, playerStore (Zustand + AsyncStorage)  
**Components**: AppHeader, EmptyState, ErrorState, LoadingSkeleton, ProgressBar, MovieCard, MovieCarousel, HeroBanner, SectionHeader, ProfileAvatar  
**Screens**: Login, Register, ForgotPassword, Splash, ProfileSelection, Profile, Home, MovieDetail, VideoPlayer, Search, MyList, Downloads  
**Updated**: App.tsx (providers + AppInitializer), index.js (removed TrackPlayer)

---

## 2026-05-12 — User edits post-scaffold

- `App.tsx`: Added BootSplash import + `BootSplash.hide({ fade: true })` in AppInitializer
- `app/services/mock/mockData.ts`: MOCK_USER.email → `toan@gmail.com`

---

## 2026-05-12 — Migration sang KKPhim API

**Files đã tạo mới:**
- `app/types/index.ts` — Rewrite hoàn toàn sang KKPhim types
- `app/services/api/axiosClient.ts` — baseURL → phimapi.com
- `app/services/api/endpoints.ts` — KKPhim endpoints
- `app/services/api/phimApi.ts` — Full API service layer
- `app/utils/episode.ts` — getAllEpisodes, getCurrentEpisode, getEpisodeSource
- `app/utils/image.ts` — getMovieImageUrl, getPosterSource, getThumbSource
- `app/hooks/useDebouncedValue.ts` — Generic debounce hook
- `app/navigation/types.ts` — 6-tab navigation types
- `app/navigation/MainNavigator.tsx` — 6 tabs: Home, Search, Filter, Favorites, History, Profile
- `app/navigation/RootNavigator.tsx` — RootTabs + MovieDetail + Watch screens
- `app/features/favorites/store/favoriteStore.ts` — Zustand + AsyncStorage
- `app/features/history/store/watchHistoryStore.ts` — Zustand + AsyncStorage + resume logic
- `app/features/home/hooks/useMovieLists.ts` — useLatestMovies, useMovieList, useInfiniteMovieList
- `app/features/movie/hooks/useMovieDetail.ts` — React Query hook
- `app/features/search/hooks/useSearchMovies.ts` — Debounced search hook
- `app/features/filter/hooks/useCategories.ts` — Categories hook
- `app/features/filter/hooks/useCountries.ts` — Countries hook
- `app/features/home/screens/HomeScreen.tsx` — Real API + hero banner + 5 sections
- `app/features/movie/screens/MovieDetailScreen.tsx` — Real API + RenderHtml + episodes
- `app/features/player/screens/WatchScreen.tsx` — Episode management + history tracking
- `app/features/player/components/VideoPlayer.tsx` — Custom video player với controls
- `app/features/player/components/EmbedPlayer.tsx` — WebView fallback
- `app/features/player/components/EpisodeList.tsx` — Episode picker
- `app/features/search/screens/SearchScreen.tsx` — Debounced search với real API
- `app/features/filter/screens/FilterScreen.tsx` — Infinite scroll + type chips
- `app/features/filter/components/FilterBottomSheet.tsx` — Filter modal
- `app/features/favorites/screens/FavoritesScreen.tsx` — Favorite list
- `app/features/history/screens/HistoryScreen.tsx` — Watch history + resume
- `app/features/profile/screens/ProfileScreen.tsx` — Guest mode profile
- `app/components/movie/MovieCard.tsx` — KKMovie type + badges
- `app/components/movie/MovieGrid.tsx` — 3-column infinite grid
- `app/config/theme.ts` — Thêm BorderRadius.xs

**Files đã stub/simplify:**
- Tất cả mock data, old services, old stores đã được stub để tránh compile error
- Old VideoPlayerScreen, old auth screens — stubbed
- myListStore, playerStore, profileStore — simplified cho guest mode
- App.tsx — init favoriteStore + watchHistoryStore, remove old stores

**Lý do:** Chuyển đổi hoàn toàn từ mock data sang API thật phimapi.com

---

## 2026-05-12 — Fix Video Player UI (Fullscreen + Controls)

**Files đã sửa:**
- `app/features/player/components/VideoPlayer.tsx` — Rewrite hoàn toàn
- `app/features/player/screens/WatchScreen.tsx` — Rewrite layout

**Thay đổi:**
- VideoPlayer: Portrait mode = video 16:9 ở trên, không cần orientation package
- VideoPlayer: Fullscreen = Modal landscape (supportedOrientations landscape) chiếm toàn màn hình
- Controls: Back (←), tua lùi/tới 10s (↺/↻), Play/Pause (⏸/▶), thanh thời gian/Slider, Speed (0.5x–2x), Mute, Fullscreen toggle
- Controls tự ẩn sau 3.5s, tap để hiện lại
- Mini progress bar màu đỏ bên dưới video (portrait mode)
- WatchScreen: Episode list ẩn khi fullscreen, hiện lại khi thu nhỏ
- Episode list hiển thị horizontal scroll với active highlight
- Auto-save progress mỗi 20s + khi đổi tập + khi back

**Lý do:** UI bị vỡ layout, video không xoay ngang, thiếu controls đầy đủ

---

## 2026-05-12 — Fix Landscape Video Player + Orientation Locker

**Package mới:**
- `react-native-orientation-locker` — programmatic orientation lock

**Files đã sửa:**

### JS/TS
- `app/features/player/screens/WatchScreen.tsx` — Rewrite hoàn toàn:
  - `useFocusEffect`: lockToLandscape() khi focus, lockToPortrait() khi blur/unmount
  - `BackHandler`: xử lý Android hardware back → restore portrait → goBack()
  - Layout ngang: video column (full height) + episode panel (140px, bên phải)
  - Không dùng SafeArea/Modal, video chiếm toàn màn hình
- `app/features/player/components/VideoPlayer.tsx` — Bỏ logic Modal/rotation, chỉ render Video + controls
- `app/navigation/RootNavigator.tsx` — Watch screen: animation='fade', autoHideHomeIndicator=true

### Native iOS
- `ios/flixtor/AppDelegate.swift` — Thêm `supportedInterfaceOrientationsFor` → OrientationLocker.getOrientation()
- `ios/flixtor/Podfile.lock` — react-native-orientation-locker pod installed (115 pods)

### Android
- Không cần sửa AndroidManifest vì không có `screenOrientation` hardcoded

**Lý do:** Video player không xoay landscape, back không restore portrait, UI bị vỡ

---

## 2026-05-13 — Fix Tab Bar UI

**Files đã sửa:**
- `app/navigation/MainNavigator.tsx` — Thay đổi styling Tab bar:
  - Bỏ component custom `TabIcon` và sử dụng `tabBarShowLabel: true` mặc định của React Navigation để text hiển thị đầy đủ, không bị cắt chữ.
  - TabBarIcon đổi màu động (`Colors.white` khi active, `Colors.tabInactive` khi inactive).
  - Tối ưu spacing, height, paddingBottom theo `useSafeAreaInsets` cho iOS & Android.

**Lý do:** User yêu cầu làm UI của Tab bar trong `MainNavigator.tsx` đẹp hơn, tránh lỗi cắt/tràn chữ.

---

## 2026-05-13 — Fix UI MovieDetailScreen

**Files đã sửa:**
- `app/features/movie/screens/MovieDetailScreen.tsx` — Sửa UI "Danh sách tập":
  - Gom nhóm tập phim (chunkArray) mỗi 50 tập 1 nhóm.
  - Xây dựng UI Accordion (mở rộng/thu gọn) bằng state `expandedChunk`.
  - Kết hợp với `LayoutAnimation` để hiệu ứng đóng mở mượt mà.
  - Tính toán động chiều rộng của từng nút tập phim (`accordionItemWidth` và `gridItemWidth`) dựa theo kích thước màn hình để đảm bảo các tập luôn chia đều thành 4 cột thẳng tắp.

**Lý do:** User yêu cầu gom nhóm 50 tập 1 và dùng accordion để tối ưu việc hiển thị với phim có số lượng tập siêu lớn (như 400+ tập), đồng thời muốn các tập xếp thẳng hàng, thẳng cột.

---

## 2026-05-13 — Upgrade WatchScreen Video Player (YouTube style)

**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx` — Nâng cấp thao tác xem video:
  - Thêm logic nhận diện **Double Tap** (thời gian giữa 2 lần tap < 300ms) để tua video:
    - Nửa trái màn hình: Tua lùi 10s (có giới hạn >= 0).
    - Nửa phải màn hình: Tua tới 10s (có giới hạn <= duration).
  - Tích hợp **UI Overlay Feedback**: Hiển thị "+10s" / "-10s" ở tương ứng 2 nửa màn hình trong vòng 800ms.
  - Cập nhật logic **Single Tap** với debounce (250ms) để hiện/ẩn menu controls.
  - Thêm nút **Zoom (Fit/Fill)** để chuyển đổi giữa `resizeMode` "contain" và "cover" giúp phóng to toàn màn hình mà không làm gián đoạn video.
  - Thực hiện cleanup an toàn các timer (`singleTapTimeout`, `feedbackTimeout`) khi unmount để tránh rò rỉ bộ nhớ hoặc crash trên iOS/Android.

**Lý do:** Tối ưu hóa trải nghiệm thao tác xem video trên mobile, đáp ứng nhu cầu vuốt/tua nhanh như YouTube.

---

## 2026-05-13 (Tiếp) — Fix Slider UX & Seek Spinner trong WatchScreen

**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx`:
  - Thêm state `isDraggingSlider` và `sliderValue` để chặn `onProgress` ghi đè giá trị slider trong lúc người dùng đang giữ và vuốt (chống lỗi giật lùi vị trí).
  - Sử dụng biến render động `displayTime` nhằm hiển thị vị trí chuẩn xác khi thao tác trên Slider, hoặc khi đang chờ video buffer đến `targetSeekTime`.
  - Cập nhật hàm xử lý chung `startSeekUI` cấp timer chờ timeout 5s để tự động ép tắt trạng thái seek nếu video bị kẹt hoặc mất mạng.
  - Loại bỏ `<ActivityIndicator>` toàn màn hình, thay thế bằng cụm component memoized `CenterPlayButton` tích hợp thẳng vào vị trí nút Play ở trung tâm.
  - Sử dụng biến tổng quát `isVideoBusy` (`isLoading || buffering || isSeeking`) để kích hoạt `react-native-reanimated` (`FadeIn`, `FadeOut`). 

**Lý do:** Giải quyết triệt để lỗi UX slider bị giật ngược khó chịu, bổ sung phản hồi thị giác tốt hơn (Loading Spinner) giúp người dùng biết video đang trong quá trình tua/buffer, và tạo chuyển cảnh (animation) thật mượt mà khi nút Play/Pause biến đổi.

- **Ngày:** 13/05/2026
- **Files sửa:** `app/navigation/types.ts`, `app/features/movie/screens/MovieDetailScreen.tsx`, `app/utils/episode.ts`, `app/features/player/components/EpisodeList.tsx`, `app/features/player/screens/WatchScreen.tsx`
- **Chi tiết:** 
  - Thêm `serverName` vào tham số điều hướng (`WatchRoute`) từ màn hình chi tiết phim.
  - Sửa lỗi giải mã sai `currentEpisode` khi nhiều Server cùng có chung một ID tập (ví dụ `full`).
  - Gắn chặt định dạng `type: 'm3u8'` cho component `react-native-video` để ép trình phát Native Player phát đúng định dạng HLS.
  - Chặn truyền iframe / nhúng WebView vào Native Player (`link_embed`), đảm bảo WatchScreen chỉ tải `link_m3u8`.
  - Bổ sung màn hình báo lỗi "Server hiện tại không phát được", kèm 2 nút Thử lại / Mở ngăn kéo đổi tập dự phòng (Fallback Server).

**Lý do:** Xử lý triệt để lỗi PhimAPI có link hỏng, tránh hiện tượng crash app, màn hình đen và tăng khả năng chịu lỗi nhờ hệ thống Server dự phòng.

- **Ngày:** 13/05/2026
- **Files sửa:** `app/utils/m3u8.ts` (mới), `app/features/player/screens/WatchScreen.tsx`
- **Chi tiết:**
  - Bổ sung tiện ích `m3u8.ts` để tự động fetch file `master.m3u8` và parse ra các dải độ phân giải (variants) kèm URI của chúng (360p, 480p, 720p, 1080p).
  - Tích hợp state `qualities` và `selectedQuality` vào `WatchScreen.tsx`.
  - Bổ sung nút Quality (vd: `1080p`) trên thanh công cụ, mở ra Modal dạng lưới để tuỳ chọn.
  - Xử lý logic hoán đổi trực tiếp `videoUri` sang link của variant tương ứng để khoá chất lượng thay vì dùng `selectedVideoTrack` (tránh ExoPlayer auto-adapt).
  - Kết hợp sử dụng biến `pendingSeekTime` trong sự kiện `onLoad` để tự động tua lại chính xác mốc thời gian đang xem dở mỗi khi Video bị đổi Source.

**Lý do:** Trình phát Native thường dễ bị mất kiểm soát khi tự Auto Adapt luồng HLS. Việc bóc tách m3u8 và chủ động điều phối Source URL giúp khoá cứng độ phân giải thành công và giữ được trải nghiệm mượt mà.

---

## 2026-05-13 (Tiếp) — Fix lỗi Splash Screen không full màn hình trên iOS

**Files đã sửa:**
- `ios/Flixtor/BootSplash.storyboard`
- **Chi tiết:**
  - Sửa đổi cấu trúc ràng buộc (constraints) của `imageView` để bung rộng ra toàn bộ màn hình (SuperView) thay vì co cụm ở giữa với kích thước cố định `100x105`.
  - Thay đổi thuộc tính `contentMode` từ `scaleAspectFit` sang `scaleAspectFill` để hình nền splash lấp đầy toàn bộ các cạnh (bao gồm khu vực Notch và Safe Area) mà không để lộ viền trắng (hoặc các thanh bar trên/dưới).

**Lý do:** Công cụ tự sinh `react-native-bootsplash` mặc định thiết lập logo căn giữa với kích thước nhỏ. Nếu ảnh đầu vào (logo) là một ảnh thiết kế toàn màn hình dạng dọc (19.5:9), ta bắt buộc phải can thiệp trực tiếp vào file storyboard XML để ép iOS vẽ ảnh này bung toàn bộ diện tích.

## 2026-05-13 (Tiếp) — Tối ưu Hiệu năng và Caching Hình ảnh

**Files đã sửa/tạo:**
- `app/components/common/CachedImage.tsx` (NEW)
- `app/utils/imageCache.ts` (NEW)
- `app/components/movie/MovieCard.tsx`
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/movie/screens/MovieDetailScreen.tsx`
- `app/features/favorites/screens/FavoritesScreen.tsx`
- `app/features/history/screens/HistoryScreen.tsx`
- `app/features/search/screens/SearchScreen.tsx`

**Chi tiết:**
- Xây dựng lớp bọc `CachedImage` trên nền `react-native-fast-image`, bổ sung hiệu ứng loading Skeleton FadeIn/FadeOut bằng Reanimated, và tự động gán ảnh Fallback khi lỗi URL.
- Xây dựng tiện ích `prefetchImages` để nạp ảnh ngầm vào Memory/Disk.

## 2026-05-20 — App system-status gate + Brand maintenance flow

**Files đã sửa/tạo:**
- `App.tsx`
- `app/services/api/systemService.ts` (NEW)
- `app/types/index.ts`
- `app/brand/BrandNavigator.tsx`
- `app/brand/BrandScreen.tsx` (NEW)

**Chi tiết:**
- Thêm bootstrap check `GET https://flix-api.longdc.click/system-status?platform=app` ngay khi app khởi động.
- Giữ `BootSplash`/`SplashScreen` cho tới khi hoàn tất bootstrap ban đầu để tránh nháy `RootNavigator` rồi mới chuyển sang maintenance screen.
- Nếu API trả `status: true` và `blocked: true` thì app render `BrandNavigator`; nếu lỗi mạng/timeout/sai format hoặc `status: false` thì fallback an toàn về `RootNavigator`.
- Bổ sung re-check khi app từ background quay lại foreground, đồng thời tắt `linking` lúc app đang blocked để không lọt deeplink vào luồng chính.
- Xây dựng `BrandScreen` hiển thị thông báo maintenance + nút mở `redirectUrl` nếu backend cung cấp liên kết.

**Lý do:** Cho phép backend bật/tắt quyền truy cập app theo thời gian thực mà không làm ảnh hưởng guest flow hoặc optional auth hiện tại.

## 2026-05-20 — Tách system-status thành custom hook

**Files đã sửa/tạo:**
- `App.tsx`
- `app/hooks/useSystemStatus.ts` (NEW)
- `app/types/index.ts`
- `app/brand/BrandNavigator.tsx`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Refactor toàn bộ logic gọi `system-status`, AppState foreground re-check, loading state và fallback RootNavigator ra hook `useSystemStatus`.
- `App.tsx` giờ chỉ bootstrap app data/auth, gọi `useSystemStatus()` và render `SplashScreen` / `BrandNavigator` / `RootNavigator` theo kết quả hook.
- Hook expose `refetchSystemStatus()` để `BrandNavigator` dùng lại cho nút kiểm tra thủ công mà không cần viết axios logic ở `App.tsx`.

**Lý do:** Làm `App.tsx` gọn hơn, tách biệt rõ UI orchestration với business logic kiểm tra trạng thái app và dễ tái sử dụng/test hơn.

## 2026-05-14 — Replace Filter Modal bằng @gorhom/bottom-sheet

**Files đã sửa:**
- `app/features/filter/components/FilterBottomSheet.tsx`

**Chi tiết:**
- Thay `Modal` thủ công bằng `BottomSheet` của `@gorhom/bottom-sheet`, kèm backdrop đóng sheet khi tap ra ngoài và hỗ trợ vuốt xuống để đóng.
- Đổi phần nội dung sang `BottomSheetScrollView` để danh sách filter cuộn đúng trong sheet.
- Đồng bộ lại `local` filter state mỗi lần sheet mở, tránh giữ giá trị cũ khi `currentFilter` từ screen đã thay đổi.

**Lý do:** User yêu cầu thay modal filter hiện tại bằng thư viện `@gorhom/bottom-sheet` để có UX bottom sheet native hơn và gesture tốt hơn.

## 2026-06-21 — React Navigation upgrade lên 8 alpha tương thích RN 0.81

**Files đã sửa:**
- `package.json`
- `package-lock.json`
- `app/navigation/MainNavigator.tsx`
- `app/brand/navigator/BrandBottomNavigator.tsx`
- `app/brand/BrandNavigator.tsx`
- `app/brand/screen/BrandHomeScreen.tsx`
- `app/components/movie/MovieCard.tsx`
- `app/features/auth/hooks/useAuthGoogle.ts`
- `app/features/auth/screens/LoginScreen.tsx`
- `app/features/auth/screens/RegisterScreen.tsx`
- `app/features/auth/screens/ForgotPasswordScreen.tsx`
- `app/features/auth/screens/ResetPasswordScreen.tsx`
- `app/features/favorites/screens/FavoritesScreen.tsx`
- `app/features/filter/screens/FilterScreen.tsx`
- `app/features/history/screens/HistoryScreen.tsx`
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/movie/screens/MovieDetailScreen.tsx`
- `app/features/player/screens/WatchScreen.tsx`
- `app/features/profile/screens/ProfileScreen.tsx`
- `app/features/search/screens/SearchScreen.tsx`
- `app/features/settings/screens/SettingScreen.tsx`

**Chi tiết:**
- Nâng `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `@react-navigation/stack` lên `8.0.0-alpha.14`.
- Pin `react-native-screens` về `4.20.0` để giữ tương thích với `react-native 0.81.5`.
- Thêm `overrides` cho `@react-navigation/core`, `@react-navigation/elements`, `@react-navigation/routers` để tránh npm tự kéo transitive alpha mới hơn vốn yêu cầu `react 19.2+`.
- Giữ `bottom-tabs` chạy với `implementation="custom"` để tránh breaking change của native tabs mặc định trong 8.x và preserve UI tab bar hiện tại.
- Đổi toàn bộ typed hooks `useNavigation<...>()` và `useRoute<...>()` sang kiểu assertion `useNavigation() as ...`, `useRoute() as ...` theo API TypeScript của React Navigation 8.
- Dọn thêm một số unused imports/props trong cụm `brand` để lint theo scope các file navigation vừa sửa chạy sạch.

**Lý do:** User yêu cầu bắt buộc nâng toàn bộ `@react-navigation/*` lên nhánh 8.x nhưng vẫn giữ repo tương thích với nền RN hiện tại.

## 2026-06-21 — Fix iOS build lỗi ReactNavigationCornerInsetView với RN 0.81

**Files đã sửa:**
- `node_modules/@react-navigation/native/ios/ReactNavigationCornerInsetView.mm`
- `patches/@react-navigation+native+8.0.0-alpha.14.patch`

**Chi tiết:**
- Vá native iOS source của `@react-navigation/native` để bỏ tham số `facebook::react::EventQueue::UpdateMode::unstable_Immediate` khi gọi `_state->updateState(...)`.
- Giữ lại chữ ký `updateState(...)` một tham số tương thích với React Native `0.81.5`, nơi `EventQueue::UpdateMode` chưa tồn tại.
- Tạo patch-package cho `@react-navigation/native@8.0.0-alpha.14` để fix này có thể được áp lại sau các lần cài dependency tiếp theo.

**Lý do:** iOS build fail tại `ReactNavigationCornerInsetView.mm` vì React Navigation 8 alpha dùng API Fabric mới hơn bản React Native hiện tại của repo.

## 2026-06-21 — Fix runtime redbox ActivityView của React Navigation 8 alpha trên RN 0.81

**Files đã sửa:**
- `node_modules/@react-navigation/native-stack/node_modules/@react-navigation/elements/lib/module/ActivityView.native.js`
- `node_modules/@react-navigation/native-stack/node_modules/@react-navigation/elements/src/ActivityView.native.tsx`
- `node_modules/@react-navigation/stack/node_modules/@react-navigation/elements/lib/module/ActivityView.native.js`
- `node_modules/@react-navigation/stack/node_modules/@react-navigation/elements/src/ActivityView.native.tsx`
- `node_modules/@react-navigation/bottom-tabs/node_modules/@react-navigation/elements/lib/module/ActivityView.native.js`
- `node_modules/@react-navigation/bottom-tabs/node_modules/@react-navigation/elements/src/ActivityView.native.tsx`
- `patches/@react-navigation+native-stack++@react-navigation+elements+3.0.0-alpha.15.patch`
- `patches/@react-navigation+stack++@react-navigation+elements+3.0.0-alpha.15.patch`
- `patches/@react-navigation+bottom-tabs++@react-navigation+elements+3.0.0-alpha.15.patch`

**Chi tiết:**
- Vá `ActivityView.native` của 3 bản `@react-navigation/elements` đang nằm lồng bên trong `native-stack`, `stack` và `bottom-tabs`.
- Đổi import `NativeComponentRegistry` từ export root của `react-native` sang internal path `react-native/Libraries/NativeComponent/NativeComponentRegistry`, tương thích với `react-native 0.81.5`.
- Tạo patch-package riêng cho từng nested dependency để clean install vẫn áp lại fix runtime này tự động qua `postinstall`.

**Lý do:** App redbox ngay khi mount `NativeStackView` với lỗi `Cannot read property 'get' of undefined` do `NativeComponentRegistry` không còn được export ở root package của React Native 0.81.

## 2026-06-21 — Fix render error ActivityView khi `react@19.1.0` chưa có `Activity`

**Files đã sửa:**
- `node_modules/@react-navigation/native-stack/node_modules/@react-navigation/elements/lib/module/ActivityView.native.js`
- `node_modules/@react-navigation/native-stack/node_modules/@react-navigation/elements/src/ActivityView.native.tsx`
- `node_modules/@react-navigation/stack/node_modules/@react-navigation/elements/lib/module/ActivityView.native.js`
- `node_modules/@react-navigation/stack/node_modules/@react-navigation/elements/src/ActivityView.native.tsx`
- `node_modules/@react-navigation/bottom-tabs/node_modules/@react-navigation/elements/lib/module/ActivityView.native.js`
- `node_modules/@react-navigation/bottom-tabs/node_modules/@react-navigation/elements/src/ActivityView.native.tsx`
- `patches/@react-navigation+native-stack++@react-navigation+elements+3.0.0-alpha.15.patch`
- `patches/@react-navigation+stack++@react-navigation+elements+3.0.0-alpha.15.patch`
- `patches/@react-navigation+bottom-tabs++@react-navigation+elements+3.0.0-alpha.15.patch`

**Chi tiết:**
- Giữ nguyên behavior cũ của `ActivityView` nếu runtime có sẵn `React.Activity`.
- Thêm fallback render thường bằng `Container` khi `Activity` là `undefined`, để React Navigation 8 alpha vẫn mount được trên stack dependency hiện tại của repo.
- Regenerate lại 3 patch-package nested để patch runtime hiện tại luôn bao gồm cả fix `NativeComponentRegistry` lẫn fix thiếu `Activity`.

**Lý do:** App chuyển sang lỗi `Element type is invalid` trong `ActivityView` vì `@react-navigation/elements@3.0.0-alpha.15` kỳ vọng `react` export `Activity`, nhưng repo đang dùng `react 19.1.0` chưa có API đó.

## 2026-06-21 — Hardening React Navigation 8 alpha runtime + dependency cleanup

**Files đã sửa:**
- `app/navigation/RootNavigator.tsx`
- `app/navigation/AuthNavigator.tsx`
- `app/navigation/MainNavigator.tsx`
- `app/brand/BrandNavigator.tsx`
- `app/brand/navigator/BrandBottomNavigator.tsx`
- `package.json`
- `package-lock.json`
- `node_modules/@react-navigation/native-stack/node_modules/@react-navigation/elements/lib/module/ActivityView.native.js`
- `node_modules/@react-navigation/native-stack/node_modules/@react-navigation/elements/src/ActivityView.native.tsx`
- `node_modules/@react-navigation/bottom-tabs/node_modules/@react-navigation/elements/lib/module/ActivityView.native.js`
- `node_modules/@react-navigation/bottom-tabs/node_modules/@react-navigation/elements/src/ActivityView.native.tsx`
- `patches/@react-navigation+native-stack++@react-navigation+elements+3.0.0-alpha.15.patch`
- `patches/@react-navigation+bottom-tabs++@react-navigation+elements+3.0.0-alpha.15.patch`

**Chi tiết:**
- Đặt `inactiveBehavior: 'none'` cho các navigator app đang dùng (`native-stack` và `bottom-tabs`) để tránh phụ thuộc vào flow `pause` mới của React Navigation 8 vốn dựa vào `React.Activity`.
- Vá `ActivityView.native` của `native-stack` và `bottom-tabs` bằng singleton global `__reactNavigationActivityContentView`, nhờ đó nhiều bản sao `@react-navigation/elements` sẽ tái sử dụng cùng một native view registry entry thay vì đăng ký trùng tên `ReactNavigationActivityContentView`.
- Chuyển `BrandNavigator` sang dùng `NativeStackNavigationProp` và loại bỏ dependency runtime không còn dùng `@react-navigation/stack`.
- Loại bỏ `react-dom` khỏi direct dependencies vì repo không dùng, và nâng `react-hook-form` từ `7.52.0` lên `7.55.0` để khớp peer requirement của `@hookform/resolvers@5.2.2`.
- Rà lại compatibility tree bằng `npm ls`; hiện đã bỏ được mismatch trực tiếp của `@react-navigation/stack`, `react-dom`, `react-hook-form`, nhưng vẫn còn các peer mismatch tồn tại sẵn như `@tanstack/react-query@4.33.0` và `react-native-fast-image@8.6.3` với `react@19.1.0`.

**Lý do:** Sau khi nâng React Navigation 8 alpha trên nền `react-native 0.81.5`, app tiếp tục gặp chuỗi lỗi runtime liên quan `ActivityView`. Đồng thời dependency audit cho thấy cần dọn thêm các mismatch trực tiếp để giảm rủi ro ở những lần cài mới.

## 2026-06-21 — Fix Metro resolve `react-dom` từ `@tanstack/react-query` trên React Native

**Files đã sửa:**
- `node_modules/@tanstack/react-query/build/lib/setBatchUpdatesFn.mjs`
- `node_modules/@tanstack/react-query/build/lib/setBatchUpdatesFn.esm.js`
- `node_modules/@tanstack/react-query/build/lib/setBatchUpdatesFn.js`
- `patches/@tanstack+react-query+4.33.0.patch`

**Chi tiết:**
- Vá build output của `@tanstack/react-query@4.33.0` để `setBatchUpdatesFn` luôn import `reactBatchedUpdates.native.*` thay vì `reactBatchedUpdates.*`.
- Nhờ đó Metro trên React Native không còn đi resolve `react-dom` từ entry ESM `.mjs` của package khi load React Query.
- Giữ fix ở mức tối thiểu, chỉ đổi đúng import target vì package đã có sẵn các file native variant tương ứng.

**Lý do:** Sau khi bỏ `react-dom` khỏi direct dependencies, Metro báo `Unable to resolve module react-dom` từ `@tanstack/react-query/build/lib/reactBatchedUpdates.mjs` do package build không tự chọn nhánh native trong entry hiện tại.

## 2026-06-21 — Thêm Liquid Glass cho tab bar của MainNavigator

**Files đã sửa:**
- `app/navigation/MainNavigator.tsx`

**Chi tiết:**
- Điều chỉnh `MainNavigator` để chỉ dùng `implementation="native"` khi iOS thực sự hỗ trợ Liquid Glass.
- Khi native Liquid Glass khả dụng, bỏ custom tab bar background để React Navigation dùng `UITabBarController` appearance của hệ thống.
- Đổi icon của nhánh native từ `tabBarSystemItem` sang `tabBarIcon` kiểu `sfSymbol` cho từng tab (`house.fill`, `magnifyingglass`, `sparkles`, `person.fill`) để liquid-glass tab bar dùng đúng bộ icon SF Symbols.
- Ép `tabBarStyle.backgroundColor` và `shadowColor` về `transparent`, đồng thời tắt `tabBarMinimizeBehavior` trong nhánh native để giảm hiện tượng tab bar chớp nền trắng rồi mới về trong suốt khi đổi tab.
- Các thiết bị còn lại tiếp tục dùng `implementation="custom"` cùng style tab bar hiện có để giữ tương thích và UI ổn định.

**Lý do:** User yêu cầu cập nhật `MainNavigator` để tận dụng Liquid Glass trong cụm bottom tabs mà vẫn giữ fallback an toàn theo platform/runtime support.

## 2026-05-14 — Fix Filter Bottom Sheet bị co chiều cao

**Files đã sửa:**
- `app/features/filter/components/FilterBottomSheet.tsx`

**Chi tiết:**
- Tắt `enableDynamicSizing` để bottom sheet luôn mở đúng theo `snapPoints` thay vì tự co về chiều cao nhỏ lúc render đầu.

## 2026-05-14 — Fix ảnh poster/banner mất khi quay lại MovieDetail từ Watch

**Files đã sửa:**
- `app/components/common/CachedImage.tsx`
- `app/features/movie/screens/MovieDetailScreen.tsx`

**Chi tiết:**
- Sửa `CachedImage` để chỉ reset trạng thái loading/error theo `sourceKey` ổn định dựa trên URL thật, thay vì theo object reference `{ uri }` mới ở mỗi lần render.
- Gắn `key` theo `sourceKey` cho `FastImage` để việc đổi source thật sự được remount đúng lúc, nhưng không bị reset giả khi quay lại màn hình với cùng một URL đã cache.
- Memoize `backdropSource` và `posterSource` trong `MovieDetailScreen` để tránh tạo source object mới không cần thiết khi screen rerender sau khi back từ màn xem phim.

**Lý do:** Khi quay lại từ WatchScreen, `MovieDetailScreen` rerender và tạo mới object source cho ảnh. `CachedImage` trước đó coi đây là source mới, bật lại skeleton/loading nhưng `FastImage` không luôn phát lại event load cho cùng URL đã cache, làm banner/poster trông như không tải được.

## 2026-05-14 — Thêm section Phim Việt Nam ở HomeScreen

**Files đã sửa:**
- `app/features/home/hooks/useMovieLists.ts`
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/filter/screens/FilterScreen.tsx`

**Chi tiết:**
- Thêm hook `useCountryMovieList()` để lấy danh sách một trang theo `country` cho các section ngang ở Home.
- Bổ sung section `Phim Việt Nam` trong `HomeScreen`, dùng slug quốc gia `viet-nam` và hỗ trợ nút `Xem tất cả` điều hướng sang tab `Filter`.
- Nới `createFilterState()` trong `FilterScreen` để route chỉ có `country/category/year` không còn bị mặc định ép về `typeList=phim-bo`, giúp các entry point lọc theo quốc gia hoạt động đúng.

**Lý do:** User yêu cầu có thêm section `Phim Việt Nam` trên HomeScreen và cần giữ đúng bộ lọc khi đi từ section này sang màn Filter.

## 2026-05-18 — Link diễn viên từ MovieDetail sang Search

**Files đã sửa:**
- `app/navigation/types.ts`
- `app/features/movie/screens/MovieDetailScreen.tsx`
- `app/features/search/screens/SearchScreen.tsx`

**Chi tiết:**
- Khai báo `RootTabs` bằng nested navigator params để điều hướng type-safe vào từng tab con mà không cần ép kiểu.
- Đổi danh sách diễn viên trên `MovieDetailScreen` thành các chip có thể bấm, mỗi chip mở tab `Search` với `keyword` là tên diễn viên.
- Đồng bộ lại state `keyword` trong `SearchScreen` mỗi khi route params đổi, để tab Search đang mounted vẫn cập nhật đúng truy vấn mới.

**Lý do:** User yêu cầu bấm vào tên diễn viên trong màn chi tiết phim để chuyển sang màn hình tìm kiếm theo tên diễn viên đó.

## 2026-05-18 — Thêm SettingScreen và chuyển API server trong app

**Files đã sửa/tạo:**
- `app/services/api/axiosClient.ts`
- `app/features/settings/screens/SettingScreen.tsx` (mới)
- `app/features/profile/screens/ProfileScreen.tsx`
- `app/navigation/types.ts`
- `app/navigation/RootNavigator.tsx`
- `App.tsx`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Bổ sung route `Setting` trong root stack và nối mục `Cài đặt ứng dụng` ở `ProfileScreen` sang `SettingScreen`.
- Tạo `SettingScreen` cho phép chuyển qua lại giữa `https://flix-api.longdc.click` và `https://phimapi.com`, hiển thị server hiện tại và lưu lựa chọn vào `@flixtor/app_settings`.
- Đổi `axiosClient` sang runtime-configurable base URL, mặc định dùng `https://flix-api.longdc.click`, đồng thời nạp cấu hình server ngay trong `AppInitializer` trước khi render navigator.
- Reset React Query cache sau khi đổi server để dữ liệu active queries được tải lại theo nguồn API mới.

**Lý do:** User yêu cầu có màn cài đặt ứng dụng riêng để đổi qua lại giữa 2 API server, với mặc định là `https://flix-api.longdc.click`.

## 2026-05-14 — Thêm HomeScreen skeleton và siết render hiệu năng

**Files đã sửa/tạo:**
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/home/components/HomeScreenSkeleton.tsx` (mới)

**Chi tiết:**
- Thêm `HomeScreenSkeleton` dùng `react-native-skeleton-placeholder`, mô phỏng đầy đủ hero banner và các hàng section ngang trong lần load đầu của Home.
- Chỉ hiện skeleton ở initial loading; khi pull-to-refresh vẫn giữ danh sách thật và dùng `RefreshControl`, tránh nhấp nháy toàn màn hình.
- Memoize `HeroBannerItem`, `posterSource`, `backdropSource`, callback điều hướng header và giảm batch render của `Animated.FlatList` (`initialNumToRender`, `maxToRenderPerBatch`, `updateCellsBatchingPeriod`, `windowSize`) để hạ áp lực CPU/RAM lúc mở Home.
- Chuẩn hoá lại title section quốc gia thành `Phim Việt Nam`.

**Lý do:** User yêu cầu bổ sung loading skeleton cho HomeScreen và tối ưu hiệu năng khi màn hình khởi tạo với nhiều query/ảnh cùng lúc.

## 2026-05-14 — Thêm block trailer YouTube trong MovieDetailScreen

**Files đã sửa:**
- `app/features/movie/screens/MovieDetailScreen.tsx`

**Chi tiết:**
- Parse `movie.trailer_url` để lấy `videoId` YouTube từ các dạng URL phổ biến như `watch`, `youtu.be`, `embed`, `shorts`.
- Thêm section `Trailer` ngay dưới phần mô tả phim, chỉ mount `react-native-youtube-iframe` khi user bấm xem để tránh tốn tài nguyên ngay lúc mở detail screen.
- Bổ sung fallback mở link trailer ngoài ứng dụng nếu URL tồn tại nhưng không parse được sang `videoId`.
- Reset trạng thái trailer khi đổi phim hoặc đổi `trailer_url` để tránh mang state player từ detail cũ sang detail mới.

**Lý do:** User yêu cầu trong `MovieDetailScreen` hiển thị và xem được trailer của phim nếu API trả về `trailer_url` dạng YouTube.

## 2026-05-14 — Hiển thị trailer inline trước mô tả trong MovieDetailScreen

**Files đã sửa:**
- `app/features/movie/screens/MovieDetailScreen.tsx`

**Chi tiết:**
- Đổi UX trailer từ dạng “bấm mới hiện player” sang render inline trực tiếp khi có `trailer_url` YouTube hợp lệ.
- Chuyển block `Trailer` lên trước phần `Nội dung phim` để media preview xuất hiện sớm hơn trong flow detail.
- Giữ fallback card mở link ngoài cho các `trailer_url` không parse được thành YouTube `videoId`.

**Lý do:** User muốn trailer hiển thị sẵn, không cần thao tác thêm, và nằm phía trên phần mô tả phim.

## 2026-05-14 — Thêm lớp cache ảnh server-side `.webp` từ KKPhim

**Files đã sửa:**
- `app/utils/image.ts`
- `app/utils/imageCache.ts`
- `app/components/common/CachedImage.tsx`

**Chi tiết:**
- Chuyển helper URL ảnh sang endpoint `https://phimapi.com/image.php?url=...` để lấy ảnh `.webp` do KKPhim tối ưu từ server.
- Giữ nguyên luồng cache client hiện tại của `FastImage` và `prefetchImages`, nhưng prefetch bằng URL proxy mới để cache trên thiết bị bám theo ảnh `.webp`.
- Bổ sung fallback trong `CachedImage`: nếu ảnh proxy `.webp` lỗi, component sẽ tự rơi về URL gốc `phimimg.com`, rồi mới fallback tiếp sang placeholder nếu cần.

**Lý do:** User yêu cầu giữ cache ảnh cũ trên client nhưng thêm một luồng cache/optimize mới từ server KKPhim để ảnh trả về ở định dạng `.webp`, tăng tốc tải ảnh toàn app.

## 2026-05-14 — Bật immersive mode Android cho WatchScreen

**Files đã sửa/tạo:**
- `app/features/player/screens/WatchScreen.tsx`
- `app/utils/systemUi.ts` (mới)
- `android/app/src/main/java/com/myspa/flixtor/SystemUiModule.kt` (mới)
- `android/app/src/main/java/com/myspa/flixtor/SystemUiPackage.kt` (mới)
- `android/app/src/main/java/com/myspa/flixtor/MainApplication.kt`

**Chi tiết:**
- Thêm native Android module `SystemUiModule` để ẩn system bars theo immersive sticky/transient mode, cho phép navigation bar chỉ hiện tạm khi vuốt mép.
- `WatchScreen` gọi `enterImmersiveVideoMode()` khi focus landscape và `exitImmersiveVideoMode()` khi back/unmount về portrait.
- Tăng `paddingBottom` của thanh điều khiển dưới trên Android để slider không nằm quá sát mép nơi gesture system dễ tranh chấp.
- Bổ sung `setGestureExclusionRect()` cho Android và gắn exclusion rect đúng vùng slider, đồng thời tắt tap layer toàn màn hình trong lúc kéo slider để tránh tranh chấp gesture nội bộ/app với system gesture.
- Tinh chỉnh lại để giữ nguyên layout seek bar cũ: bỏ wrapper riêng quanh `Slider` và chuyển exclusion rect sang toàn bộ `bottomBar` sau khi user báo thanh seek bị biến mất.
- Tách lại vùng gesture của video và controls: khi controls đang hiện, tap layer chỉ phủ vùng video trung tâm thay vì đè xuống `bottomBar`; đồng thời dừng auto-hide trong lúc kéo slider và không gọi `revealControls()` liên tục ở `onValueChange`.
- Đã xác nhận build Android bằng `./gradlew :app:compileDebugKotlin`.

**Lý do:** User gặp lỗi tua video trên Android do vùng slider/bottom controls bị cử chỉ điều hướng hệ thống chen vào khi xem full-screen landscape.
- Đổi wrapper nội dung sang `BottomSheetView` và giữ `BottomSheetScrollView` chỉ cho phần cuộn dọc.
- Đổi các nhóm chip ngang về `ScrollView` thường để tránh nested scroll làm sai phép đo layout.

**Lý do:** Filter sheet chỉ hiện phần header, user phải kéo thêm mới thấy nội dung filter.

## 2026-05-14 — Fix Filter Bottom Sheet bị lơ lửng trên TabBar

**Files đã sửa:**
- `app/features/filter/components/FilterBottomSheet.tsx`

**Chi tiết:**
- Đổi từ `BottomSheet` sang `BottomSheetModal` để sheet render qua modal portal, không còn bị giới hạn trong layout của `FilterScreen`.
- Chuyển lifecycle mở/đóng sang `present()` / `dismiss()` và dùng `onDismiss` để đồng bộ lại state `visible`.
- Bỏ `bottomInset` khỏi container của sheet, thay bằng `paddingBottom` an toàn cho nội dung bên trong để mặt sheet bám sát mép dưới màn hình.

**Lý do:** Bottom sheet không phủ qua tab bar và nhìn như bị lơ lửng cách đáy màn hình một khoảng.

## 2026-05-14 — Fix padding đáy và animation mở của Filter Bottom Sheet

**Files đã sửa:**
- `app/features/filter/components/FilterBottomSheet.tsx`

**Chi tiết:**
- Bỏ `paddingBottom` trên toàn bộ `content` vì nó đẩy cả cụm action lên cao và tạo khoảng trống lớn ở đáy sheet.
- Chuyển safe-area bottom padding xuống riêng hàng action để nút vẫn an toàn với home indicator nhưng sheet không bị hở nội dung.
- Bỏ `requestAnimationFrame` và `animateOnMount={false}` để `BottomSheetModal` dùng lại animation mở mặc định, tránh cảm giác bật lên giật cục.

**Lý do:** User phản ánh khoảng đệm dưới cùng quá lớn và animation mở bottom sheet bị mất, gây cảm giác giật.

## 2026-05-14 — Tối ưu FilterScreen khi tải nhiều phim và thay loading bằng skeleton

**Files đã sửa/tạo:**
- `app/features/filter/screens/FilterScreen.tsx`
- `app/components/movie/MovieGrid.tsx`
- `app/components/movie/MovieGridSkeleton.tsx` (NEW)

**Chi tiết:**
- `FilterScreen.tsx`: memoize `queryParams`, `movies`, `activeFilters`, `ListHeader` và callback fetch thêm trang để giảm recompute không cần thiết khi dữ liệu nhiều page.
- `FilterScreen.tsx`: thay spinner loading đầu trang bằng skeleton grid từ `react-native-skeleton-placeholder`.
- `MovieGrid.tsx`: tăng cường cấu hình `FlatList` cho dataset lớn (`initialNumToRender`, `maxToRenderPerBatch`, `updateCellsBatchingPeriod`, `windowSize`, `removeClippedSubviews`, `keyboardShouldPersistTaps`).
- `MovieGrid.tsx`: đổi footer loading thêm trang từ `ActivityIndicator` sang skeleton row và giữ header/empty state trong cùng `FlatList`.
- `MovieGridSkeleton.tsx`: thêm skeleton grid tái sử dụng theo layout 3 cột của màn Filter.

**Lý do:** User yêu cầu tối ưu hiệu năng màn Filter khi tải nhiều phim và đổi hiệu ứng loading sang `react-native-skeleton-placeholder`.

## 2026-05-14 — Fix FilterScreen không gửi key rỗng lên API

**Files đã sửa:**
- `app/features/filter/screens/FilterScreen.tsx`

**Chi tiết:**
- Tạo `queryParams` theo kiểu conditionally append: chỉ thêm `typeList`, `category`, `country`, `year`, `lang`, `sortField`, `sortType` khi giá trị thực sự tồn tại.
- Giữ nguyên `filter` state dùng chuỗi rỗng để UI của chip "Tất cả" vẫn hoạt động bình thường, nhưng request params gửi xuống hook/API sẽ không còn key rỗng như `typeList: ''`.
- Chỉ gửi `sortType` khi `sortField` có giá trị để tránh đẩy cặp sort không hợp lệ lên backend.

**Lý do:** User báo chọn "Tất cả" làm API nhận params rỗng và gây lỗi.

## 2026-05-14 — Fix HomeScreen "Xem tất cả" không reset đúng filter state

**Files đã sửa:**
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/filter/screens/FilterScreen.tsx`
- `app/navigation/types.ts`

**Chi tiết:**
- `HomeScreen.tsx`: thêm `requestId` vào params khi điều hướng từ từng section sang tab `Filter`.
- `navigation/types.ts`: mở rộng `MainTabParamList['Filter']` với `requestId?: number`.
- `FilterScreen.tsx`: đồng bộ lại `filter` state từ `route.params` mỗi khi params điều hướng thay đổi, thay vì chỉ đọc params một lần lúc mount.
- Cách tiếp cận bằng `requestId` đảm bảo cả trường hợp user bấm cùng một section nhiều lần liên tiếp vẫn reset đúng state cũ đang bị giữ trong tab screen.

**Lý do:** User báo từ HomeScreen ấn "Xem tất cả" vào các section như "Phim lẻ" nhưng FilterScreen vẫn giữ state filter trước đó.

## 2026-05-14 — Fix SearchScreen giữ kết quả cũ khi xoá keyword + đổi sang grid skeleton

**Files đã sửa:**
- `app/features/search/screens/SearchScreen.tsx`
- `app/features/search/hooks/useSearchMovies.ts`

**Chi tiết:**
- `useSearchMovies.ts`: bỏ `keepPreviousData` để query search không giữ dữ liệu cũ khi keyword thay đổi hoặc bị clear.
- `SearchScreen.tsx`: kết quả chỉ còn được render khi `keyword.trim().length >= 2`, nên xóa hết từ khóa sẽ ẩn ngay danh sách cũ thay vì tiếp tục hiển thị.
- `SearchScreen.tsx`: thay layout kết quả từ danh sách ngang chi tiết sang `MovieGrid` 3 cột để đồng nhất với các màn browse khác.
- `SearchScreen.tsx`: thay loading spinner bằng `MovieGridSkeleton` dùng `react-native-skeleton-placeholder`.

**Lý do:** User báo xoá từ khóa xong nhưng kết quả search trước vẫn còn hiện, gây hiểu lầm UX, đồng thời muốn kết quả dạng grid với skeleton loading.

## 2026-05-14 — Auto focus input khi vào SearchScreen

**Files đã sửa:**
- `app/features/search/screens/SearchScreen.tsx`

**Chi tiết:**
- Thêm `TextInput` ref + `useFocusEffect` để mỗi lần tab `Search` được focus, ô tìm kiếm tự động nhận focus và bật keyboard.
- Giữ thêm `autoFocus` trên `TextInput` để lần mount đầu tiên cũng mở bàn phím ngay.

**Lý do:** User yêu cầu khi vào `SearchScreen` thì ô input search phải tự focus và mở bàn phím.

## 2026-05-14 — Redesign HomeScreen hero banner theo style Netflix

**Files đã sửa:**
- `app/features/home/screens/HomeScreen.tsx`

**Chi tiết:**
- Đổi hero từ layout banner ngang đơn giản sang composition kiểu Netflix: full-bleed background tối, poster đứng ở giữa, title lớn nằm trên poster, dòng genre/meta nằm dưới và hàng action `My List / Play / Info`.
- Nối nút `My List` với `favoriteStore` để lưu/bỏ lưu phim trực tiếp ngay trên hero.
- Giữ `Play` và `Info` cùng điều hướng vào `MovieDetail`, đồng thời thêm overlay/gradient và shadow để hero có chiều sâu hơn.

**Lý do:** User yêu cầu thiết kế lại hero banner ở HomeScreen giống UI Netflix hơn.

## 2026-05-14 — Thêm nút back cho SearchScreen

**Files đã sửa:**
- `app/features/search/screens/SearchScreen.tsx`

**Chi tiết:**
- Thêm nút back ở bên trái thanh search.
- Khi bấm back: dismiss keyboard + blur input trước, sau đó ưu tiên `navigation.goBack()` nếu có history.
- Nếu Search đang là tab root và không có history để quay lại, fallback điều hướng về tab `Home`.

**Lý do:** User yêu cầu bổ sung nút back trong `SearchScreen`.

## 2026-05-14 — Tối ưu hiệu năng render và prefetch để giảm áp lực CPU/RAM

**Files đã sửa:**
- `app/utils/imageCache.ts`
- `app/components/common/CachedImage.tsx`
- `app/components/movie/MovieCard.tsx`
- `app/components/movie/MovieGrid.tsx`
- `app/features/search/screens/SearchScreen.tsx`
- `app/features/home/screens/HomeScreen.tsx`

**Chi tiết:**
- `imageCache.ts`: thêm cơ chế dedupe URL đã prefetch và giới hạn số ảnh preload mỗi đợt để tránh nạp lặp quá nhiều ảnh vào memory/disk cache.
- `CachedImage.tsx`: chuẩn hóa `FastImage` source với `cacheControl.immutable` và reset trạng thái loading/error đúng lúc source đổi.
- `MovieCard.tsx`: tắt skeleton từng card trong grid/list dày và thêm custom `memo` comparator để giảm rerender khi cuộn.
- `MovieGrid.tsx`: thêm `onScrollBeginDrag` hook point để tránh xử lý keyboard trên mọi frame scroll.
- `SearchScreen.tsx`: chuyển dismiss keyboard sang `onScrollBeginDrag` thay vì callback `onScroll` liên tục.
- `HomeScreen.tsx`: memoize `latestMovies`, `sections`, `ListHeader`, prefetch URL list; giảm prefetch top row từ 5 xuống 3 item/section; thêm `getItemLayout` cho hàng ngang section để cuộn ổn định hơn.

**Lý do:** User yêu cầu xem lại app và tối ưu hiệu năng/caching để giảm ảnh hưởng CPU/RAM trên thiết bị.

## 2026-05-14 — Vòng 2 tối ưu sâu hơn cho cache/query/search pagination

**Files đã sửa:**
- `App.tsx`
- `app/utils/imageCache.ts`
- `app/services/api/phimApi.ts`
- `app/features/search/hooks/useSearchMovies.ts`
- `app/features/search/screens/SearchScreen.tsx`
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/movie/screens/MovieDetailScreen.tsx`

**Chi tiết:**
- `App.tsx`: siết lại default budget của React Query với `staleTime` ngắn hơn, `cacheTime` rõ ràng hơn và tắt retry cho request bị cancel để giảm cache giữ lâu không cần thiết và tránh retry thừa.
- `imageCache.ts`: bổ sung `IMAGE_PREFETCH_LIMITS` để các màn dùng chung policy preload ảnh thay vì hardcode phân tán.
- `phimApi.ts`: tách `searchMoviesPage()` trả về raw response có pagination, giữ `searchMovies()` làm wrapper trả về item list.
- `useSearchMovies.ts`: đổi sang `useInfiniteQuery`, flatten dữ liệu ngay trong `select`, giảm `cacheTime` riêng của search để keyword cũ không chiếm RAM quá lâu.
- `SearchScreen.tsx`: hỗ trợ infinite pagination + footer skeleton khi cuộn, không còn phụ thuộc vào một page cố định.
- `HomeScreen.tsx` và `MovieDetailScreen.tsx`: dùng policy prefetch chung (`IMAGE_PREFETCH_LIMITS`) thay cho limit hardcode cục bộ.

**Lý do:** User yêu cầu làm tiếp vòng 2 theo hướng sâu hơn để tối ưu hiệu năng/caching cho CPU và RAM của thiết bị.
- Tích hợp Prefetch vào màn `HomeScreen` (5 ảnh top ở mỗi mục) và `MovieDetailScreen` (ảnh Backdrop) ngay sau khi gọi API xong.
- Thêm các thuộc tính chống tràn RAM cho danh sách dài `FlatList` (`initialNumToRender`, `windowSize`, `maxToRenderPerBatch`, `removeClippedSubviews`).

**Lý do:** Tăng cường trải nghiệm vuốt chạm mượt mà, loại bỏ hiện tượng nhấp nháy, màn hình đen chờ tải ảnh khi sử dụng danh sách dài, và bảo vệ CPU/RAM của thiết bị.

## 2026-05-14 — Replace Android Watch Seek Slider With Custom Gesture Seek Bar

**Files đã sửa/tạo:**
- `app/features/player/screens/WatchScreen.tsx`
- `app/features/player/components/VideoSeekBar.android.tsx` (NEW)
- `app/features/player/components/VideoSeekBar.ios.tsx` (NEW)
- `app/features/player/components/VideoSeekBar.types.ts` (NEW)

**Chi tiết:**
- Tách seek bar của player thành component riêng theo platform để `WatchScreen` chỉ dùng một API chung.
- Giữ nguyên slider iOS bằng `@react-native-community/slider` để không làm thay đổi UX seek hiện tại trên iPhone/iPad.
- Thay slider Android bằng seek bar custom dùng `react-native-gesture-handler` + `react-native-reanimated`, có track tiến độ xem, buffer progress, thumb kéo và vùng chạm lớn hơn để drag ổn định hơn.
- Cập nhật `WatchScreen` để truyền `bufferedTime`, khóa auto-hide controls trong lúc kéo và chỉ gọi `videoRef.seek()` khi người dùng thả seek bar.

**Lý do:** Native slider Android vẫn không drag ổn định trên thiết bị thật dù đã xử lý immersive mode và overlay touch, nên cần tách riêng Android sang solution gesture-based triệt để hơn.

## 2026-05-18 — Tối ưu lại UI/UX của HomeScreen

**Files đã sửa:**
- `app/features/home/screens/HomeScreen.tsx`
- `app/components/movie/HeroBanner.tsx`
- `app/features/home/components/HomeScreenSkeleton.tsx`

**Chi tiết:**
- Tách hero thành component `HeroBanner` thật thay cho phiên bản inline/stub, giúp `HomeScreen` gọn hơn và dễ bảo trì.
- Hero mới dùng `react-native-snap-carousel` để hiển thị nhiều phim nổi bật, có background cinematic, poster trung tâm, top actions, badge metadata, CTA rõ ràng và nút lưu `My List`.
- Thêm khối `Lối tắt khám phá` ngay dưới hero để người dùng đi nhanh sang Search hoặc các filter phổ biến như Phim bộ, Phim lẻ và Việt Nam.
- Điều chỉnh lại nhịp layout section: header lớn hơn, có subtitle, badge số lượng và nút `Khám phá` để ưu tiên hierarchy rõ ràng hơn.
- Section `Mới cập nhật` tự loại các phim đã nằm trong hero; logic prefetch cũng đổi sang preload toàn bộ nhóm hero và 2 poster đầu của mỗi section.
- Đồng bộ lại `HomeScreenSkeleton` để gần với bố cục hero/shortcut mới hơn, giảm cảm giác nhảy layout lúc dữ liệu vừa tải xong.
- Follow-up bugfix trong cùng ngày: chỉnh lại hero theo `screen height` + `screen width`, thêm `carouselWrapper` có chiều cao riêng và giảm kích thước poster/title để tránh vỡ layout hoặc chồng chữ trên các màn hình dài như iPhone Pro Max.

**Lý do:** User yêu cầu tối ưu lại UI/UX style của `HomeScreen.tsx`, đồng thời cần giảm độ rối của file để việc tiếp tục nâng cấp Home sau này dễ hơn.

## 2026-05-18 — Cập nhật WatchScreen hỗ trợ portrait + landscape

**Files đã sửa:**
- `app/features/player/screens/WatchScreen.tsx`
- `app/features/player/components/VideoSeekBar.tsx`
- `app/navigation/RootNavigator.tsx`

**Chi tiết:**
- `WatchScreen` giờ quản lý orientation theo state riêng (`currentOrientation`, `manualOrientationLock`, `isAutoRotateEnabled`) và listener cho cả UI orientation lẫn device orientation để layout đổi theo cảm biến mà không remount `Video`.
- Flow hiện tại mở màn xem mặc định ở landscape bằng lock tạm lúc focus; sau khi lock ban đầu được thỏa mãn thì player có thể quay lại chế độ xoay tự nhiên hoặc cho phép user bấm nút xoay thủ công để về portrait.
- Khi landscape: bật immersive mode, ẩn status bar và dùng player full-screen; khi portrait: chuyển sang chế độ player-only, video `contain` nằm giữa màn hình đen và chỉ giữ lại controls overlay.
- Thêm nút xoay thủ công trong player và panel portrait; nếu user xoay thiết bị đúng với chiều đã chọn thủ công thì screen sẽ tự nhả lock để quay lại auto-rotate tự nhiên.
- Cleanup orientation/back được gom lại để khi rời `WatchScreen` sẽ khóa portrait về cho app, gỡ listener/timer và không làm reset currentTime/play-pause/seek state trong lúc xoay.
- Bổ sung shim `VideoSeekBar.tsx` để TypeScript resolve đúng seek bar theo platform mà không làm thay đổi cách Metro chọn file `.ios/.android` khi chạy thật.
- Follow-up bugfix cùng ngày: ban đầu bọc landscape player trong `videoFrame` có safe-area hai cạnh để ổn định controls, sau đó tiếp tục chuyển safe-area sang riêng top/bottom controls để chế độ `Fill` có thể cover trọn hai mép màn hình mà không còn hai dải đen hai bên.
- Follow-up bugfix tiếp theo: nút xoay thủ công từ portrait về landscape giờ chọn `lockToLandscapeLeft/Right()` theo chiều landscape gần nhất hoặc chiều cầm máy hiện tại, thay vì chỉ gọi `lockToLandscape()` chung chung; đồng thời cập nhật `currentOrientation` sớm hơn để tránh bị kẹt ở layout dọc.
- Follow-up bugfix mới nhất: portrait mode của `WatchScreen` chuyển sang layout player-only, bỏ hoàn toàn `portraitInfoPanel`; video `contain` nằm giữa màn hình đen toàn phần và các thao tác như rotate/quality tiếp tục sống trong control overlay phía trên player.
- Follow-up tối ưu hiệu năng: memo hóa `PlayerMediaSurface`, `EpisodeDrawer`, `QualityDrawer`; giảm tần suất sync `currentTime`/`bufferedTime` khi controls ẩn; đổi `progressUpdateInterval` theo trạng thái UI; và bỏ lớp nền tối phủ toàn màn controls để giảm CPU/GPU/RAM trên `WatchScreen`.

**Lý do:** User yêu cầu WatchScreen hỗ trợ cả portrait lẫn landscape, không còn khóa cứng landscape khi vào, nhưng vẫn phải an toàn khi back và không làm hỏng các tính năng player hiện có.

## 2026-05-19 — Kết nối flow đăng nhập thật với Flix API

**Files đã sửa/tạo:**
- `App.tsx`
- `app/types/index.ts`
- `app/utils/storage.ts`
- `app/services/api/axiosClient.ts`
- `app/navigation/types.ts`
- `app/navigation/AuthNavigator.tsx`
- `app/navigation/RootNavigator.tsx`
- `app/features/auth/services/authService.ts`
- `app/features/auth/store/authStore.ts`
- `app/features/auth/hooks/useLogin.ts`
- `app/features/auth/screens/LoginScreen.tsx`
- `app/features/profile/screens/ProfileScreen.tsx`
- `app/features/player/components/EpisodeList.tsx`
- `app/assets/svg-component/MoreHorizontal.tsx`

**Chi tiết:**
- Khôi phục auth gate ở `RootNavigator`: chưa đăng nhập sẽ vào `AuthNavigator`, đang check session sẽ hiện `SplashScreen`, đăng nhập hợp lệ mới vào main app.
- Tạo `AuthService` thật cho `POST /api/auth/login` và `GET /api/auth/me`, parse response theo kiểu defensive để không crash khi backend trả thiếu `token` hoặc `user`.
- Viết lại `authStore` với các state/action thật: `token`, `user`, `isAuthenticated`, `isLoading`, `isCheckingAuth`, `login`, `logout`, `getProfile`, `restoreSession`.
- JWT được lưu ưu tiên trong `react-native-keychain`; có fallback/migration từ `@flixtor/access_token` cũ trong AsyncStorage để không làm mất session trên máy đã dùng app trước đó.
- `axiosClient` giờ tự gắn Bearer token, có `skipAuth` cho request login và clear session an toàn khi gặp `401` mà không log dữ liệu nhạy cảm.
- `LoginScreen` được thay từ stub sang UI dark theme thật: validate email/mật khẩu rỗng, loading/disable button, show/hide password, lỗi rõ ràng, `KeyboardAvoidingView`.
- `ProfileScreen` được thay từ guest mode sang profile thật: hiển thị avatar/displayName/email/role/emailVerified/createdAt, có nút refresh hồ sơ và logout.
- Sửa kèm 2 lỗi lint cục bộ ngoài auth (`EpisodeList` dependency và `MoreHorizontal` unused import) để phạm vi file sửa lint sạch.

**Lý do:** User yêu cầu bổ sung flow đăng nhập thật bằng API, lưu JWT bền vững, restore session khi mở lại app và tự logout khi token hết hạn.

## 2026-05-19 — Chuyển auth sang chế độ tùy chọn

**Files đã sửa:**
- `app/navigation/types.ts`
- `app/navigation/RootNavigator.tsx`
- `app/features/auth/hooks/useLogin.ts`
- `app/features/auth/screens/LoginScreen.tsx`
- `app/features/profile/screens/ProfileScreen.tsx`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Bỏ auth gate bắt buộc ở `RootNavigator`; app giờ luôn vào `RootTabs` để user xem phim bình thường kể cả khi chưa đăng nhập.
- Thêm route `Login` vào root stack để tab `Profile` có thể mở màn đăng nhập như một flow tùy chọn.
- `LoginScreen` sau khi đăng nhập thành công sẽ quay lại màn trước nếu được mở từ `Profile`.
- `ProfileScreen` chia 2 mode rõ ràng: guest mode có CTA đăng nhập và settings; authenticated mode vẫn giữ profile thật, refresh hồ sơ và logout.

**Lý do:** User yêu cầu app không bắt buộc đăng nhập trước khi vào xem phim.

## 2026-05-19 — Ẩn vai trò user trên ProfileScreen

**Files đã sửa:**
- `app/features/profile/screens/ProfileScreen.tsx`

**Chi tiết:**
- Bỏ dòng hiển thị `Vai trò` trong phần thông tin tài khoản của user đã đăng nhập.

**Lý do:** User yêu cầu ẩn phần vai trò của user trên màn hình profile.

## 2026-05-19 — Đồng bộ lịch sử xem lên server khi user đã đăng nhập

**Files đã sửa/tạo:**
- `app/types/index.ts`
- `app/navigation/types.ts`
- `app/navigation/RootNavigator.tsx`
- `app/utils/episode.ts`
- `app/features/history/services/userHistoryService.ts`
- `app/features/history/hooks/useUserHistory.ts`
- `app/features/history/store/watchHistoryStore.ts`
- `app/features/history/screens/HistoryScreen.tsx`
- `app/features/profile/screens/ProfileScreen.tsx`
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/player/screens/WatchScreen.tsx`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Tách type history local (`LocalWatchHistoryItem`) khỏi type history server (`WatchHistoryItem`, `WatchHistoryPayload`, `WatchHistoryResponse`) để không lẫn giữa continue-watching cục bộ và dữ liệu API.
- Tạo `UserHistoryService` + `useUserHistory` để gọi `POST/GET /api/user/history` chỉ khi user đã đăng nhập.
- `WatchScreen` vẫn giữ local continue-watching, nhưng bổ sung remote save theo queue/throttle/ref: không bắn mỗi `onProgress`, chỉ save ở interval, pause, seek ổn định, back, background và end.
- Nếu save history lỗi hoặc token hết hạn, player không crash và không chặn user xem phim; auth hiện tại chỉ clear session rồi app tiếp tục ở guest mode.
- `HistoryScreen` được chuyển sang dữ liệu API với guest state riêng; `ProfileScreen` có thêm entry mở màn lịch sử xem.
- `HomeScreen` có thêm block `Tiếp tục xem` theo thứ tự ưu tiên: server history khi logged-in, fallback local history khi guest hoặc API lỗi.
- Route `Watch` hỗ trợ thêm `initialProgressSeconds` để resume trực tiếp từ item lịch sử xem trên server.

**Lý do:** User yêu cầu lưu tiến độ xem phim lên server khi đã đăng nhập, nhưng vẫn giữ guest flow xem phim bình thường và không làm ảnh hưởng WatchScreen hiện tại.

## 2026-05-19 — Cập nhật ngay block Tiếp tục xem sau khi save history

**Files đã sửa:**
- `app/features/history/hooks/useUserHistory.ts`
- `app/features/player/screens/WatchScreen.tsx`
- `app/features/home/screens/HomeScreen.tsx`

**Chi tiết:**
- Export query key dùng chung cho `userHistory` để phần player có thể cập nhật/invalidate đúng cache sau khi `POST /api/user/history` thành công.
- `WatchScreen` giờ sync item vừa save vào React Query cache ngay lập tức và trigger revalidate nền, nên khi quay lại Home thì block `Tiếp tục xem` không còn giữ dữ liệu cũ.
- Bỏ dòng subtitle `Đồng bộ từ lịch sử tài khoản` trong block `Tiếp tục xem` để UI gọn hơn.

**Lý do:** User báo lịch sử xem đã lưu lên server nhưng danh sách trên `HomeScreen` chưa cập nhật, đồng thời muốn bỏ title phụ trong section này.

## 2026-05-19 — Thiết kế lại card lịch sử xem trên Home theo MovieCard

**Files đã sửa:**
- `app/features/home/screens/HomeScreen.tsx`

**Chi tiết:**
- Đổi `ContinueWatchingCard` từ layout ngang riêng sang card dọc tái sử dụng trực tiếp `MovieCard` cho phần poster/title.
- Giữ lại phần giá trị riêng của lịch sử xem ở footer: tập đang xem, metadata ngắn, progress bar và thời lượng đã xem.
- Chuẩn hóa data `continueWatchingItems` để map về `KKMovie` trước khi render, giúp block `Tiếp tục xem` dùng chung visual language với các section phim còn lại.

**Lý do:** User yêu cầu thiết kế lại movie card của lịch sử xem cho giống `MovieCard`, ưu tiên tái sử dụng component và vẫn giữ tiến trình đang xem.

## 2026-05-19 — Chuyển HistoryScreen sang grid dùng chung ResumeMovieCard

**Files đã sửa/tạo:**
- `app/components/movie/ResumeMovieCard.tsx` (mới)
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/history/screens/HistoryScreen.tsx`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Tách shared component `ResumeMovieCard` để gom logic UI resume/watch-progress vào một chỗ, trong đó phần poster/title tái sử dụng trực tiếp `MovieCard`.
- `HomeScreen` đổi sang dùng `ResumeMovieCard` thay vì card cục bộ, giữ đồng bộ giao diện với `HistoryScreen`.
- `HistoryScreen` không còn hiển thị list dọc kiểu row; thay vào đó là grid 2 cột với `ResumeMovieCard`, vẫn giữ progress bar, thời lượng đã xem và thời điểm xem gần nhất.

**Lý do:** User yêu cầu `HistoryScreen` dùng design giống `MovieCard` và hiển thị dạng grid, đồng thời ưu tiên tái sử dụng component.

## 2026-05-19 — Thêm flow xóa lịch sử xem và đồng bộ cache ngay

**Files đã sửa:**
- `app/features/history/services/userHistoryService.ts`
- `app/features/history/hooks/useUserHistory.ts`
- `app/components/movie/ResumeMovieCard.tsx`
- `app/features/history/screens/HistoryScreen.tsx`
- `app/features/home/screens/HomeScreen.tsx`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Bổ sung `deleteHistory(movieSlug)` cho `UserHistoryService`, gọi `DELETE /api/user/history/{movieSlug}` với `movieSlug` được validate và encode an toàn.
- Tạo mutation `useDeleteUserHistory()` dùng React Query optimistic update: remove item khỏi mọi cache `userHistory` theo `movieSlug`, rollback nếu API lỗi, rồi invalidate để đồng bộ lại với server.
- `ResumeMovieCard` hỗ trợ action overlay/loading riêng cho từng item, và `HistoryScreen` thêm confirm dialog + nút xóa ở từng card lịch sử xem.
- `HomeScreen` được chỉnh để khi user đã đăng nhập mà server history rỗng sau khi xóa, section `Tiếp tục xem` không fallback nhầm sang local history nữa.

**Lý do:** User yêu cầu xóa lịch sử xem theo `movieSlug`, đồng bộ UI ngay sau khi xóa và đảm bảo item đã xóa không còn xuất hiện ở cả `HistoryScreen` lẫn `HomeScreen`.

## 2026-05-19 — Thêm nút xóa lịch sử xem ngay trên HomeScreen

**Files đã sửa:**
- `app/features/home/screens/HomeScreen.tsx`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Card trong section `Tiếp tục xem` giờ hiện nút xóa khi item đang đến từ server history của user đã đăng nhập.
- Home dùng lại mutation delete history hiện có, kèm confirm dialog, loading riêng cho item đang xóa và optimistic cache sync giống `HistoryScreen`.
- Guest/local continue-watching vẫn không hiện nút xóa server để tránh gọi nhầm API protected.

**Lý do:** User yêu cầu section `Tiếp tục xem` trong `HomeScreen` cũng có nút xóa lịch sử xem.

## 2026-05-19 — Thêm flow đăng ký tài khoản bằng API thật

**Files đã sửa:**
- `app/types/index.ts`
- `app/utils/storage.ts`
- `app/features/auth/services/authService.ts`
- `app/features/auth/store/authStore.ts`
- `app/features/auth/hooks/useRegister.ts`
- `app/features/auth/screens/RegisterScreen.tsx`
- `app/features/auth/screens/LoginScreen.tsx`
- `app/features/profile/screens/ProfileScreen.tsx`
- `app/navigation/types.ts`
- `app/navigation/RootNavigator.tsx`
- `app/navigation/AuthNavigator.tsx`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Bổ sung type/register contract thật cho `POST /api/auth/register`, parse response defensive với `token`, `refreshToken`, `expiresIn`, `refreshExpiresIn` và `user`.
- `authStore` có thêm `refreshToken` và action `register(email, password, displayName)`, lưu access token vào secure storage hiện tại, refresh token vào storage, rồi set authenticated state ngay sau khi đăng ký thành công.
- Viết lại `RegisterScreen` với form email/display name/password/confirm password, loading, validate, show/hide password và auto-login flow sau khi đăng ký.
- `LoginScreen` có link sang `Register`, `ProfileScreen` guest mode có thêm CTA `Đăng ký tài khoản`, và root navigation cho phép mở register như một optional auth screen mà không chặn guest xem phim.

**Lý do:** User yêu cầu nối API đăng ký thật nhưng vẫn giữ luồng app guest-first, trong đó đăng ký chỉ là tính năng tùy chọn để đồng bộ dữ liệu cá nhân.

## 2026-05-19 — Cấu hình deeplink `flixtor://app`

**Files đã sửa/tạo:**
- `app/navigation/linking.ts` (mới)
- `App.tsx`
- `ios/Flixtor/AppDelegate.swift`
- `ios/Flixtor/Info.plist`
- `android/app/src/main/AndroidManifest.xml`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Thêm React Navigation linking config với prefix `flixtor://` và map `flixtor://app` vào tab `Home`.
- `NavigationContainer` giờ nhận `linking` config để app resolve deeplink ngay cả khi cold start.
- iOS đăng ký URL scheme `flixtor` trong `Info.plist` và forward URL/user activity từ `AppDelegate` vào `RCTLinkingManager`.
- Android đổi custom scheme intent-filter sang `scheme=flixtor` và `host=app` để nhận đúng deeplink `flixtor://app`.

**Lý do:** User yêu cầu cấu hình deeplink cho app theo định dạng `flixtor://app`.

## 2026-05-19 — Sửa lỗi build iOS do import `React_RCTLinking`

**Files đã sửa:**
- `ios/Flixtor/AppDelegate.swift`
- `ios/Flixtor/flixtor-Bridging-Header.h`

**Chi tiết:**
- Bỏ `import React_RCTLinking` khỏi `AppDelegate.swift` vì project iOS đang dùng `use_frameworks! :static`, dẫn tới module Swift này không được expose ổn định ở target app.
- Chuyển sang expose `RCTLinkingManager` qua bridging header bằng `#import <React/RCTLinkingManager.h>` để vẫn dùng được deeplink bridge trong Swift mà không phụ thuộc vào module import.

**Lý do:** User build iOS gặp lỗi `module dependency: 'React_RCTLinking'` ngay sau khi thêm deeplink.

## 2026-05-19 — Thêm flow quên mật khẩu và reset mật khẩu bằng deeplink HTTPS

**Files đã sửa/tạo:**
- `app/types/index.ts`
- `app/navigation/types.ts`
- `app/navigation/linking.ts`
- `app/navigation/RootNavigator.tsx`
- `app/navigation/AuthNavigator.tsx`
- `app/features/auth/services/authService.ts`
- `app/features/auth/hooks/useForgotPassword.ts` (mới)
- `app/features/auth/hooks/useResetPassword.ts` (mới)
- `app/features/auth/screens/LoginScreen.tsx`
- `app/features/auth/screens/ForgotPasswordScreen.tsx`
- `app/features/auth/screens/ResetPasswordScreen.tsx` (mới)
- `android/app/src/main/AndroidManifest.xml`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Bổ sung `forgotPassword(payload)` và `resetPassword(payload)` vào `AuthService`, parse response theo kiểu defensive và không log token reset.
- `LoginScreen` có link `Quên mật khẩu?`, `ForgotPasswordScreen` gửi `POST /api/auth/forgot-password` với `platform: 'MOBA'`, còn `ResetPasswordScreen` validate token/password/confirm password trước khi gọi `POST /api/auth/reset-password`.
- Root/Auth navigation có thêm `ForgotPassword` và `ResetPassword`; React Navigation linking được mở rộng để nhận cả `flixtor://reset-password/:token?` lẫn URL email `https://link-flixtor.vercel.app?screen=reset-password&token=...`.
- Linking layer có normalize + chống xử lý trùng deeplink trong thời gian ngắn để tránh navigate lặp khi app mở từ mail.
- Android app links intent filter cho `link-flixtor.vercel.app` được làm gọn để nhận cả `http` và `https` một cách rõ ràng hơn.

**Lý do:** User yêu cầu nối API quên mật khẩu/reset mật khẩu thật và để app mở đúng `ResetPasswordScreen` khi bấm link email.

## 2026-05-19 — Sửa login quay ngược về ResetPassword sau khi đổi mật khẩu

**Files đã sửa:**
- `app/features/auth/screens/LoginScreen.tsx`

**Chi tiết:**
- Thay logic `goBack()` sau đăng nhập thành reset stack có kiểm soát: app sẽ tìm màn non-auth gần nhất trong stack và cắt bỏ toàn bộ chuỗi màn auth (`Login`, `Register`, `ForgotPassword`, `ResetPassword`) nằm phía trên.
- Nếu login được mở như một auth-only flow không có màn non-auth phía trước, app sẽ reset về `RootTabs > Home`.

**Lý do:** User báo sau khi reset password thành công rồi đăng nhập, app quay ngược lại `ResetPasswordScreen` thay vì thoát hẳn khỏi auth flow.

## 2026-05-19 — Thêm Google Sign-In client-side trong LoginScreen

**Files đã sửa/tạo:**
- `app/features/auth/hooks/useAuthGoogle.ts` (mới)
- `app/features/auth/screens/LoginScreen.tsx`
- `ios/Flixtor/Info.plist`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Tạo hook `useAuthGoogle` để lazy-configure `GoogleSignin`, kiểm tra Play Services trên Android, gọi `signIn()`, xử lý cancel/error thân thiện và log có kiểm soát email/tên Google user mà không log token.
- `LoginScreen` có thêm nút `Đăng nhập với Google`, loading/error riêng và tái sử dụng asset icon Google hiện có; chưa ghép backend exchange nên sign-in thành công mới chỉ log thông tin user lấy được từ Google.
- Sửa lại Google URL scheme trên iOS `Info.plist` để khớp `REVERSED_CLIENT_ID` trong `GoogleService-Info.plist`, tránh lỗi/crash khi mở flow đăng nhập Google.

**Lý do:** User yêu cầu bổ sung Google login theo hướng client-side trước, chưa cần lắp logic backend, chỉ cần lấy được thông tin đăng nhập và log email.

## 2026-05-19 — Nối Google Sign-In với backend auth của Flix

**Files đã sửa:**
- `app/types/index.ts`
- `app/utils/storage.ts`
- `app/features/auth/services/authService.ts`
- `app/features/auth/store/authStore.ts`
- `app/features/auth/hooks/useAuthGoogle.ts`
- `docs/CODEBASE_MEMORY.md`

**Chi tiết:**
- Bổ sung types cho Google auth payload/response và thêm `AuthService.googleLogin()` gọi `POST /api/auth/moba/google`, parse response phòng thủ như các flow auth thật khác.
- `useAuthGoogle` giờ map Google user native sang payload backend, validate `email` và `id`, gọi backend để đổi sang token hệ thống rồi lưu session app thay vì chỉ log thông tin Google.
- `authStore` có action dùng chung `setAuthSession(...)`, persist thêm `authProvider`, và khi logout khỏi phiên Google sẽ sign out luôn Google client trước khi clear session local.

**Lý do:** User yêu cầu hoàn thiện flow đăng nhập Google để backend trả token/refreshToken/user của hệ thống Flix và app dùng session đó như login/register thường.

## 2026-05-19 — Thêm loading theo giai đoạn cho Google login backend

**Files đã sửa:**
- `app/features/auth/hooks/useAuthGoogle.ts`
- `app/features/auth/screens/LoginScreen.tsx`

**Chi tiết:**
- `useAuthGoogle` giờ expose thêm trạng thái loading theo giai đoạn để phân biệt lúc đang mở Google native và lúc đang exchange session với backend Flix.
- `LoginScreen` cập nhật nút Google để hiển thị label loading rõ hơn (`Đang mở Google...` / `Đang đăng nhập Flixtor...`) và thêm loading box dưới nút khi đang gọi backend.

**Lý do:** User muốn có hiệu ứng loading rõ ràng hơn khi flow Google Sign-In đang call API backend, tránh cảm giác app đứng sau khi chọn tài khoản Google.

## 2026-07-05 — Nâng platform baseline để chạy React Navigation 8 alpha an toàn

**Files đã sửa/tạo/xóa:**
- `package.json`, `package-lock.json`
- `babel.config.js`, `metro.config.js`, `tsconfig.json`
- `android/gradle.properties`, `android/gradle/wrapper/gradle-wrapper.properties`
- `App.tsx`
- `app/features/home/hooks/useMovieLists.ts`
- `app/features/search/hooks/useSearchMovies.ts`
- `app/features/history/screens/HistoryScreen.tsx`
- `app/features/home/screens/HomeScreen.tsx`
- `app/features/movie/screens/MovieDetailScreen.tsx`
- `app/types/index.ts`
- `app/utils/m3u8.ts`
- `app/navigator.ts` (mới)
- `service.ts`
- `patches/@react-navigation+native+8.0.0-alpha.30.patch`
- `patches/@react-navigation+bottom-tabs++@react-navigation+elements+3.0.0-alpha.37.patch`
- `patches/@react-navigation+native-stack++@react-navigation+elements+3.0.0-alpha.37.patch`
- Xóa patch cũ cho `react-native-track-player`, `@tanstack/react-query` và các patch React Navigation gắn version cũ

**Chi tiết:**
- Nâng nền tảng từ React Native `0.81.5` lên `0.83.6`, React `19.2.0`, React Navigation `8.0.0-alpha.30`, Reanimated `4.5.1`, Gesture Handler `3.0.2`, Screens `4.25.2` và React Query `5.101.2` để đáp ứng peer requirements của navigation 8.
- Chuyển Babel/Metro sang preset + worklets pipeline mới của RN 0.83 / Reanimated 4, bật `newArchEnabled=true` trên Android và nâng Gradle wrapper lên `9.0.0`.
- Cập nhật code app theo API mới của React Query (`gcTime`, `initialPageParam`, `isPending`) và bổ sung types/helpers còn thiếu cho downloads + HLS utilities để typecheck sạch trên stack mới.
- Regenerate lại patch-package cho React Navigation theo đúng version hiện tại để `npm install` không còn warning giả từ patch filenames cũ; đồng thời loại bỏ phần legacy `react-native-track-player` khỏi baseline thực tế bằng no-op service placeholder.

**Lý do:** User yêu cầu nâng toàn bộ stack để React Navigation 8 alpha chạy được an toàn, có kiểm chứng cả dependency graph lẫn native build/tooling mới.
