import { Platform, Linking } from 'react-native';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import dayjs from 'dayjs';
import { navigate } from '@/navigator';

export enum notificationType {
  USER_PUSH = -1,
  CHECK_IN = 1,
  CONTACT = 2,
  BOOKING = 3,
  REVIEW = 4,
  ORDER_SALE = 5,
  APPOINTMENT = 6,
  STAFF_RECEIVE_COMMISSION = 7,
  BRANCH_TRANSFER = 11,
  OUT_OF_STOCK = 12,
  EXPIRY_WARNING = 13,
  ANNOUCEMENT_PROMO = 14,
  SHIP_CODE = 15,
  PROMOTION = 16,
  ORGANIZATION = 17,
  DEAL = 18,
  DEAL_DETAIL = 19,
  ORDER_CUSTOMER = 35,
  MESSENGER = 20,
  BEAUTYX_OA = 100,
  WALLET = 22,
  CI_UPDATE_APPOINTMENT = 'CI_UPDATE_APPOINTMENT',
  CAMPAIGN = 'CAMPAIGN',
  USE_GIFT = 'USE_GIFT',
}

type NotifyData = Record<string, any>;

export class NotificationHelper {
  private static instance: NotificationHelper;

  static openedFromNotification = false;
  static openingApp = false;

  private unsubscribeOnMessage?: () => void;
  private unsubscribeNotifeeForeground?: () => void;
  private unsubscribeOpenedApp?: () => void;

  private constructor() { }

  static resetStack() {
    NotificationHelper.openedFromNotification = false;
  }

  static getInstance(): NotificationHelper {
    if (!NotificationHelper.instance) {
      NotificationHelper.instance = new NotificationHelper();
    }
    return NotificationHelper.instance;
  }

  private debugLog(...args: any[]) {
    // bật/tắt tuỳ bạn
    console.log('[NotificationHelper]', ...args);
  }

  // -------------------------
  // Init / Run
  // -------------------------
  async run(): Promise<void> {
    this.debugLog('run() start');

    // 1) Notifee permission + channel
    await this.ensureDefaultChannel();
    await this.requestNotifeePermission();

    // 2) FCM permission (iOS) + register remote messages
    await this.requestFCMPermission();

    // 3) Token + base topic
    const hasToken = await this.checkToken();

    // 4) Listeners
    // Foreground message => Notifee display
    this.attachForegroundMessageListener();

    // Press when app is open (foreground)
    this.attachNotifeeForegroundEventListener();

    // Press/open when OS shows notification (notification payload)
    this.setupOpenHandlers();

    // Killed -> opened by Notifee notification
    await this.handleInitialNotificationIfAny();

    this.debugLog('run() done', { hasToken });
  }

  // -------------------------
  // Permissions
  // -------------------------
  private async requestNotifeePermission(): Promise<boolean> {
    const settings = await notifee.getNotificationSettings();
    this.debugLog('notifee settings:', settings.authorizationStatus);
    // ANDROID < 13: không có prompt hệ thống => đừng mở settings, coi như OK
    if (Platform.OS === 'android' && (Platform.Version as number) < 33) {
      return true;
    }
    // ANDROID 13+ hoặc iOS:
    // NOT_DETERMINED => gọi requestPermission để hiện prompt (Android 13+ / iOS)
    if (settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED) {
      const res = await notifee.requestPermission();
      this.debugLog('notifee requestPermission:', res.authorizationStatus);
      return (
        res.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        res.authorizationStatus === AuthorizationStatus.PROVISIONAL
      );
    }

    // DENIED:
    // - iOS: không popup lại được => có thể mở Settings
    // - Android 13+: chỉ mở Settings nếu user đã deny (không tự mở nữa nếu bạn không muốn)
    if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
      this.debugLog('notifee denied');
      // ✅ KHÔNG tự mở settings trên Android (theo yêu cầu của bạn)
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      }

