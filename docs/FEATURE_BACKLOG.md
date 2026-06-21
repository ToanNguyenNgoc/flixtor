# FEATURE_BACKLOG.md — Flixtor

> Ý tưởng và tính năng **chưa implement**.  
> ❌ Không ghi feature đã hoàn thành ở đây (→ CHANGE_MEMORY.md).  
> Khi implement xong → move entry sang CHANGE_MEMORY.md + xóa khỏi đây.

---

## Format

```
### [Feature name]
- **Status**: proposed | in-progress | deferred
- **Nguồn**: [ai gợi ý / context nào]
- **Mô tả**: [1-3 câu]
- **Files dự kiến**: [danh sách]
- **Priority**: low | medium | high
```

---

## Proposed Features

### Genre Filter / Browse by Category Screen
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: Màn hình Browse hiển thị tất cả genres dạng grid, tap vào genre để xem danh sách phim. Tương tự tab "Categories" của Netflix.
- **Files dự kiến**: `features/browse/screens/BrowseScreen.tsx`, `features/browse/screens/GenreMoviesScreen.tsx`
- **Priority**: medium

### Real Download Implementation
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: DownloadsScreen hiện là mock UI. Cần implement download thật bằng `react-native-blob-util` (đã có trong dependencies), lưu file path vào `@flixtor/download_queue`, phát offline bằng local file URI.
- **Files dự kiến**: `features/downloads/services/downloadService.ts`, `features/downloads/hooks/useDownload.ts`
- **Priority**: low

### Trailer Preview / YouTube Player
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: MovieDetailScreen có `trailerUrl` field. Cần thêm nút "Watch Trailer" mở trailer trong modal hoặc full-screen (dùng `react-native-youtube-iframe` đã có trong deps).
- **Files dự kiến**: `features/movie/components/TrailerModal.tsx`
- **Priority**: medium

### Search History / Recent Searches
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: Lưu lịch sử tìm kiếm vào `@flixtor/search_history` (key đã khai báo trong StorageKeys). Hiển thị recent searches khi SearchScreen focus trước khi nhập query.
- **Files dự kiến**: `features/search/screens/SearchScreen.tsx`, `utils/storage.ts`
- **Priority**: medium

### Multi-Profile Management (Create / Edit / Delete)
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: ProfileSelectionScreen hiện có nút "Manage Profiles" nhưng chưa implement. Cần màn hình create/edit/delete profile với avatar picker.
- **Files dự kiến**: `features/profile/screens/ManageProfilesScreen.tsx`, `features/profile/screens/EditProfileScreen.tsx`
- **Priority**: low

### Video Quality Selector
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: VideoPlayerScreen có `VideoSource[]` type với quality field. Cần thêm UI chọn 480p/720p/1080p trong controls overlay.
- **Files dự kiến**: `features/player/screens/VideoPlayerScreen.tsx`, có thể extract `QualitySelector.tsx`
- **Priority**: low

### Subtitle Support
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: Types đã có `Subtitle[]` và mock data có subtitle fields. Cần implement subtitle toggle trong player controls dùng `react-native-video` textTracks prop.
- **Files dự kiến**: `features/player/screens/VideoPlayerScreen.tsx`
- **Priority**: low

### Push Notifications (New Releases)
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: Dùng `@notifee/react-native` và `@react-native-firebase/messaging` (đã có trong deps) để gửi notification khi có phim mới.
- **Files dự kiến**: `services/notifications/notificationService.ts`
- **Priority**: low

### App Theme Toggle (Light / Dark)
- **Status**: proposed
- **Nguồn**: scaffold follow-up (2026-05-12)
- **Mô tả**: Hiện tại chỉ có dark theme. `appStore.ts` có placeholder cho theme setting. Cần implement light mode tokens và toggle trong ProfileScreen.
- **Files dự kiến**: `store/appStore.ts`, `config/theme.ts`
- **Priority**: low

### Filter Result Counter
- **Status**: proposed
- **Nguồn**: filter bottom sheet follow-up (2026-05-14)
- **Mô tả**: Hiển thị số lượng phim tương ứng với bộ lọc hiện tại ngay trên nút "Áp dụng" để người dùng biết trước kết quả trước khi đóng sheet.
- **Files dự kiến**: `app/features/filter/components/FilterBottomSheet.tsx`, `app/features/home/hooks/useMovieLists.ts`
- **Priority**: medium

### Saved Filter Presets
- **Status**: proposed
- **Nguồn**: filter bottom sheet follow-up (2026-05-14)
- **Mô tả**: Cho phép lưu nhanh các cấu hình lọc hay dùng như "Phim bộ Hàn Quốc", "Hoạt hình 2025" để mở lại chỉ với một chạm.
- **Files dự kiến**: `app/features/filter/components/FilterBottomSheet.tsx`, `app/features/filter/screens/FilterScreen.tsx`, `app/utils/storage.ts`
- **Priority**: medium

### Active Filter Chips With Remove Action
- **Status**: proposed
- **Nguồn**: filter bottom sheet follow-up (2026-05-14)
- **Mô tả**: Biến phần `activeFilters` hiện tại thành các chip có nút xoá từng điều kiện để chỉnh filter nhanh mà không cần mở lại bottom sheet.
- **Files dự kiến**: `app/features/filter/screens/FilterScreen.tsx`
- **Priority**: medium

### Filter Result Image Prefetch
- **Status**: proposed
- **Nguồn**: filter performance follow-up (2026-05-14)
- **Mô tả**: Prefetch poster cho 1-2 hàng đầu của page kế tiếp ngay sau khi API trả về để giảm cảm giác trống ảnh khi người dùng cuộn sâu.
- **Files dự kiến**: `app/features/filter/screens/FilterScreen.tsx`, `app/utils/imageCache.ts`
- **Priority**: medium

### Pull To Refresh For Filter Grid
- **Status**: proposed
- **Nguồn**: filter performance follow-up (2026-05-14)
- **Mô tả**: Thêm refresh gesture cho `FilterScreen` để user reload nhanh danh sách hiện tại mà không cần đổi filter hoặc rời màn hình.
- **Files dự kiến**: `app/features/filter/screens/FilterScreen.tsx`, `app/components/movie/MovieGrid.tsx`
- **Priority**: medium

### Smart Query Cache Per Filter
- **Status**: proposed
- **Nguồn**: filter performance follow-up (2026-05-14)
- **Mô tả**: Lưu và phục hồi nhanh các tổ hợp filter vừa dùng gần đây để khi user chuyển qua lại giữa các bộ lọc, danh sách phim hiện lại gần như tức thì.
- **Files dự kiến**: `app/features/home/hooks/useMovieLists.ts`, `app/features/filter/screens/FilterScreen.tsx`
- **Priority**: medium

### Shared Filter Param Sanitizer
- **Status**: proposed
- **Nguồn**: filter API bugfix follow-up (2026-05-14)
- **Mô tả**: Trích logic loại bỏ params rỗng thành utility dùng chung cho Search, Favorites hoặc các API list khác để tránh lặp lại bug gửi chuỗi rỗng.
- **Files dự kiến**: `app/utils/filters.ts`, `app/features/filter/screens/FilterScreen.tsx`, các hook list liên quan
- **Priority**: medium

