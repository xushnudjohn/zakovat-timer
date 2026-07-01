import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const END_NOTIFICATION_ID = 42;
const WARN_NOTIFICATION_ID = 43;
const isNative = () => Capacitor.isNativePlatform();
const isAndroid = () => Capacitor.getPlatform() === 'android';

let permissionRequested = false;
let channelsCreated = false;

// Android 8+ plays notification sound from the channel, so we need one
// channel per sound. iOS ignores channels and uses the per-notification
// `sound` field (file must be in the app bundle root).
const ensureChannels = async () => {
  if (!isAndroid() || channelsCreated) return;
  channelsCreated = true;
  try {
    await LocalNotifications.createChannel({
      id: 'timer_end_voice',
      name: 'Taymer tugashi (ovozli)',
      importance: 5,
      sound: 'vaqt_boldi.wav',
      vibration: true,
    });
    await LocalNotifications.createChannel({
      id: 'timer_warn_voice',
      name: '10 soniya ogohlantirishi (ovozli)',
      importance: 5,
      sound: 's10_qoldi.wav',
      vibration: true,
    });
    await LocalNotifications.createChannel({
      id: 'timer_default',
      name: 'Taymer signallari',
      importance: 5,
      vibration: true,
    });
  } catch {}
};

export const ensureNotificationPermission = async () => {
  if (!isNative() || permissionRequested) return;
  permissionRequested = true;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
    await ensureChannels();
  } catch {}
};

export interface TimerNotificationOptions {
  /** Seconds until the current segment ends */
  secondsToEnd: number;
  /** Play the recorded human voice instead of the default sound */
  useVoice: boolean;
  /** Also schedule the 10-seconds-left warning */
  warn10s: boolean;
}

export const scheduleTimerNotifications = async (opts: TimerNotificationOptions) => {
  if (!isNative() || opts.secondsToEnd <= 0) return;
  try {
    await cancelTimerNotifications();

    const notifications: any[] = [
      {
        id: END_NOTIFICATION_ID,
        title: 'Zakovat taymeri',
        body: 'Vaqt tugadi!',
        schedule: { at: new Date(Date.now() + opts.secondsToEnd * 1000) },
        sound: opts.useVoice ? 'vaqt_boldi.wav' : undefined,
        channelId: opts.useVoice ? 'timer_end_voice' : 'timer_default',
      },
    ];

    if (opts.warn10s && opts.secondsToEnd > 11) {
      notifications.push({
        id: WARN_NOTIFICATION_ID,
        title: 'Zakovat taymeri',
        body: '10 soniya qoldi!',
        schedule: { at: new Date(Date.now() + (opts.secondsToEnd - 10) * 1000) },
        sound: opts.useVoice ? 's10_qoldi.wav' : undefined,
        channelId: opts.useVoice ? 'timer_warn_voice' : 'timer_default',
      });
    }

    await LocalNotifications.schedule({ notifications });
  } catch {}
};

export const cancelTimerNotifications = async () => {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: END_NOTIFICATION_ID }, { id: WARN_NOTIFICATION_ID }],
    });
  } catch {}
};
