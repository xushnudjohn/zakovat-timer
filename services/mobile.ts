import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => Capacitor.isNativePlatform();

let hapticsEnabled = true;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
};

export const keepScreenOn = async () => {
  if (!isNative()) return;
  try { await KeepAwake.keepAwake(); } catch {}
};

export const allowScreenOff = async () => {
  if (!isNative()) return;
  try { await KeepAwake.allowSleep(); } catch {}
};

export const hapticTap = async () => {
  if (!isNative() || !hapticsEnabled) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
};

export const hapticStart = async () => {
  if (!isNative() || !hapticsEnabled) return;
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
};

export const hapticWarning = async () => {
  if (!isNative() || !hapticsEnabled) return;
  // Use a single heavy impact (not notification pattern) so we don't block
  // the audio session while the 10s warning sound is trying to play.
  try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
};

export const hapticEnd = async () => {
  if (!isNative() || !hapticsEnabled) return;
  try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
};