### Optional Sort Direction UI
- **Status**: proposed
- **Nguồn**: filter API bugfix follow-up (2026-05-14)
- **Mô tả**: Bổ sung lựa chọn tăng/giảm cho sắp xếp thay vì đang giữ cứng `desc`, đồng thời chỉ gửi sort params khi user thực sự chọn.
- **Files dự kiến**: `app/features/filter/components/FilterBottomSheet.tsx`, `app/features/filter/screens/FilterScreen.tsx`
- **Priority**: medium

### Filter State URL/Route Sync
- **Status**: proposed
- **Nguồn**: filter API bugfix follow-up (2026-05-14)
- **Mô tả**: Đồng bộ bộ lọc đã chọn vào route params để khi mở lại màn hình hoặc điều hướng chéo, trạng thái filter và request params luôn nhất quán.
- **Files dự kiến**: `app/features/filter/screens/FilterScreen.tsx`, `app/navigation/types.ts`
- **Priority**: low

### Search Minimum Characters Hint
- **Status**: proposed
- **Nguồn**: search UX follow-up (2026-05-14)
- **Mô tả**: Khi user mới nhập 1 ký tự, hiển thị hint "Nhập ít nhất 2 ký tự" thay vì để vùng kết quả trống để tránh cảm giác app không phản hồi.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`
- **Priority**: medium

### Search Infinite Grid Pagination
- **Status**: proposed
- **Nguồn**: search UX follow-up (2026-05-14)
- **Mô tả**: Mở rộng search sang infinite query để khi có nhiều kết quả, user cuộn tiếp được thay vì giới hạn trong page đầu.
- **Files dự kiến**: `app/features/search/hooks/useSearchMovies.ts`, `app/features/search/screens/SearchScreen.tsx`
- **Priority**: medium

### Recent Search Suggestions
- **Status**: proposed
- **Nguồn**: search UX follow-up (2026-05-14)
- **Mô tả**: Hiển thị recent keywords hoặc gợi ý phổ biến ngay dưới ô search khi chưa có query để tăng tốc thao tác tìm kiếm.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`, `app/utils/storage.ts`
- **Priority**: medium

### Search Focus Delay Tuning
- **Status**: proposed
- **Nguồn**: search autofocus follow-up (2026-05-14)
- **Mô tả**: Tinh chỉnh thời điểm focus/keyboard khi chuyển tab để tránh xung đột animation navigator trên từng nền tảng, đặc biệt Android máy yếu.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`
- **Priority**: low

### Auto Select Existing Search Text
- **Status**: proposed
- **Nguồn**: search autofocus follow-up (2026-05-14)
- **Mô tả**: Khi quay lại màn Search với từ khóa cũ, tự select toàn bộ text để user thay keyword nhanh hơn mà không cần xoá tay.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`
- **Priority**: medium

