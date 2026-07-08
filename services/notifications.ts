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
      id: 'timer_end_beep',
      name: 'Taymer tugashi (signal)',
      importance: 5,
      sound: 'beep_end.wav',
      vibration: true,
    });
    await LocalNotifications.createChannel({
      id: 'timer_warn_beep',
      name: '10 soniya ogohlantirishi (signal)',
      importance: 5,
      sound: 'beep_warn.wav',
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
  /** Play the recorded human voice */
  useVoice: boolean;
  /** Play the electronic beep (when voice is off but signal is on) */
  useBeep: boolean;
  /** Also schedule the 10-seconds-left warning */
  warn10s: boolean;
}

// Pick the sound file + Android channel for the end / warning notifications
// based on the user's sound settings. Voice wins over beep; if neither is on
// the notification is silent.
const endSound = (o: TimerNotificationOptions) =>
  o.useVoice ? 'vaqt_boldi.wav' : o.useBeep ? 'beep_end.wav' : undefined;
const endChannel = (o: TimerNotificationOptions) =>
  o.useVoice ? 'timer_end_voice' : o.useBeep ? 'timer_end_beep' : 'timer_default';
const warnSound = (o: TimerNotificationOptions) =>
  o.useVoice ? 's10_qoldi.wav' : o.useBeep ? 'beep_warn.wav' : undefined;
const warnChannel = (o: TimerNotificationOptions) =>
  o.useVoice ? 'timer_warn_voice' : o.useBeep ? 'timer_warn_beep' : 'timer_default';

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
        sound: endSound(opts),
        channelId: endChannel(opts),
      },
    ];

    if (opts.warn10s && opts.secondsToEnd > 11) {
      notifications.push({
        id: WARN_NOTIFICATION_ID,
        title: 'Zakovat taymeri',
        body: '10 soniya qoldi!',
        schedule: { at: new Date(Date.now() + (opts.secondsToEnd - 10) * 1000) },
        sound: warnSound(opts),
        channelId: warnChannel(opts),
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
