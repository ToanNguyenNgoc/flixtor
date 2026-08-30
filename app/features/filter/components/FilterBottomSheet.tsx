import React, {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { KKCategory, KKCountry } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';
import { MOVIE_TYPE_LIST } from '@/services/api/endpoints';

const YEAR_OPTIONS = (() => {
  const years: string[] = [];
  for (let y = new Date().getFullYear(); y >= 2010; y--) years.push(String(y));
  return years;
})();

const LANG_OPTIONS = [
  { label: 'Vietsub', value: 'vietsub' },
  { label: 'Thuyết minh', value: 'thuyet-minh' },
  { label: 'Lồng tiếng', value: 'long-tieng' },
];

const SORT_OPTIONS = [
  { label: 'Mới cập nhật', value: 'modified.time' },
  { label: 'Mới nhất', value: '_id' },
  { label: 'Năm phát hành', value: 'year' },
];

const TYPE_OPTIONS = [
  { label: 'Phim bộ', value: MOVIE_TYPE_LIST.PHIM_BO },
  { label: 'Phim lẻ', value: MOVIE_TYPE_LIST.PHIM_LE },
  { label: 'TV Shows', value: MOVIE_TYPE_LIST.TV_SHOWS },
  { label: 'Hoạt hình', value: MOVIE_TYPE_LIST.HOAT_HINH },
  { label: 'Vietsub', value: MOVIE_TYPE_LIST.PHIM_VIETSUB },
  { label: 'Thuyết minh', value: MOVIE_TYPE_LIST.PHIM_THUYET_MINH },
  { label: 'Lồng tiếng', value: MOVIE_TYPE_LIST.PHIM_LONG_TIENG },
];

interface FilterBottomSheetProps {
  onApply: (filter: Record<string, string>) => void;
  currentFilter: Record<string, string | undefined>;
  categories: KKCategory[];
  countries: KKCountry[];
}

export interface FilterBottomSheetHandle {
  open: () => void;
  close: () => void;
}

interface ChipOption {
  label: string;
  value: string;
}

interface ChipGroupProps {
  label: string;
  options: ChipOption[];
  value?: string;
  onChange: (v: string) => void;
}

function BottomSheetModalContainer({
  children,
}: React.PropsWithChildren) {
  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        {children}
      </FullWindowOverlay>
    );
  }

  return <>{children}</>;
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScrollContent}
      >
        <TouchableOpacity
          style={[styles.chip, !value && styles.chipActive]}
          onPress={() => onChange('')}
        >
          <Text style={[styles.chipText, !value && styles.chipTextActive]}>Tất cả</Text>
        </TouchableOpacity>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, value === opt.value && styles.chipActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const FilterBottomSheet = forwardRef<FilterBottomSheetHandle, FilterBottomSheetProps>(function FilterBottomSheetComponent({
  onApply,
  currentFilter,
  categories,
  countries,
}, ref) {
  const bottomSheetRef = useRef<React.ElementRef<typeof BottomSheetModal>>(null);
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState({ ...currentFilter });
  const snapPoints = useMemo(() => [580], []);
  const actionsBottomPadding = Math.max(insets.bottom, Spacing.base);

  const set = (key: string, value: string) => setLocal(f => ({ ...f, [key]: value }));
  const clearedFilter = useMemo(() => ({
    typeList: MOVIE_TYPE_LIST.PHIM_BO,
    category: '',
    country: '',
    year: '',
    lang: '',
    sortField: 'modified.time',
  }), []);

  const categoryOptions = categories.map(c => ({ label: c.name, value: c.slug }));
  const countryOptions = countries.map(c => ({ label: c.name, value: c.slug }));

  const renderBackdrop = useCallback((props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.5}
      pressBehavior="close"
    />
  ), []);

  const open = useCallback(() => {
    setLocal({ ...currentFilter });
    bottomSheetRef.current?.present();
  }, [currentFilter]);

  const close = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  useImperativeHandle(ref, () => ({ open, close }), [close, open]);

  const handleApply = useCallback((filter: Record<string, string>) => {
    onApply(filter);
    close();
  }, [close, onApply]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      containerComponent={BottomSheetModalContainer}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Bộ lọc phim</Text>

        <ChipGroup
          label="Loại phim"
          options={TYPE_OPTIONS}
          value={local.typeList ?? ''}
          onChange={v => set('typeList', v)}
        />
        <ChipGroup
          label="Thể loại"
          options={categoryOptions}
          value={local.category ?? ''}
          onChange={v => set('category', v)}
        />
        <ChipGroup
          label="Quốc gia"
          options={countryOptions}
          value={local.country ?? ''}
          onChange={v => set('country', v)}
        />
        <ChipGroup
          label="Năm phát hành"
          options={YEAR_OPTIONS.map(y => ({ label: y, value: y }))}
          value={local.year ?? ''}
          onChange={v => set('year', v)}
        />
        <ChipGroup
          label="Ngôn ngữ"
          options={LANG_OPTIONS}
          value={local.lang ?? ''}
          onChange={v => set('lang', v)}
        />
        <ChipGroup
          label="Sắp xếp"
          options={SORT_OPTIONS}
          value={local.sortField ?? ''}
          onChange={v => set('sortField', v)}
        />

        <View style={[styles.actions, { paddingBottom: actionsBottomPadding }]}>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setLocal(clearedFilter);
              handleApply(clearedFilter);
            }}
          >
            <Text style={styles.clearText}>Xóa lọc</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={() => handleApply(local as Record<string, string>)}>
            <Text style={styles.applyText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default FilterBottomSheet;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: Colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold,
    color: Colors.text, paddingHorizontal: Spacing.base, marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  scrollContent: { paddingBottom: Spacing.sm },
  group: { marginBottom: Spacing.lg, paddingLeft: Spacing.base },
  groupLabel: {
    color: Colors.textSecondary, fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chipScrollContent: { paddingRight: Spacing.base },
  chip: {
    backgroundColor: Colors.background, borderRadius: 20,
    paddingHorizontal: Spacing.md, paddingVertical: 6, marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm },
  chipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
  actions: {
    flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  clearBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: 'center',
  },
  clearText: { color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  applyBtn: {
    flex: 2, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: 'center',
  },
  applyText: { color: Colors.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base },
});
