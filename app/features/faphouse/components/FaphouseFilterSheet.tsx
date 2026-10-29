import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Spacing, Typography } from '@/config/theme';
import type {
  FaphouseActor,
  FaphouseCountry,
  FaphouseFilterState,
  FaphouseGenre,
  FaphouseSort,
} from '../types';

export const DEFAULT_FAPHOUSE_FILTER: FaphouseFilterState = {
  genre: '',
  country: '',
  actor: '',
  sort: 'latest',
};

export const FAPHOUSE_SORT_OPTIONS: ChipOption[] = [
  { label: 'Mới nhất', value: 'latest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Năm giảm dần', value: 'year_desc' },
  { label: 'Năm tăng dần', value: 'year_asc' },
];

interface ChipOption {
  label: string;
  value: string;
}

interface ChipGroupProps {
  label: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  /** Hiện chip "Tất cả" (value rỗng) ở đầu hàng. */
  allowAll?: boolean;
}

interface FaphouseFilterSheetProps {
  currentFilter: FaphouseFilterState;
  genres: FaphouseGenre[];
  countries: FaphouseCountry[];
  actors: FaphouseActor[];
  onApply: (filter: FaphouseFilterState) => void;
}

export interface FaphouseFilterSheetHandle {
  open: () => void;
  close: () => void;
}

function BottomSheetModalContainer({ children }: React.PropsWithChildren) {
  if (Platform.OS === 'ios') {
    return <FullWindowOverlay>{children}</FullWindowOverlay>;
  }

  return <>{children}</>;
}

function ChipGroup({ label, options, value, onChange, allowAll = true }: ChipGroupProps) {
  if (!options.length) {
    return null;
  }

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
        {allowAll && (
          <TouchableOpacity
            style={[styles.chip, !value && styles.chipActive]}
            onPress={() => onChange('')}
          >
            <Text style={[styles.chipText, !value && styles.chipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
        )}
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, value === option.value && styles.chipActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.chipText, value === option.value && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const FaphouseFilterSheet = forwardRef<FaphouseFilterSheetHandle, FaphouseFilterSheetProps>(
  function FaphouseFilterSheetComponent({
    currentFilter,
    genres,
    countries,
    actors,
    onApply,
  }, ref) {
    const bottomSheetRef = useRef<React.ElementRef<typeof BottomSheetModal>>(null);
    const insets = useSafeAreaInsets();
    const [local, setLocal] = useState<FaphouseFilterState>(currentFilter);
    const snapPoints = useMemo(() => [480], []);
    const actionsBottomPadding = Math.max(insets.bottom, Spacing.base);

    const genreOptions = useMemo(
      () => genres.map(item => ({ label: item.name, value: item.slug })),
      [genres],
    );
    const countryOptions = useMemo(
      () => countries.map(item => ({ label: item.name, value: item.slug })),
      [countries],
    );
    const actorOptions = useMemo(
      () => actors.map(item => ({ label: item.name, value: item.slug })),
      [actors],
    );

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
      setLocal(currentFilter);
      bottomSheetRef.current?.present();
    }, [currentFilter]);

    const close = useCallback(() => {
      bottomSheetRef.current?.dismiss();
    }, []);

    useImperativeHandle(ref, () => ({ open, close }), [close, open]);

    const handleApply = useCallback((filter: FaphouseFilterState) => {
      onApply(filter);
      close();
    }, [close, onApply]);

    const handleClear = useCallback(() => {
      setLocal(DEFAULT_FAPHOUSE_FILTER);
      handleApply(DEFAULT_FAPHOUSE_FILTER);
    }, [handleApply]);

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
            label="Thể loại"
            options={genreOptions}
            value={local.genre}
            onChange={value => setLocal(prev => ({ ...prev, genre: value }))}
          />
          <ChipGroup
            label="Quốc gia"
            options={countryOptions}
            value={local.country}
            onChange={value => setLocal(prev => ({ ...prev, country: value }))}
          />
          <ChipGroup
            label="Diễn viên"
            options={actorOptions}
            value={local.actor}
            onChange={value => setLocal(prev => ({ ...prev, actor: value }))}
          />
          <ChipGroup
            label="Sắp xếp"
            options={FAPHOUSE_SORT_OPTIONS}
            value={local.sort}
            allowAll={false}
            onChange={value => setLocal(prev => ({
              ...prev,
              sort: (value || 'latest') as FaphouseSort,
            }))}
          />

          <View style={[styles.actions, { paddingBottom: actionsBottomPadding }]}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearText}>Xóa lọc</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => handleApply(local)}>
              <Text style={styles.applyText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

export default FaphouseFilterSheet;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: Colors.backgroundElevated,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: { flex: 1 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  scrollContent: { paddingBottom: Spacing.sm },
  group: { marginBottom: Spacing.lg, paddingLeft: Spacing.base },
  groupLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScrollContent: { paddingRight: Spacing.base },
  chip: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm },
  chipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  clearBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  clearText: { color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  applyBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  applyText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.base,
  },
});