### Search Submit Analytics
- **Status**: proposed
- **Nguồn**: search autofocus follow-up (2026-05-14)
- **Mô tả**: Ghi nhận sự kiện focus/search submit để đo tỷ lệ người dùng mở tab Search nhưng không nhập gì hoặc thoát ngay.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`, `services/analytics/*`
- **Priority**: low

### Hero Banner Title Artwork
- **Status**: proposed
- **Nguồn**: home hero redesign follow-up (2026-05-14)
- **Mô tả**: Thay text title trên poster bằng title artwork/logo riêng của từng phim nếu API hoặc CMS có asset tương ứng, để hero giống Netflix hơn nữa.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, `app/types/index.ts`
- **Priority**: medium

### Hero Banner Actions To Watch Screen
- **Status**: proposed
- **Nguồn**: home hero redesign follow-up (2026-05-14)
- **Mô tả**: Cho nút `Play` trên hero đi thẳng vào screen xem tập đầu hoặc nguồn phát mặc định thay vì chỉ mở MovieDetail.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, `app/features/movie/screens/MovieDetailScreen.tsx`, `app/navigation/types.ts`
- **Priority**: medium

### Auto-Rotating Hero Carousel
- **Status**: proposed
- **Nguồn**: home hero redesign follow-up (2026-05-14)
- **Mô tả**: Mở rộng hero hiện tại thành carousel nhiều phim nổi bật với animation chuyển slide chậm và indicator tinh gọn.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`
- **Priority**: medium

### Search Back Route Intent
- **Status**: proposed
- **Nguồn**: search back button follow-up (2026-05-14)
- **Mô tả**: Lưu nguồn mở SearchScreen (Home, tab switch, deep link) để nút back quay đúng về ngữ cảnh trước đó thay vì chỉ fallback về Home.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`, `app/navigation/types.ts`, nơi gọi navigate sang Search
- **Priority**: medium

### Collapsible Search Header
- **Status**: proposed
- **Nguồn**: search back button follow-up (2026-05-14)
- **Mô tả**: Khi người dùng đã có kết quả search, cho thanh search thu gọn nhẹ khi cuộn xuống để nhường nhiều không gian hơn cho grid kết quả.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`
- **Priority**: low

### React Navigation 8 Stable Upgrade Pass
- **Status**: proposed
- **Nguồn**: react-navigation 8 alpha upgrade follow-up (2026-06-21)
- **Mô tả**: Khi React Navigation 8 ra stable, chạy thêm một vòng nâng từ alpha lên stable để bỏ dependency prerelease, rà lại breaking changes mới và cập nhật các peer dependency theo bản chính thức.
- **Files dự kiến**: `package.json`, `package-lock.json`, `app/navigation/*`
- **Priority**: high

### Native Bottom Tabs Evaluation
- **Status**: proposed
- **Nguồn**: react-navigation 8 alpha upgrade follow-up (2026-06-21)
- **Mô tả**: Đánh giá việc chuyển từ `implementation="custom"` sang native bottom tabs mặc định của 8.x để tận dụng performance và hành vi platform-native, kèm audit lại icon, label và header behavior.
- **Files dự kiến**: `app/navigation/MainNavigator.tsx`, `app/brand/navigator/BrandBottomNavigator.tsx`
- **Priority**: medium

### Shared Typed Navigation Helpers
- **Status**: proposed
- **Nguồn**: react-navigation 8 alpha upgrade follow-up (2026-06-21)
- **Mô tả**: Tạo các helper/hook typed navigation dùng chung để gom pattern `useNavigation() as ...` và `useRoute() as ...`, giúp screen code gọn hơn và giảm lặp cast thủ công.
- **Files dự kiến**: `app/navigation/types.ts`, `app/navigation/hooks.ts`, các screen đang dùng navigation hooks
- **Priority**: medium

### React Navigation Alpha Dependency Alignment
- **Status**: proposed
- **Nguồn**: react-navigation runtime fix follow-up (2026-06-21)
- **Mô tả**: Rà lại bộ version `react`, `react-native`, `react-native-screens` và các transitive alpha của React Navigation để giảm số patch tạm thời cho `ActivityView` và các API Fabric/new React còn lệch phiên bản.
- **Files dự kiến**: `package.json`, `package-lock.json`, `patches/`, có thể thêm ghi chú vào `docs/`
- **Priority**: high

### React 19 Peer Compatibility Cleanup
- **Status**: proposed
- **Nguồn**: dependency audit follow-up (2026-06-21)
- **Mô tả**: Nâng hoặc thay thế các package còn peer mismatch với `react@19.1.0`, ưu tiên `@tanstack/react-query` và `react-native-fast-image`, để `npm ls` sạch hơn và giảm rủi ro runtime âm thầm.
- **Files dự kiến**: `package.json`, `package-lock.json`, các screen/hook dùng React Query hoặc image wrapper nếu cần chỉnh API
- **Priority**: high

### Brand Navigator Liquid Glass Parity
- **Status**: proposed
- **Nguồn**: MainNavigator liquid glass follow-up (2026-06-21)
- **Mô tả**: Áp dụng visual treatment tương tự cho `BrandBottomNavigator` để hai nhánh điều hướng chính có trải nghiệm tab bar nhất quán trên iOS.
- **Files dự kiến**: `app/brand/navigator/BrandBottomNavigator.tsx`, có thể cần theme token bổ sung nếu muốn tách màu brand riêng
- **Priority**: medium

### Voice Search Entry Point
- **Status**: proposed
- **Nguồn**: search back button follow-up (2026-05-14)
- **Mô tả**: Bổ sung nút voice/microphone cạnh thanh search để tăng tốc nhập truy vấn trên mobile.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`
- **Priority**: low

### Centralized Image Prefetch Policy
- **Status**: proposed
- **Nguồn**: performance audit follow-up (2026-05-14)
- **Mô tả**: Tạo policy dùng chung cho số lượng ảnh preload theo từng màn và loại list để tránh mỗi màn tự prefetch quá tay gây tốn RAM/bandwidth.
- **Files dự kiến**: `app/utils/imageCache.ts`, các screen dùng `prefetchImages`
- **Priority**: medium

### Search Grid Infinite Pagination
- **Status**: proposed
- **Nguồn**: performance audit follow-up (2026-05-14)
- **Mô tả**: Chuyển search sang infinite query + footer skeleton để không phải nạp cùng lúc quá nhiều item trong một response lớn.
- **Files dự kiến**: `app/features/search/hooks/useSearchMovies.ts`, `app/features/search/screens/SearchScreen.tsx`
- **Priority**: medium

### Global Query Cache Budget Review
- **Status**: proposed
- **Nguồn**: performance audit follow-up (2026-05-14)
- **Mô tả**: Rà lại `QueryClient` defaults (`staleTime`, `cacheTime`, retry) theo từng nhóm màn để cân bằng tốc độ mở lại dữ liệu và RAM trên máy yếu.
- **Files dự kiến**: `App.tsx`, các hook React Query chính
- **Priority**: medium

### Cast Search Suggestions
- **Status**: proposed
- **Nguồn**: actor-to-search navigation follow-up (2026-05-18)
- **Mô tả**: Khi user mở Search từ chip diễn viên, hiển thị thêm cụm gợi ý như "Phim của [tên diễn viên]" hoặc các từ khóa liên quan để tiếp tục khám phá nhanh hơn.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`, `app/features/search/hooks/useSearchMovies.ts`
- **Priority**: medium

### Person Filmography Screen
- **Status**: proposed
- **Nguồn**: actor-to-search navigation follow-up (2026-05-18)
- **Mô tả**: Tạo màn hình riêng cho diễn viên/đạo diễn với ảnh đại diện, tiểu sử ngắn và danh sách phim liên quan thay vì chỉ dựa vào search text thông thường.
- **Files dự kiến**: `app/features/person/screens/PersonDetailScreen.tsx`, `app/navigation/types.ts`, `app/services/api/phimApi.ts`
- **Priority**: medium

### Search Result Source Badge
- **Status**: proposed
- **Nguồn**: actor-to-search navigation follow-up (2026-05-18)
- **Mô tả**: Khi Search được mở từ MovieDetail qua tên diễn viên, thêm badge hoặc headline nhỏ để cho biết kết quả hiện tại đang đến từ hành động "Tìm theo diễn viên", giúp user hiểu ngữ cảnh tốt hơn.
- **Files dự kiến**: `app/features/search/screens/SearchScreen.tsx`, `app/navigation/types.ts`
- **Priority**: low

### Detail Image Retry Overlay
- **Status**: proposed
- **Nguồn**: movie detail image regression follow-up (2026-05-14)
- **Mô tả**: Khi banner hoặc poster lỗi tải do CDN/network, hiển thị trạng thái retry trực tiếp trên vùng ảnh thay vì chỉ fallback thầm lặng để người dùng hiểu chuyện gì xảy ra.
- **Files dự kiến**: `app/components/common/CachedImage.tsx`, `app/features/movie/screens/MovieDetailScreen.tsx`
- **Priority**: medium

### Shared Stable Image Source Helper
- **Status**: proposed
- **Nguồn**: movie detail image regression follow-up (2026-05-14)
- **Mô tả**: Chuẩn hoá helper tạo `sourceKey` và source memo cho ảnh dùng lại toàn app để tránh các màn khác lặp lại lỗi reset loading theo object reference.
- **Files dự kiến**: `app/utils/image.ts`, `app/components/common/CachedImage.tsx`, các screen/card dùng ảnh nhiều
- **Priority**: medium

### Detail Screen Image Lifecycle Tests
- **Status**: proposed
- **Nguồn**: movie detail image regression follow-up (2026-05-14)
- **Mô tả**: Bổ sung test cho luồng mở MovieDetail, vào Watch rồi quay lại để đảm bảo poster/banner vẫn hiển thị đúng sau các lần focus và rerender.
- **Files dự kiến**: `app/features/movie/screens/MovieDetailScreen.tsx`, bộ test React Native/Jest liên quan
- **Priority**: low

### Query Persistence Thresholds
- **Status**: proposed
- **Nguồn**: performance round 2 follow-up (2026-05-14)
- **Mô tả**: Phân tầng query theo mức quan trọng để dữ liệu nặng như search/filter grid có cacheTime ngắn hơn, còn detail/favorites có thể giữ lâu hơn.
- **Files dự kiến**: `App.tsx`, các hook React Query trong `features/*/hooks`
- **Priority**: medium

### Dynamic List Window Tuning
- **Status**: proposed
- **Nguồn**: performance round 2 follow-up (2026-05-14)
- **Mô tả**: Tinh chỉnh `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` theo từng màn và kích thước thiết bị thay vì dùng một profile cố định cho mọi grid/list.
- **Files dự kiến**: `app/components/movie/MovieGrid.tsx`, `app/features/home/screens/HomeScreen.tsx`, `app/features/filter/screens/FilterScreen.tsx`
- **Priority**: medium

### Hero Banner Render Freeze
- **Status**: proposed
- **Nguồn**: performance round 2 follow-up (2026-05-14)
- **Mô tả**: Tách hero thành component độc lập với props tối giản và comparator riêng để khi list section hoặc store khác đổi, hero không bị render lại.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`
- **Priority**: low

### Regional Home Sections
- **Status**: proposed
- **Nguồn**: home section follow-up (2026-05-14)
- **Mô tả**: Mở rộng từ `Phim Việt Nam` sang các hàng nội dung theo quốc gia như Hàn Quốc, Trung Quốc, Thái Lan để Home có chiều sâu khám phá hơn.
- **Files dự kiến**: `app/features/home/hooks/useMovieLists.ts`, `app/features/home/screens/HomeScreen.tsx`
- **Priority**: medium

### Country Chips On Home
- **Status**: proposed
- **Nguồn**: home section follow-up (2026-05-14)
- **Mô tả**: Thêm một hàng chip quốc gia ngay trên Home để chuyển nhanh giữa các section/quốc gia nổi bật thay vì chỉ xem danh sách cố định.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, `app/features/filter/hooks/useCountries.ts`
- **Priority**: medium