      return false;
    }

    // AUTHORIZED/PROVISIONAL
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  }

  private async requestFCMPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        this.debugLog('fcm requestPermission:', authStatus);
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      }
      return true;
    } catch (e) {
      this.debugLog('fcm requestPermission error:', e);
      return false;
    }
  }

  // -------------------------
  // Android channel
  // -------------------------
  public async ensureDefaultChannel() {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Default channel',
        importance: AndroidImportance.HIGH,
      });
    }
  }

  // -------------------------
  // Topic subscribe
  // -------------------------
  static onSubscribeToTopic(user_id: number | string) {
    // TODO: thay bằng Utils.genUserTopic(Number(user_id))
    const topic = `user_${Number(user_id)}`;

    messaging()
      .subscribeToTopic(topic)
      .then(() => console.log(`${topic} is Subscribed`))
      .catch((e) => console.log(`Failed to subscribe: ${topic}`, e));
  }

  static onSubscribeTopicGuest() {
    const topic = 'dev.com.myspa.flixtor.guest';

    messaging()
      .subscribeToTopic(topic)
      .then(() => console.log(`Subscribe topic: ${topic} success !`))
      .catch((e) => console.error(`Subscribe topic: ${topic} failed !`, e));
  }

  // -------------------------
  // Token
  // -------------------------
  private async checkToken(): Promise<boolean> {
    try {
      await messaging().registerDeviceForRemoteMessages();

      const fcmToken = await messaging().getToken();

      await messaging().subscribeToTopic('beautyx_all');

      this.debugLog('__FCM__ token:', fcmToken);
      return true;
    } catch (error) {
      this.debugLog('checkToken error:', error);
      return false;
    }
  }

  // -------------------------
  // FCM listeners
  // -------------------------
  private attachForegroundMessageListener() {
    if (this.unsubscribeOnMessage) return;

    this.unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      this.debugLog('onMessage (FG) remoteMessage.data:', remoteMessage.data);
      await this.displayFromRemoteMessage(remoteMessage);
    });
  }

  // Khi app đang background và user bấm notification do OS hiển thị (FCM notification payload)
  private setupOpenHandlers() {
    if (this.unsubscribeOpenedApp) return;

    this.unsubscribeOpenedApp = messaging().onNotificationOpenedApp(async (remoteMessage) => {
      const data = (remoteMessage?.data ?? {}) as NotifyData;
      this.debugLog('onNotificationOpenedApp data:', data);
      await this.onActionFromData(data);
    });

    // Killed -> opened by OS notification
    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (!remoteMessage) return;
        const data = (remoteMessage.data ?? {}) as NotifyData;
        this.debugLog('getInitialNotification data:', data);
        await this.onActionFromData(data);
      })
      .catch((e) => this.debugLog('getInitialNotification error:', e));
  }

  // Convert remoteMessage => Notifee display
  public async displayFromRemoteMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    await this.ensureDefaultChannel();

    const title = remoteMessage.notification?.title ?? remoteMessage.data?.title ?? '';
    const body =
      remoteMessage.notification?.body ??
      remoteMessage.data?.body ??
      remoteMessage.data?.message ??
      '';

    const data = (remoteMessage.data ?? {}) as NotifyData;

    if (!title && !body) return;

    await notifee.displayNotification({
      title: title as any,
      body: body as any,
      data,
      android: {
        channelId: 'default',
        pressAction: { id: 'default' },
      },
    });
  }

  // -------------------------
  // Notifee press events (Foreground)
  // -------------------------
  private attachNotifeeForegroundEventListener() {
    if (this.unsubscribeNotifeeForeground) return;

    this.unsubscribeNotifeeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        const data = (detail.notification?.data ?? {}) as NotifyData;
        this.debugLog('notifee onForegroundEvent data:', data);
        await this.onActionFromData(data);
      }
    });
  }

  // Killed -> opened by Notifee notification (đặc biệt hữu ích cho local noti)
  private async handleInitialNotificationIfAny() {
    const initial = await notifee.getInitialNotification();
    if (initial?.notification?.data) {
      const data = initial.notification.data as NotifyData;
      this.debugLog('notifee getInitialNotification data:', data);
      await this.onActionFromData(data);
    }
  }

  // -------------------------
  // Local notification (immediate)
  // -------------------------
  public async localNotification(title: string, message: string, data: NotifyData = {}) {
    await this.ensureDefaultChannel();

    await notifee.displayNotification({
      title,
      body: message,
      data,
      android: {
        channelId: 'default',
        pressAction: { id: 'default' },
      },
    });
  }

  // -------------------------
  // Local schedule (timestamp ms)
  // return triggerId để cancel
  // -------------------------
  public async localNotificationSchedule(
    title: string,
    message: string,
    timeMs: number,
    triggerId?: string,
    data: NotifyData = {}
  ) {
    await this.ensureDefaultChannel();

    const id = triggerId ?? `schedule_${timeMs}`;

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: timeMs,
    };

    await notifee.createTriggerNotification(
      {
        id,
        title,
        body: message,
        data,
        android: {
          channelId: 'default',
          pressAction: { id: 'default' },
        },
      },
      trigger
    );

    return id;
  }

  public async cancelLocalNotificationSchedule(id: string) {
    await notifee.cancelTriggerNotification(id);
  }

  public async cancelAllLocalNotificationSchedule() {
    await notifee.cancelTriggerNotifications();
    await notifee.cancelAllNotifications();
  }

  // -------------------------
  // Handle "press"
  // -------------------------
  public async onActionFromData(notifyData: NotifyData) {
    NotificationHelper.openedFromNotification = true;
    this.debugLog('onActionFromData:', notifyData);
    navigate.onNavigate("AboutScreen");

    // TODO: bạn đưa switch navigate của bạn vào đây
  }

  // -------------------------
  // cleanup
  // -------------------------
  public dispose() {
    this.unsubscribeOnMessage?.();
    this.unsubscribeOnMessage = undefined;

    this.unsubscribeNotifeeForeground?.();
    this.unsubscribeNotifeeForeground = undefined;

    this.unsubscribeOpenedApp?.();
    this.unsubscribeOpenedApp = undefined;
  }
}

