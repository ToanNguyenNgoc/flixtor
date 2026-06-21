import { Alert, AppState, Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import DeviceInfo from 'react-native-device-info';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { getMovieDetail } from '@/services/api/phimApi';
import type { DownloadItem, DownloadQualityOption, DownloadRequestPayload } from '@/types';
import { getAllEpisodes, getCurrentEpisode, getEpisodeSource } from '@/utils/episode';
import {
  buildOfflineManifest,
  fetchText,
  getHlsDownloadQualities,
  type HlsMediaPlaylist,
  parseMasterPlaylist,
  parseMediaPlaylist,
} from '@/utils/m3u8';
import { useDownloadStore } from '../store/downloadStore';

const BASE_DIR = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/downloads`;
const NOTIFICATION_CHANNEL_ID = 'download-progress';
const MAX_CONCURRENT_DOWNLOADS = 2;
const SEGMENT_CONCURRENCY = 3;
const PROGRESS_UPDATE_THROTTLE_MS = 400;
const NETWORK_WAIT_RETRY_MS = 20_000;

interface CancellableTask {
  cancel: (callback?: () => void) => void;
}

class ManagedDownloadError extends Error {
  constructor(
    public readonly code: 'paused' | 'cancelled' | 'network' | 'protected' | 'generic',
    message: string,
  ) {
    super(message);
  }
}

function sanitizePathPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, '_');
}

export function buildDownloadId(movieSlug: string, episodeSlug?: string, serverName?: string): string {
  return [movieSlug, episodeSlug || 'full', serverName || 'default'].join('::');
}

export function getDownloadStatusLabel(item?: DownloadItem): string {
  if (!item) return 'Tải xuống';

  switch (item.status) {
    case 'queued':
      return 'Đang chờ tải';
    case 'downloading':
      return `Đang tải ${item.downloadProgress}%`;
    case 'paused':
      return `Đã tạm dừng ${item.downloadProgress}%`;
    case 'completed':
      return 'Đã tải';
    case 'failed':
      return 'Tải lỗi';
    case 'cancelled':
      return 'Đã hủy';
    case 'waiting_for_network':
      return 'Đang chờ mạng';
    default:
      return 'Tải xuống';
  }
}

function getEstimatedSize(duration: number, bandwidth?: number): number | undefined {
  if (!duration || !bandwidth) return undefined;
  return Math.round((duration * bandwidth) / 8);
}

export class DownloadManager {
  private static instance: DownloadManager;
  private readonly activeDownloadIds = new Set<string>();
  private readonly activeTasks = new Map<string, Set<CancellableTask>>();
  private readonly pauseRequests = new Set<string>();
  private readonly cancelRequests = new Set<string>();
  private readonly progressTimestamps = new Map<string, number>();
  private bootstrapped = false;
  private retryTimer?: ReturnType<typeof setInterval>;
  private appStateSubscription?: { remove: () => void };

  private constructor() {}

  public static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager();
    }
    return DownloadManager.instance;
  }

  public async bootstrap(): Promise<void> {
    if (this.bootstrapped) return;
    this.bootstrapped = true;

    await this.ensureBaseDir();
    await this.createNotificationChannel();
    await this.recoverPersistedDownloads();
    this.processQueue();

    this.retryTimer = setInterval(() => {
      this.resumeWaitingDownloads();
    }, NETWORK_WAIT_RETRY_MS);

    this.appStateSubscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        this.resumeWaitingDownloads();
        this.processQueue();
      }
    });
  }

  public async getQualityOptions(sourceUrl: string): Promise<DownloadQualityOption[]> {
    const options = await getHlsDownloadQualities(sourceUrl);
    const enriched = await Promise.all(options.map(async option => {
      if (!option.bandwidth) return option;
      try {
        const mediaText = await fetchText(option.uri);
        const media = parseMediaPlaylist(mediaText, option.uri);
        return {
          ...option,
          estimatedSizeBytes: getEstimatedSize(media.totalDuration, option.bandwidth),
        };
      } catch (_) {
        return option;
      }
    }));
    return enriched;
  }

  public async startDownload(payload: DownloadRequestPayload): Promise<string> {
    const id = buildDownloadId(payload.movieSlug, payload.episodeSlug, payload.serverName);
    const store = useDownloadStore.getState();
    const existing = store.getDownload(id);
    const now = Date.now();

    if (existing?.status === 'completed') {
      return id;
    }

    const item: DownloadItem = {
      id,
      movieId: payload.movieId,
      movieSlug: payload.movieSlug,
      episodeId: payload.episodeId,
      episodeSlug: payload.episodeSlug,
      title: payload.title,
      episodeTitle: payload.episodeTitle,
      posterUrl: payload.posterUrl,
      backdropUrl: payload.backdropUrl,
      duration: payload.duration,
      quality: payload.quality?.label ?? 'Auto',
      qualityUri: payload.quality?.uri ?? payload.sourceUrl,
      qualityBandwidth: payload.quality?.bandwidth,
      qualityResolution: payload.quality?.resolution,
      sourceUrl: payload.sourceUrl,
      sourceType: 'hls',
      serverName: payload.serverName,
      totalSegments: existing?.totalSegments ?? 0,
      downloadedSegments: existing?.downloadedSegments ?? 0,
      downloadProgress: existing?.downloadProgress ?? 0,
      fileSize: existing?.fileSize,
      status: 'queued',
      errorMessage: undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      localFolderPath: existing?.localFolderPath,
      localPlaylistPath: existing?.localPlaylistPath,
      downloadedAt: existing?.downloadedAt,
    };

    store.addDownload(item);
    store.updateStatus(id, 'queued', item);
    this.processQueue();
    return id;
  }

  public async pauseDownload(id: string): Promise<void> {
    this.pauseRequests.add(id);
    this.cancelActiveTasks(id);
    useDownloadStore.getState().updateStatus(id, 'paused');
    await this.updateNotificationForStatus(id);
    this.processQueue();
  }

  public async resumeDownload(id: string): Promise<void> {
    this.pauseRequests.delete(id);
    this.cancelRequests.delete(id);
    useDownloadStore.getState().updateStatus(id, 'queued', { errorMessage: undefined });
    this.processQueue();
  }

  public async retryDownload(id: string): Promise<void> {
    const item = useDownloadStore.getState().getDownload(id);
    if (!item) return;

    useDownloadStore.getState().updateStatus(id, 'queued', {
      errorMessage: undefined,
      downloadedAt: undefined,
    });
    await this.resumeDownload(id);
  }

  public async cancelDownload(id: string): Promise<void> {
    this.cancelRequests.add(id);
    this.pauseRequests.delete(id);
    this.cancelActiveTasks(id);
    useDownloadStore.getState().updateStatus(id, 'cancelled');
    await this.updateNotificationForStatus(id);
    this.processQueue();
  }

  public async deleteDownload(id: string): Promise<void> {
    const store = useDownloadStore.getState();
    const item = store.getDownload(id);
    if (!item) return;

    this.cancelRequests.add(id);
    this.cancelActiveTasks(id);

    if (item.localFolderPath) {
      const exists = await ReactNativeBlobUtil.fs.exists(item.localFolderPath);
      if (exists) {
        await ReactNativeBlobUtil.fs.unlink(item.localFolderPath);
      }
    }

    await notifee.cancelNotification(id).catch(() => undefined);
    store.removeDownload(id);
    this.processQueue();
  }

  public async ensureOfflinePlayable(id: string): Promise<boolean> {
    const item = useDownloadStore.getState().getDownload(id);
    if (!item?.localPlaylistPath) return false;
    return ReactNativeBlobUtil.fs.exists(item.localPlaylistPath);
  }

  public async getTotalDownloadedSize(): Promise<number> {
    const items = useDownloadStore.getState().getAll();
    return items.reduce((sum, item) => sum + (item.fileSize ?? 0), 0);
  }

  public async getFreeDiskBytes(): Promise<number> {
    return DeviceInfo.getFreeDiskStorage();
  }

  public async showDeleteConfirmation(id: string, onConfirm: () => void): Promise<void> {
    const item = useDownloadStore.getState().getDownload(id);
    Alert.alert(
      'Xóa bản tải',
      item?.status === 'downloading'
        ? 'Tải xuống đang chạy sẽ bị hủy và xóa khỏi thiết bị.'
        : 'Toàn bộ file offline của phim này sẽ bị xóa khỏi thiết bị.',
      [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: onConfirm },
      ],
    );
  }

  private async recoverPersistedDownloads(): Promise<void> {
    const store = useDownloadStore.getState();
    const items = store.getAll();

    await Promise.all(items.map(async item => {
      if (item.status === 'completed') {
        const playable = await this.ensureOfflinePlayable(item.id);
        if (!playable) {
          store.updateStatus(item.id, 'failed', {
            errorMessage: 'File offline không còn tồn tại trên thiết bị.',
          });
        }
        return;
      }

      if (item.status === 'downloading' || item.status === 'waiting_for_network') {
        store.updateStatus(item.id, 'paused');
      }
    }));
  }

  private async ensureBaseDir(): Promise<void> {
    const exists = await ReactNativeBlobUtil.fs.exists(BASE_DIR);
    if (!exists) {
      await ReactNativeBlobUtil.fs.mkdir(BASE_DIR);
    }
  }

  private async createNotificationChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Downloads',
      importance: AndroidImportance.LOW,
    });
  }

  private processQueue(): void {
    const store = useDownloadStore.getState();
    const queue = store.getAll()
      .filter(item => ['queued', 'waiting_for_network'].includes(item.status))
      .sort((a, b) => a.createdAt - b.createdAt);

    while (this.activeDownloadIds.size < MAX_CONCURRENT_DOWNLOADS && queue.length > 0) {
      const next = queue.shift();
      if (!next || this.activeDownloadIds.has(next.id)) continue;
      if (next.status === 'waiting_for_network') continue;
      this.runDownload(next.id);
    }
  }

  private async runDownload(id: string): Promise<void> {
    if (this.activeDownloadIds.has(id)) return;
    this.activeDownloadIds.add(id);

    try {
      await this.downloadItem(id);
    } finally {
      this.activeDownloadIds.delete(id);
      this.activeTasks.delete(id);
      this.pauseRequests.delete(id);
      this.cancelRequests.delete(id);
      this.progressTimestamps.delete(id);
      this.processQueue();
    }
  }

  private async downloadItem(id: string): Promise<void> {
    const store = useDownloadStore.getState();
    const item = store.getDownload(id);
    if (!item) return;

    const folderPath = item.localFolderPath || `${BASE_DIR}/${sanitizePathPart(item.movieSlug)}/${sanitizePathPart(item.episodeSlug || 'full')}_${sanitizePathPart(item.serverName || 'default')}`;
    await this.ensureNestedDir(folderPath);

    store.updateStatus(id, 'downloading', {
      localFolderPath: folderPath,
      errorMessage: undefined,
    });
    await this.updateNotificationForStatus(id);

    try {
      const playlist = await this.resolvePlaylistForItem(store.getDownload(id) ?? item);
      if (playlist.segments.length === 0) {
        throw new ManagedDownloadError('generic', 'Playlist không có segment nào để tải.');
      }

      const freeDisk = await this.getFreeDiskBytes();
      const estimatedSize = getEstimatedSize(playlist.totalDuration, item.qualityBandwidth);
      if (estimatedSize && freeDisk > 0 && estimatedSize > freeDisk) {
        throw new ManagedDownloadError('generic', 'Không đủ dung lượng lưu trữ.');
      }

      const fileNames = playlist.segments.map((_: { duration: number; uri: string; sequence: number }, index: number) => `segment_${index}.ts`);
      let downloadedSegments = await this.countExistingSegments(folderPath, fileNames);
      this.updateProgress(id, playlist.segments.length, downloadedSegments);

      for (let index = 0; index < playlist.segments.length; index += SEGMENT_CONCURRENCY) {
        this.throwIfInterrupted(id);

        const batch = playlist.segments.slice(index, index + SEGMENT_CONCURRENCY);
        await Promise.all(batch.map(async (
          segment: { duration: number; uri: string; sequence: number },
          batchOffset: number,
        ) => {
          const currentIndex = index + batchOffset;
          const fileName = fileNames[currentIndex];
          const destination = `${folderPath}/${fileName}`;

          const exists = await ReactNativeBlobUtil.fs.exists(destination);
          if (exists) return;

          await this.downloadSegment(id, segment.uri, destination);
        }));

        downloadedSegments = await this.countExistingSegments(folderPath, fileNames);
        this.updateProgress(id, playlist.segments.length, downloadedSegments);
      }

      const manifestPath = `${folderPath}/playlist.m3u8`;
      const offlineManifest = buildOfflineManifest(playlist, fileNames);
      await ReactNativeBlobUtil.fs.writeFile(manifestPath, offlineManifest, 'utf8');

      const totalSize = await this.measureFolderSize(folderPath);
      store.updateStatus(id, 'completed', {
        localFolderPath: folderPath,
        localPlaylistPath: manifestPath,
        totalSegments: playlist.segments.length,
        downloadedSegments: playlist.segments.length,
        downloadProgress: 100,
        fileSize: totalSize,
      });
      await this.updateNotificationForStatus(id);
    } catch (error) {
      if (error instanceof ManagedDownloadError) {
        if (error.code === 'paused') {
          store.updateStatus(id, 'paused');
        } else if (error.code === 'cancelled') {
          store.updateStatus(id, 'cancelled');
        } else if (error.code === 'network') {
          store.updateStatus(id, 'waiting_for_network', { errorMessage: error.message });
        } else {
          store.updateStatus(id, 'failed', { errorMessage: error.message });
        }
      } else {
        store.updateStatus(id, 'failed', {
          errorMessage: error instanceof Error ? error.message : 'Không thể tải nội dung offline.',
        });
      }
      await this.updateNotificationForStatus(id);
    }
  }

  private async resolvePlaylistForItem(item: DownloadItem, hasRetried = false): Promise<HlsMediaPlaylist> {
    try {
      const sourceText = await fetchText(item.qualityUri || item.sourceUrl);
      const master = parseMasterPlaylist(sourceText, item.sourceUrl);

      if (master.hasProtectedContent) {
        throw new ManagedDownloadError(
          'protected',
          'Nguồn phát có bảo vệ nội dung và không hỗ trợ tải xuống offline.',
        );
      }

      const selectedUri = item.qualityUri || master.qualities[0]?.uri || item.sourceUrl;
      const mediaText = selectedUri === item.sourceUrl && master.qualities.length === 1
        ? sourceText
        : await fetchText(selectedUri);

      return parseMediaPlaylist(mediaText, selectedUri);
    } catch (error) {
      if (!hasRetried) {
        const refreshed = await this.refreshSourceUrl(item.id);
        if (refreshed) {
          const freshItem = useDownloadStore.getState().getDownload(item.id);
          if (freshItem) {
            return this.resolvePlaylistForItem(freshItem, true);
          }
        }
      }

      if (error instanceof ManagedDownloadError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Không thể tải playlist.';
      if (/network|timed out|Failed to fetch|request/i.test(message)) {
        throw new ManagedDownloadError('network', 'Mất kết nối mạng khi tải phim.');
      }

      throw new ManagedDownloadError('generic', message);
    }
  }

  private async refreshSourceUrl(id: string): Promise<boolean> {
    const store = useDownloadStore.getState();
    const item = store.getDownload(id);
    if (!item) return false;

    try {
      const detail = await getMovieDetail(item.movieSlug);
      const episodes = getAllEpisodes(detail.episodes ?? []);
      const episode = getCurrentEpisode(episodes, item.episodeSlug, item.serverName);
      const source = getEpisodeSource(episode);

      if (source.type !== 'm3u8' || !source.uri) {
        return false;
      }

      store.updateDownload(id, {
        sourceUrl: source.uri,
        qualityUri: source.uri,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  private async downloadSegment(id: string, url: string, destination: string): Promise<void> {
    this.throwIfInterrupted(id);

    const task = ReactNativeBlobUtil.config({ path: destination }).fetch('GET', url) as unknown as CancellableTask & {
      info?: () => { status: number };
      then?: unknown;
    };

    this.registerTask(id, task);

    try {
      const response = await (task as unknown as Promise<{ info: () => { status: number } }>);
      const status = response.info().status;
      if (status >= 400) {
        throw new ManagedDownloadError('generic', `Không thể tải segment (${status}).`);
      }
    } catch (error) {
      await ReactNativeBlobUtil.fs.unlink(destination).catch(() => undefined);

      if (this.pauseRequests.has(id)) {
        throw new ManagedDownloadError('paused', 'Download đã được tạm dừng.');
      }
      if (this.cancelRequests.has(id)) {
        throw new ManagedDownloadError('cancelled', 'Download đã bị hủy.');
      }

      const message = error instanceof Error ? error.message : 'Không thể tải segment.';
      if (/network|timed out|Failed to fetch|cancelled/i.test(message)) {
        throw new ManagedDownloadError('network', 'Mạng bị gián đoạn trong lúc tải xuống.');
      }
      throw error;
    } finally {
      this.unregisterTask(id, task);
    }
  }

  private updateProgress(id: string, totalSegments: number, downloadedSegments: number): void {
    const progress = totalSegments > 0 ? Math.round((downloadedSegments / totalSegments) * 100) : 0;
    useDownloadStore.getState().updateDownload(id, {
      totalSegments,
      downloadedSegments,
      downloadProgress: progress,
    });

    const now = Date.now();
    const last = this.progressTimestamps.get(id) ?? 0;
    if (now - last >= PROGRESS_UPDATE_THROTTLE_MS || progress >= 100) {
      this.progressTimestamps.set(id, now);
      this.updateNotificationForStatus(id);
    }
  }

  private throwIfInterrupted(id: string): void {
    if (this.cancelRequests.has(id)) {
      throw new ManagedDownloadError('cancelled', 'Download đã bị hủy.');
    }
    if (this.pauseRequests.has(id)) {
      throw new ManagedDownloadError('paused', 'Download đã được tạm dừng.');
    }
  }

  private registerTask(id: string, task: CancellableTask): void {
    if (!this.activeTasks.has(id)) {
      this.activeTasks.set(id, new Set());
    }
    this.activeTasks.get(id)?.add(task);
  }

  private unregisterTask(id: string, task: CancellableTask): void {
    this.activeTasks.get(id)?.delete(task);
  }

  private cancelActiveTasks(id: string): void {
    this.activeTasks.get(id)?.forEach(task => {
      try {
        task.cancel();
      } catch (_) {
        // noop
      }
    });
  }

  private async updateNotificationForStatus(id: string): Promise<void> {
    if (Platform.OS !== 'android') return;

    const item = useDownloadStore.getState().getDownload(id);
    if (!item) {
      await notifee.cancelNotification(id).catch(() => undefined);
      return;
    }

    const title = item.episodeTitle ? `${item.title} • ${item.episodeTitle}` : item.title;
    const body = getDownloadStatusLabel(item);
    const progress = Math.max(0, Math.min(item.downloadProgress, 100));
    const isOngoing = item.status === 'downloading' || item.status === 'queued' || item.status === 'waiting_for_network';

    await notifee.displayNotification({
      id,
      title,
      body,
      android: {
        channelId: NOTIFICATION_CHANNEL_ID,
        ongoing: isOngoing,
        onlyAlertOnce: true,
        smallIcon: 'ic_launcher',
        progress: {
          max: 100,
          current: progress,
        },
        pressAction: {
          id: 'default',
        },
      },
    }).catch(() => undefined);
  }

  private async countExistingSegments(folderPath: string, fileNames: string[]): Promise<number> {
    const checks = await Promise.all(fileNames.map(fileName => ReactNativeBlobUtil.fs.exists(`${folderPath}/${fileName}`)));
    return checks.filter(Boolean).length;
  }

  private async measureFolderSize(folderPath: string): Promise<number> {
    const files = await ReactNativeBlobUtil.fs.ls(folderPath);
    const stats = await Promise.all(files.map(async file => {
      const filePath = `${folderPath}/${file}`;
      const stat = await ReactNativeBlobUtil.fs.stat(filePath);
      return typeof stat.size === 'number' ? stat.size : parseInt(stat.size, 10) || 0;
    }));
    return stats.reduce((sum, value) => sum + value, 0);
  }

  private async ensureNestedDir(folderPath: string): Promise<void> {
    const parts = folderPath.replace(`${BASE_DIR}/`, '').split('/');
    let current = BASE_DIR;
    for (const part of parts) {
      current = `${current}/${part}`;
      const exists = await ReactNativeBlobUtil.fs.exists(current);
      if (!exists) {
        await ReactNativeBlobUtil.fs.mkdir(current);
      }
    }
  }

  private resumeWaitingDownloads(): void {
    const store = useDownloadStore.getState();
    const waitingItems = store.getAll().filter(item => item.status === 'waiting_for_network');
    if (waitingItems.length === 0) return;

    waitingItems.forEach(item => {
      store.updateStatus(item.id, 'queued', { errorMessage: undefined });
    });
    this.processQueue();
  }
}

export const downloadManager = DownloadManager.getInstance();