### Localized Hero Pick
- **Status**: proposed
- **Nguồn**: home section follow-up (2026-05-14)
- **Mô tả**: Ưu tiên hero banner từ phim Việt Nam hoặc theo quốc gia user vừa quan tâm để Home cảm giác cá nhân hoá hơn.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, logic query/recommendation liên quan
- **Priority**: low

### Progressive Home Hydration
- **Status**: proposed
- **Nguồn**: home loading/performance follow-up (2026-05-14)
- **Mô tả**: Cho phép Home render hero và 1-2 section đầu ngay khi có dữ liệu, còn các section phụ hydrate sau để giảm thời gian chờ cảm nhận khi mạng yếu.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, `app/features/home/hooks/useMovieLists.ts`
- **Priority**: medium

### Home Section Query Budget
- **Status**: proposed
- **Nguồn**: home loading/performance follow-up (2026-05-14)
- **Mô tả**: Rà lại số query song song, page size và staleTime riêng cho từng hàng Home để tránh nạp quá nhiều dữ liệu ngay lúc mở app.
- **Files dự kiến**: `app/features/home/hooks/useMovieLists.ts`, `App.tsx`
- **Priority**: medium

### Personalized Home Skeleton Variants
- **Status**: proposed
- **Nguồn**: home loading/performance follow-up (2026-05-14)
- **Mô tả**: Thay đổi skeleton theo từng layout Home thực tế như hero lớn, section quốc gia, section top picks để loading nhìn sát UI hơn khi tiếp tục mở rộng Home.
- **Files dự kiến**: `app/features/home/components/HomeScreenSkeleton.tsx`, `app/features/home/screens/HomeScreen.tsx`
- **Priority**: low

### Trailer Fullscreen Modal
- **Status**: proposed
- **Nguồn**: movie detail trailer follow-up (2026-05-14)
- **Mô tả**: Cho trailer mở trong modal fullscreen hoặc landscape riêng để trải nghiệm xem preview tốt hơn thay vì chỉ xem inline trong detail.
- **Files dự kiến**: `app/features/movie/screens/MovieDetailScreen.tsx`, có thể thêm `app/features/movie/components/TrailerPlayerModal.tsx`
- **Priority**: medium

### Trailer Thumbnail Preview
- **Status**: proposed
- **Nguồn**: movie detail trailer follow-up (2026-05-14)
- **Mô tả**: Lấy thumbnail YouTube để block trailer nhìn giàu hình ảnh hơn trước khi người dùng bấm phát.
- **Files dự kiến**: `app/features/movie/screens/MovieDetailScreen.tsx`, `app/utils/image.ts`
- **Priority**: low

### Related Videos In Detail
- **Status**: proposed
- **Nguồn**: movie detail trailer follow-up (2026-05-14)
- **Mô tả**: Mở rộng phần trailer thành cụm media gồm trailer, teaser, clip hậu trường nếu API hoặc nguồn dữ liệu sau này có thêm video liên quan.
- **Files dự kiến**: `app/types/index.ts`, `app/features/movie/screens/MovieDetailScreen.tsx`
- **Priority**: low

### Trailer Playback Policy
- **Status**: proposed
- **Nguồn**: movie detail trailer UX follow-up (2026-05-14)
- **Mô tả**: Tinh chỉnh policy phát trailer inline như autoplay muted, lazy-mount theo viewport, hoặc pause khi scroll khỏi màn hình để cân bằng UX và hiệu năng.
- **Files dự kiến**: `app/features/movie/screens/MovieDetailScreen.tsx`
- **Priority**: medium

### Image Proxy Health Metrics
- **Status**: proposed
- **Nguồn**: image proxy cache follow-up (2026-05-14)
- **Mô tả**: Ghi nhận tỷ lệ ảnh proxy `.webp` lỗi và tỷ lệ fallback về URL gốc để biết khi nào dịch vụ `image.php` có vấn đề.
- **Files dự kiến**: `app/components/common/CachedImage.tsx`, `services/analytics/*`
- **Priority**: low

### Configurable Image Proxy Toggle
- **Status**: proposed
- **Nguồn**: image proxy cache follow-up (2026-05-14)
- **Mô tả**: Thêm cờ cấu hình để bật/tắt proxy `image.php` nhanh khi cần debug hoặc rollback mà không phải sửa code nhiều nơi.
- **Files dự kiến**: `app/utils/image.ts`, `app/config/env.ts`
- **Priority**: medium

### Poster Size Variants
- **Status**: proposed
- **Nguồn**: image proxy cache follow-up (2026-05-14)
- **Mô tả**: Nếu KKPhim sau này hỗ trợ resize/crop theo tham số, tách các variant ảnh theo màn hình để giảm thêm băng thông và bộ nhớ.
- **Files dự kiến**: `app/utils/image.ts`, các screen/card dùng ảnh
- **Priority**: low

### WatchScreen Gesture Safe Zones
- **Status**: proposed
- **Nguồn**: watchscreen immersive mode follow-up (2026-05-14)
- **Mô tả**: Tinh chỉnh thêm vùng chạm của slider và bottom controls theo từng chế độ gesture navigation/3-button navigation để tua video ổn định hơn trên nhiều máy Android.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: medium

### System UI Mode Reuse
- **Status**: proposed
- **Nguồn**: watchscreen immersive mode follow-up (2026-05-14)
- **Mô tả**: Tái sử dụng `SystemUiModule` cho các màn media khác như trailer fullscreen hoặc gallery ảnh để có immersive behavior nhất quán.
- **Files dự kiến**: `app/utils/systemUi.ts`, các screen media liên quan
- **Priority**: low