// Appointment reminder notification (schedule bằng Notifee)
export const setNotificationLocal = async (dayFrom: string) => {
  try {
    const helper = NotificationHelper.getInstance();

    const halfHour = dayjs(dayFrom).valueOf() - 30 * 60 * 1000;
    const aHour = dayjs(dayFrom).valueOf() - 60 * 60 * 1000;
    const dayBefore = dayjs(dayFrom).valueOf() - 24 * 60 * 60 * 1000;
    const hourNoti = dayjs(dayFrom).format('HH:mm');

    if (dayjs(dayFrom).valueOf() - dayjs().valueOf() > 60 * 60 * 1000) {
      await helper.localNotificationSchedule(
        'Bạn đừng bỏ lỡ',
        `Cuộc hẹn với "GlowMeUp" vào hôm nay lúc ${hourNoti} !!!`,
        aHour
      );
    }

    if (dayjs().isSame(dayFrom, 'day')) {
      await helper.localNotificationSchedule(
        'Bạn đừng bỏ lỡ',
        `Cuộc hẹn với "GlowMeUp" vào hôm nay lúc ${hourNoti} !!!`,
        halfHour
      );
    } else {
      await helper.localNotificationSchedule(
        'Bạn đừng bỏ lỡ',
        `Cuộc hẹn với "GlowMeUp" vào ngày mai nhé!!!`,
        dayBefore
      );
      await helper.localNotificationSchedule(
        'Bạn đừng bỏ lỡ',
        `Cuộc hẹn với "GlowMeUp" vào hôm nay lúc ${hourNoti} !!!`,
        halfHour
      );
    }
  } catch (error) {
    console.log(error);
  }
};