### Android Player Inset Telemetry
- **Status**: proposed
- **Nguồn**: watchscreen immersive mode follow-up (2026-05-14)
- **Mô tả**: Ghi nhận model máy và navigation mode khi user gặp seek issue để biết cần tối ưu thêm riêng cho nhóm thiết bị nào.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`, `services/analytics/*`
- **Priority**: low

### Seek Thumbnail Preview
- **Status**: proposed
- **Nguồn**: Android custom seek bar follow-up (2026-05-14)
- **Mô tả**: Hiển thị bubble preview thời gian hoặc thumbnail nhỏ phía trên thumb khi người dùng kéo seek bar để tua chính xác hơn.
- **Files dự kiến**: `app/features/player/components/VideoSeekBar.android.tsx`, `app/features/player/screens/WatchScreen.tsx`
- **Priority**: medium

### Buffered Range Analytics
- **Status**: proposed
- **Nguồn**: Android custom seek bar follow-up (2026-05-14)
- **Mô tả**: Ghi nhận tương quan giữa `bufferedTime`, thao tác seek và thời gian chờ sau seek để xác định stream hoặc server nào có UX tua kém.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`, `services/analytics/*`
- **Priority**: low

### Full Custom Seek Bar For iOS
- **Status**: proposed
- **Nguồn**: Android custom seek bar follow-up (2026-05-14)
- **Mô tả**: Nếu sau này cần đồng nhất hoàn toàn gesture và giao diện seek giữa hai nền tảng, có thể chuyển iOS sang cùng custom seek bar thay vì native slider.
- **Files dự kiến**: `app/features/player/components/VideoSeekBar.ios.tsx`, `app/features/player/components/VideoSeekBar.android.tsx`
- **Priority**: low

### API Server Health Indicator
- **Status**: proposed
- **Nguồn**: settings server switch follow-up (2026-05-18)
- **Mô tả**: Hiển thị trạng thái ping/latency cơ bản của từng API server trong `SettingScreen` để người dùng biết server nào đang phản hồi tốt hơn trước khi chuyển.
- **Files dự kiến**: `app/features/settings/screens/SettingScreen.tsx`, `app/services/api/axiosClient.ts`
- **Priority**: medium

### Server Switch Confirmation For Active Playback
- **Status**: proposed
- **Nguồn**: settings server switch follow-up (2026-05-18)
- **Mô tả**: Nếu người dùng đang xem phim hoặc đang có request quan trọng, hiển thị confirm trước khi đổi server để tránh ngắt mạch trải nghiệm.
- **Files dự kiến**: `app/features/settings/screens/SettingScreen.tsx`, `app/features/player/screens/WatchScreen.tsx`
- **Priority**: low

### Debug Info In App Settings
- **Status**: proposed
- **Nguồn**: settings server switch follow-up (2026-05-18)
- **Mô tả**: Mở rộng `SettingScreen` với app version, current API host và nút copy debug info để tiện hỗ trợ khi QA hoặc debug lỗi từ nhiều nguồn server.
- **Files dự kiến**: `app/features/settings/screens/SettingScreen.tsx`
- **Priority**: low

### Home Continue Watching Rail
- **Status**: proposed
- **Nguồn**: HomeScreen UI/UX follow-up (2026-05-18)
- **Mô tả**: Đưa một hàng `Xem tiếp` có progress lên gần đầu Home để người dùng quay lại đúng phim đang xem dở chỉ với một chạm.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, `app/features/history/store/watchHistoryStore.ts`
- **Priority**: high

### Hero Idle Trailer Teaser
- **Status**: proposed
- **Nguồn**: HomeScreen UI/UX follow-up (2026-05-18)
- **Mô tả**: Khi người dùng dừng ở một hero slide vài giây, có thể tự hiện teaser ngắn hoặc motion preview muted để tăng cảm giác cinematic.
- **Files dự kiến**: `app/components/movie/HeroBanner.tsx`, `app/features/movie/screens/MovieDetailScreen.tsx`
- **Priority**: medium

### Personalized Home Section Ordering
- **Status**: proposed
- **Nguồn**: HomeScreen UI/UX follow-up (2026-05-18)
- **Mô tả**: Sắp xếp lại thứ tự các section dựa trên lịch sử mở phim hoặc thói quen chạm để Home có cảm giác cá nhân hóa hơn.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, `app/features/history/store/watchHistoryStore.ts`, logic recommendation liên quan
- **Priority**: medium

### WatchScreen Orientation Preference
- **Status**: proposed
- **Nguồn**: WatchScreen orientation follow-up (2026-05-18)
- **Mô tả**: Thêm tùy chọn nhớ chiều xem ưa thích của người dùng, ví dụ luôn mở player ở portrait hoặc tự xoay theo cảm biến.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`, `app/utils/storage.ts`, `app/features/settings/screens/SettingScreen.tsx`
- **Priority**: medium

### Landscape Minimal Controls Mode
- **Status**: proposed
- **Nguồn**: WatchScreen orientation follow-up (2026-05-18)
- **Mô tả**: Khi đang landscape, tách thêm một mode controls tối giản hơn để giảm độ che video, đặc biệt trên máy nhỏ hoặc khi đang binge-watch lâu.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: low

### Rotation Stress Test Checklist
- **Status**: proposed
- **Nguồn**: WatchScreen orientation follow-up (2026-05-18)
- **Mô tả**: Tạo checklist QA hoặc test plan riêng cho các case xoay màn hình khi đang seek, buffering, đổi quality và back navigation để bắt regression sớm hơn.
- **Files dự kiến**: `docs/*`, có thể thêm test/manual QA notes liên quan player
- **Priority**: low

### Landscape Mini Progress Strip
- **Status**: proposed
- **Nguồn**: WatchScreen landscape bugfix follow-up (2026-05-18)
- **Mô tả**: Thêm một progress strip mảnh luôn hiện ở landscape khi controls đã ẩn, để người dùng biết vị trí xem và chạm nhanh để gọi lại thanh seek đầy đủ.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: medium

### Embed Source Capability Notice
- **Status**: proposed
- **Nguồn**: WatchScreen landscape bugfix follow-up (2026-05-18)
- **Mô tả**: Nếu tập phim chỉ có `embed` source, hiển thị nhãn giải thích rằng một số tính năng native như seek bar hoặc quality switch có thể bị giới hạn để tránh hiểu nhầm là lỗi player.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`, `app/utils/episode.ts`
- **Priority**: medium

### Landscape Controls Gradient Overlay
- **Status**: proposed
- **Nguồn**: WatchScreen landscape bugfix follow-up (2026-05-18)
- **Mô tả**: Thay lớp nền đen phủ toàn màn controls bằng gradient trên/dưới để giữ độ đọc tốt cho nút bấm nhưng không làm cảm giác video bị tối hoặc bị “crop” khi bật controls.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: low

### Portrait Minimal Status Bar Mode
- **Status**: proposed
- **Nguồn**: WatchScreen portrait player-only follow-up (2026-05-18)
- **Mô tả**: Cho phép ẩn luôn status bar trong portrait khi controls đang tắt để chế độ xem dọc tối giản và tập trung hơn vào video.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: low

### Portrait Overlay Metadata Chip
- **Status**: proposed
- **Nguồn**: WatchScreen portrait player-only follow-up (2026-05-18)
- **Mô tả**: Nếu vẫn cần chút ngữ cảnh khi xem dọc, có thể thêm 1-2 chip nhỏ trong overlay như tên tập hoặc chất lượng thay vì trả lại cả panel bên dưới.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: medium

### Portrait Tap-To-Show Episode Drawer
- **Status**: proposed
- **Nguồn**: WatchScreen portrait player-only follow-up (2026-05-18)
- **Mô tả**: Thêm shortcut nhẹ trong overlay để mở danh sách tập nhanh ở portrait mà không làm top action row bị quá chật trên máy nhỏ.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: low

### Landscape Edge-To-Edge Controls Polish
- **Status**: proposed
- **Nguồn**: WatchScreen fill mode follow-up (2026-05-18)
- **Mô tả**: Tối ưu tiếp spacing của top bar, speed menu và seek bar khi video đang edge-to-edge ở landscape để tránh cảm giác controls quá sát tai thỏ hoặc cạnh cong của máy.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: medium

### Fill Mode Subtitle Safe Zone
- **Status**: proposed
- **Nguồn**: WatchScreen fill mode follow-up (2026-05-18)
- **Mô tả**: Thêm tuỳ chọn subtitle safe zone nhẹ khi ở `Fill` để tránh phụ đề bị crop trên một số video siêu rộng hoặc khi bị zoom nhiều.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`, có thể kèm cấu hình player/subtitle liên quan
- **Priority**: low

### WatchScreen Performance Telemetry
- **Status**: proposed
- **Nguồn**: WatchScreen performance optimization follow-up (2026-05-18)
- **Mô tả**: Thêm log/telemetry nội bộ cho dropped frames, buffering duration và render cost khi xem lâu để biết tối ưu hiện tại cải thiện được bao nhiêu trên thiết bị thật.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`, tooling/analytics liên quan
- **Priority**: medium

### Quality Manifest Cache
- **Status**: proposed
- **Nguồn**: WatchScreen performance optimization follow-up (2026-05-18)
- **Mô tả**: Cache kết quả parse `m3u8` quality theo URL để đổi tập hoặc quay lại phim không phải fetch/parse lại manifest nhiều lần, giảm CPU mạng và thời gian chờ.
- **Files dự kiến**: `app/utils/m3u8.ts`, `app/features/player/screens/WatchScreen.tsx`
- **Priority**: medium

### Player Controls Animation Simplification
- **Status**: proposed
- **Nguồn**: WatchScreen performance optimization follow-up (2026-05-18)
- **Mô tả**: Nếu còn cần giảm GPU trên máy yếu, đơn giản hóa thêm animation hoặc vùng feedback overlay khi tua để hạ compositing cost lúc controls xuất hiện liên tục.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`
- **Priority**: low

### Refresh Token Flow
- **Status**: proposed
- **Nguồn**: auth API integration follow-up (2026-05-19)
- **Mô tả**: Nếu backend bổ sung refresh token endpoint, app nên tự làm mới access token nền thay vì logout ngay khi gặp `401`, giúp phiên xem phim ít bị gián đoạn hơn.
- **Files dự kiến**: `app/features/auth/services/authService.ts`, `app/features/auth/store/authStore.ts`, `app/services/api/axiosClient.ts`
- **Priority**: high

### Forgot Password API Integration
- **Status**: proposed
- **Nguồn**: auth API integration follow-up (2026-05-19)
- **Mô tả**: Màn `ForgotPassword` hiện vẫn là stub; cần nối endpoint reset password để auth flow đầy đủ hơn thay vì chỉ có login/logout.
- **Files dự kiến**: `app/features/auth/screens/ForgotPasswordScreen.tsx`, `app/features/auth/services/authService.ts`, `app/navigation/AuthNavigator.tsx`
- **Priority**: medium

### Biometric Session Unlock
- **Status**: proposed
- **Nguồn**: auth API integration follow-up (2026-05-19)
- **Mô tả**: Sau khi đã có JWT lưu trong secure storage, có thể thêm Face ID/Touch ID hoặc sinh trắc học Android để mở lại phiên nhanh mà không cần nhập lại mật khẩu.
- **Files dự kiến**: `app/features/auth/store/authStore.ts`, `app/features/auth/screens/LoginScreen.tsx`, native/device auth service liên quan
- **Priority**: medium

### Optional Login Entry Points From Movie Actions
- **Status**: proposed
- **Nguồn**: optional auth flow follow-up (2026-05-19)
- **Mô tả**: Nếu sau này có tính năng cá nhân hóa như favorites hoặc cloud sync, app có thể nhắc đăng nhập đúng lúc user bấm action cần tài khoản thay vì chỉ đặt entry point ở tab Profile.
- **Files dự kiến**: `app/features/movie/screens/MovieDetailScreen.tsx`, `app/features/profile/screens/ProfileScreen.tsx`, các store tính năng liên quan
- **Priority**: medium

### Guest-To-User Data Merge
- **Status**: proposed
- **Nguồn**: optional auth flow follow-up (2026-05-19)
- **Mô tả**: Khi user dùng app ở guest mode rồi mới đăng nhập, có thể merge dữ liệu cục bộ như favorites hoặc history vào tài khoản để tránh mất dữ liệu đã tích lũy trước đó.
- **Files dự kiến**: `app/features/auth/store/authStore.ts`, `app/features/favorites/store/favoriteStore.ts`, `app/features/history/store/watchHistoryStore.ts`
- **Priority**: medium

### Profile Privacy Fields Toggle
- **Status**: proposed
- **Nguồn**: profile privacy follow-up (2026-05-19)
- **Mô tả**: Cho phép cấu hình nhanh field nào được hiển thị trong ProfileScreen như email, ngày tạo hoặc các metadata tài khoản để UI gọn hơn theo nhu cầu.
- **Files dự kiến**: `app/features/profile/screens/ProfileScreen.tsx`, có thể kèm settings/store liên quan
- **Priority**: low

### Server History Pagination / Infinite Scroll
- **Status**: proposed
- **Nguồn**: watch history sync follow-up (2026-05-19)
- **Mô tả**: `HistoryScreen` hiện mới lấy page đầu tiên. Có thể mở rộng sang infinite scroll để user xem lịch sử dài hơn mà không phải giới hạn ở 20 mục.
- **Files dự kiến**: `app/features/history/hooks/useUserHistory.ts`, `app/features/history/screens/HistoryScreen.tsx`
- **Priority**: medium

### Cloud Resume Merge Strategy
- **Status**: proposed
- **Nguồn**: watch history sync follow-up (2026-05-19)
- **Mô tả**: Khi local progress và server progress khác nhau cho cùng một phim/tập, app nên có chiến lược chọn bản mới hơn hoặc merge thông minh thay vì chỉ ưu tiên cứng một phía.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`, `app/features/history/store/watchHistoryStore.ts`, `app/features/history/services/userHistoryService.ts`
- **Priority**: medium

### Continue Watching Metadata Enrichment
- **Status**: proposed
- **Nguồn**: watch history sync follow-up (2026-05-19)
- **Mô tả**: Hiện block `Tiếp tục xem` từ API chưa có phần trăm tiến độ thật vì backend chưa trả duration; nếu backend bổ sung duration/runtime thì card có thể hiển thị progress chính xác hơn.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, `app/features/history/screens/HistoryScreen.tsx`, backend contract liên quan
- **Priority**: low

### Optimistic History Cache Reconciliation
- **Status**: proposed
- **Nguồn**: home continue-watching refresh fix follow-up (2026-05-19)
- **Mô tả**: Hiện app đã patch cache cục bộ ngay sau khi save history; có thể nâng cấp thêm rule reconcile với dữ liệu trả về từ server để giữ thứ tự và metadata luôn nhất quán hơn trên mọi page cache.
- **Files dự kiến**: `app/features/player/screens/WatchScreen.tsx`, `app/features/history/hooks/useUserHistory.ts`, `app/features/history/services/userHistoryService.ts`
- **Priority**: low

### Continue Watching Runtime Labels
- **Status**: proposed
- **Nguồn**: continue-watching card redesign follow-up (2026-05-19)
- **Mô tả**: Nếu có thêm runtime hoặc duration từ backend/local source, footer của card `Tiếp tục xem` có thể hiển thị cả phần trăm và trạng thái như “còn lại bao lâu” thay vì chỉ có số giây đã xem.
- **Files dự kiến**: `app/features/home/screens/HomeScreen.tsx`, `app/features/history/services/userHistoryService.ts`, nguồn metadata phim liên quan
- **Priority**: low

### Adaptive Resume Grid Columns
- **Status**: proposed
- **Nguồn**: history resume grid redesign follow-up (2026-05-19)
- **Mô tả**: `HistoryScreen` hiện đang dùng grid 2 cột cố định; có thể tối ưu thêm để tự đổi số cột theo tablet/landscape nhằm tận dụng không gian tốt hơn mà vẫn giữ footer card dễ đọc.
- **Files dự kiến**: `app/features/history/screens/HistoryScreen.tsx`, `app/components/movie/ResumeMovieCard.tsx`
- **Priority**: low

### Undo Delete History
- **Status**: proposed
- **Nguồn**: delete watch history follow-up (2026-05-19)
- **Mô tả**: Sau khi xóa khỏi lịch sử xem, có thể thêm snackbar/toast với hành động “Hoàn tác” trong vài giây để tránh xóa nhầm khi backend đã hỗ trợ hoặc khi app còn giữ optimistic snapshot.
- **Files dự kiến**: `app/features/history/screens/HistoryScreen.tsx`, `app/features/history/hooks/useUserHistory.ts`, UI feedback layer liên quan
- **Priority**: low

### Bulk Clear Watch History
- **Status**: proposed
- **Nguồn**: home/history delete action follow-up (2026-05-19)
- **Mô tả**: Sau khi đã có xóa từng item ở `HistoryScreen` và `HomeScreen`, có thể bổ sung hành động xóa toàn bộ lịch sử xem nếu backend hỗ trợ endpoint phù hợp.
- **Files dự kiến**: `app/features/history/screens/HistoryScreen.tsx`, `app/features/home/screens/HomeScreen.tsx`, `app/features/history/services/userHistoryService.ts`
- **Priority**: low

### Email Verification Prompt
- **Status**: proposed
- **Nguồn**: register API integration follow-up (2026-05-19)
- **Mô tả**: Sau khi đăng ký thành công, app có thể nhắc user xác minh email hoặc hiển thị trạng thái xác minh nổi bật hơn để user hiểu vì sao một số tính năng tài khoản có thể bị giới hạn sau này.
- **Files dự kiến**: `app/features/profile/screens/ProfileScreen.tsx`, `app/features/auth/screens/RegisterScreen.tsx`, `app/features/auth/services/authService.ts`
- **Priority**: medium

### Password Strength Meter
- **Status**: proposed
- **Nguồn**: register API integration follow-up (2026-05-19)
- **Mô tả**: Thêm đánh giá độ mạnh mật khẩu trực tiếp trên `RegisterScreen` để giảm lỗi đăng ký và giúp user tạo mật khẩu tốt hơn trước khi gửi request.
- **Files dự kiến**: `app/features/auth/screens/RegisterScreen.tsx`, `app/features/auth/hooks/useRegister.ts`
- **Priority**: low

### Resend Verification Email
- **Status**: proposed
- **Nguồn**: register API integration follow-up (2026-05-19)
- **Mô tả**: Nếu backend có endpoint phù hợp, app có thể thêm hành động gửi lại email xác minh từ `ProfileScreen` hoặc sau khi vừa đăng ký thành công.
- **Files dự kiến**: `app/features/auth/services/authService.ts`, `app/features/profile/screens/ProfileScreen.tsx`, có thể kèm screen/banner nhắc xác minh
- **Priority**: medium

### Deep Link To Movie Detail
- **Status**: proposed
- **Nguồn**: deeplink configuration follow-up (2026-05-19)
- **Mô tả**: Mở rộng từ `flixtor://app` sang deeplink trực tiếp tới `MovieDetailScreen` như `flixtor://movie/{slug}` để chia sẻ phim cụ thể thuận tiện hơn.
- **Files dự kiến**: `app/navigation/linking.ts`, `app/navigation/RootNavigator.tsx`, `app/features/movie/screens/MovieDetailScreen.tsx`
- **Priority**: medium

### Deep Link Resume Watch
- **Status**: proposed
- **Nguồn**: deeplink configuration follow-up (2026-05-19)
- **Mô tả**: Hỗ trợ deeplink mở thẳng `WatchScreen` kèm `episodeSlug` hoặc mốc resume để user quay lại đúng tập/phút đang xem từ thông báo hay chia sẻ nội bộ.
- **Files dự kiến**: `app/navigation/linking.ts`, `app/features/player/screens/WatchScreen.tsx`, `app/navigation/types.ts`
- **Priority**: medium

### Universal Links / App Links
- **Status**: proposed
- **Nguồn**: deeplink configuration follow-up (2026-05-19)
- **Mô tả**: Sau custom scheme, có thể bổ sung universal links/app links domain thật để link mở app mượt hơn từ web, email và social mà không phụ thuộc `flixtor://`.
- **Files dự kiến**: `ios/Flixtor/Flixtor.entitlements`, `ios/Flixtor/Info.plist`, `android/app/src/main/AndroidManifest.xml`, backend/domain association files
- **Priority**: medium

### In-App Change Password
- **Status**: proposed
- **Nguồn**: forgot/reset password flow follow-up (2026-05-19)
- **Mô tả**: Sau khi đã có forgot/reset password cho guest, có thể bổ sung màn đổi mật khẩu khi user đang đăng nhập để account settings đầy đủ hơn.
- **Files dự kiến**: `app/features/profile/screens/ProfileScreen.tsx`, `app/features/auth/services/authService.ts`, screen/settings auth liên quan
- **Priority**: medium

### Reset Password Expiry / Invalid Token UX
- **Status**: proposed
- **Nguồn**: forgot/reset password flow follow-up (2026-05-19)
- **Mô tả**: Nếu backend trả mã lỗi phân biệt token hết hạn và token sai, app có thể hiển thị CTA gửi lại email reset trực tiếp từ `ResetPasswordScreen` thay vì chỉ báo lỗi chung.
- **Files dự kiến**: `app/features/auth/services/authService.ts`, `app/features/auth/screens/ResetPasswordScreen.tsx`, `app/features/auth/screens/ForgotPasswordScreen.tsx`
- **Priority**: medium

### Reset Password Web Fallback Page
- **Status**: proposed
- **Nguồn**: forgot/reset password flow follow-up (2026-05-19)
- **Mô tả**: Bổ sung web page/fallback logic trên `link-flixtor.vercel.app` để giữ nguyên token, hướng dẫn mở app hoặc redirect mượt hơn khi người dùng chưa cài app.
- **Files dự kiến**: web/domain repo liên quan, `app/navigation/linking.ts`
- **Priority**: low

### Post-Login Redirect Targets
- **Status**: proposed
- **Nguồn**: auth stack navigation bugfix follow-up (2026-05-19)
- **Mô tả**: Cho phép `LoginScreen` nhận `redirectTo` hoặc snapshot route rõ ràng để sau đăng nhập app quay đúng màn đã mở flow auth thay vì chỉ suy luận từ stack hiện tại.
- **Files dự kiến**: `app/features/auth/screens/LoginScreen.tsx`, `app/navigation/types.ts`, các entry point mở login liên quan
- **Priority**: medium

### Shared Auth Flow Route Helper
- **Status**: proposed
- **Nguồn**: auth stack navigation bugfix follow-up (2026-05-19)
- **Mô tả**: Tách helper chung để xác định route auth/non-auth và cleanup stack sau login/logout/reset password, tránh lặp logic điều hướng ở nhiều màn hình.
- **Files dự kiến**: `app/navigation/`, `app/features/auth/screens/LoginScreen.tsx`, `app/features/auth/screens/ResetPasswordScreen.tsx`
- **Priority**: low

### Reset Password Success Auto-Redirect
- **Status**: proposed
- **Nguồn**: auth stack navigation bugfix follow-up (2026-05-19)
- **Mô tả**: Sau khi đổi mật khẩu thành công, có thể tự đếm ngược vài giây rồi đưa user về `Login` để giảm thao tác thừa mà vẫn giữ nút `Đăng nhập ngay`.
- **Files dự kiến**: `app/features/auth/screens/ResetPasswordScreen.tsx`
- **Priority**: low

### Google Sign-In Silent Restore
- **Status**: proposed
- **Nguồn**: Google Sign-In backend auth follow-up (2026-05-19)
- **Mô tả**: Nếu muốn trải nghiệm mượt hơn, app có thể dùng `hasPreviousSignIn()` hoặc `signInSilently()` để khôi phục Google account client-side và đồng bộ lại session backend mượt hơn khi user mở lại app.
- **Files dự kiến**: `app/features/auth/hooks/useAuthGoogle.ts`, `App.tsx`
- **Priority**: low

### Google Config Validation Checklist
- **Status**: proposed
- **Nguồn**: Google Sign-In backend auth follow-up (2026-05-19)
- **Mô tả**: Thêm tài liệu/checklist nội bộ về `webClientId`, SHA-1/SHA-256, reversed client id và config doctor để giảm thời gian debug các lỗi như `DEVELOPER_ERROR`.
- **Files dự kiến**: `docs/`, có thể kèm script/dev notes liên quan
- **Priority**: low

### Google Account Disconnect UX
- **Status**: proposed
- **Nguồn**: Google Sign-In backend auth follow-up (2026-05-19)
- **Mô tả**: Có thể thêm trạng thái/CTA rõ ràng trong `ProfileScreen` để user biết phiên hiện tại đến từ Google và chủ động ngắt liên kết hoặc đổi sang đăng nhập email sau này.
- **Files dự kiến**: `app/features/profile/screens/ProfileScreen.tsx`, `app/features/auth/store/authStore.ts`
- **Priority**: medium

### Shared Social Auth Loading Overlay
- **Status**: proposed
- **Nguồn**: Google login loading UX follow-up (2026-05-19)
- **Mô tả**: Tách loading box của social auth thành component dùng chung để sau này Google, Facebook hoặc Apple login đều có cùng trải nghiệm trạng thái nhiều bước.
- **Files dự kiến**: `app/features/auth/screens/LoginScreen.tsx`, `app/components/common/`
- **Priority**: low

### Google Login Retry CTA
- **Status**: proposed
- **Nguồn**: Google login loading UX follow-up (2026-05-19)
- **Mô tả**: Khi Google native sign-in thành công nhưng backend exchange lỗi, app có thể hiện CTA thử lại riêng cho bước đồng bộ Flixtor thay vì bắt user chọn lại tài khoản từ đầu.
- **Files dự kiến**: `app/features/auth/hooks/useAuthGoogle.ts`, `app/features/auth/screens/LoginScreen.tsx`
- **Priority**: medium

### Remote Maintenance Copy From Backend
- **Status**: proposed
- **Nguồn**: system-status gate follow-up (2026-05-20)
- **Mô tả**: Mở rộng payload `system-status` để backend trả thêm title/message/button text, giúp team vận hành đổi nội dung maintenance mà không cần cập nhật app.
- **Files dự kiến**: `app/services/api/systemService.ts`, `app/brand/BrandScreen.tsx`, `app/types/index.ts`
- **Priority**: medium

### Force Update Version Rules
- **Status**: proposed
- **Nguồn**: system-status gate follow-up (2026-05-20)
- **Mô tả**: Kết hợp `system-status` với `minSupportedVersion` và `latestVersion` để phân biệt maintenance tạm thời với luồng bắt buộc cập nhật app.
- **Files dự kiến**: `app/services/api/systemService.ts`, `App.tsx`, `app/brand/BrandScreen.tsx`, native/version utils liên quan
- **Priority**: high

### Manual Refresh Banner After Silent Recheck Failure
- **Status**: proposed
- **Nguồn**: system-status gate follow-up (2026-05-20)
- **Mô tả**: Khi app đang mở bình thường nhưng lần re-check lúc resume bị lỗi mạng, có thể hiện banner nhỏ cho phép user tự thử lại thay vì chỉ log nền.
- **Files dự kiến**: `App.tsx`, `app/components/common/`, `app/services/api/systemService.ts`
- **Priority**: medium

### System Status Hook Tests
- **Status**: proposed
- **Nguồn**: system-status hook refactor follow-up (2026-05-20)
- **Mô tả**: Thêm unit/integration test cho `useSystemStatus` để cover các case blocked true, fallback network error, response sai format và foreground re-check.
- **Files dự kiến**: `app/hooks/useSystemStatus.ts`, test setup cho hooks liên quan
- **Priority**: medium

### Persist Last Successful System Status Snapshot
- **Status**: proposed
- **Nguồn**: system-status hook refactor follow-up (2026-05-20)
- **Mô tả**: Lưu snapshot `system-status` gần nhất vào storage để app có thể quyết định UX tốt hơn khi mở app trong tình huống mạng chập chờn.
- **Files dự kiến**: `app/hooks/useSystemStatus.ts`, `app/utils/storage.ts`, `app/types/index.ts`
- **Priority**: low

### Configurable Foreground Recheck Cooldown
- **Status**: proposed
- **Nguồn**: system-status hook refactor follow-up (2026-05-20)
- **Mô tả**: Cho phép cấu hình cooldown re-check khi app resume từ remote config hoặc env để team vận hành cân bằng giữa độ phản ứng và số lượng request.
- **Files dự kiến**: `app/hooks/useSystemStatus.ts`, `app/config/env.ts`, có thể thêm remote config layer sau này
- **Priority**: low

### Clean Track Player Patch Package
- **Status**: proposed
- **Nguồn**: iOS build fix follow-up (2026-06-21)
- **Mô tả**: Dọn lại `patches/react-native-track-player+4.1.2.patch` để chỉ giữ source changes cần thiết thay vì build artifacts, giúp `postinstall` không còn báo lỗi và mọi clean install ổn định hơn.
- **Files dự kiến**: `patches/react-native-track-player+4.1.2.patch`, `node_modules/react-native-track-player/*` khi regenerate patch
- **Priority**: high

### iOS Smoke Build Command
- **Status**: proposed
- **Nguồn**: iOS build fix follow-up (2026-06-21)
- **Mô tả**: Thêm một lệnh build simulator tối thiểu cho iOS để phát hiện sớm lỗi native compile sau khi nâng dependency như React Navigation hoặc React Native libraries.
- **Files dự kiến**: `package.json`, có thể thêm `docs/` hoặc CI config liên quan
- **Priority**: medium

### Navigation Runtime Smoke Test
- **Status**: proposed
- **Nguồn**: react-navigation runtime fix follow-up (2026-06-21)
- **Mô tả**: Tạo một bước smoke test cho luồng mount `RootNavigator`, chuyển tab và push `native-stack` để phát hiện sớm các lỗi runtime kiểu `ActivityView` sau mỗi lần nâng dependency navigation hoặc React Native.
- **Files dự kiến**: `docs/`, có thể thêm `package.json` hoặc e2e test setup nếu repo bổ sung automation
- **Priority**: medium

### React Native 0.83 Upgrade Prep
- **Status**: proposed
- **Nguồn**: iOS build fix follow-up (2026-06-21)
- **Mô tả**: Lên kế hoạch nâng React Native khỏi `0.81.5` để bỏ các patch tương thích tạm thời cho React Navigation 8 alpha và giảm chênh lệch API Fabric/new architecture.
- **Files dự kiến**: `package.json`, `ios/`, `android/`, các patch trong `patches/`
- **Priority**: high
