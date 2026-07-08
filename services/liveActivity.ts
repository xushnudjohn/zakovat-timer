import { Capacitor, registerPlugin } from '@capacitor/core';

interface LiveActivityPlugin {
  startActivity(options: {
    title: string;
    endEpochMs: number;
    statusLabel: string;
    paused: boolean;
    remainingSeconds: number;
  }): Promise<{ started: boolean; id?: string; reason?: string }>;
  updateActivity(options: {
    endEpochMs: number;
    statusLabel: string;
    paused: boolean;
    remainingSeconds: number;
  }): Promise<void>;
  endActivity(): Promise<void>;
}

const LiveActivity = registerPlugin<LiveActivityPlugin>('LiveActivity');

const isIOS = () => Capacitor.getPlatform() === 'ios';

let active = false;

export const startLiveActivity = async (
  title: string,
  endEpochMs: number,
  statusLabel: string,
) => {
  if (!isIOS()) return;
  try {
    const res = await LiveActivity.startActivity({
      title,
      endEpochMs,
      statusLabel,
      paused: false,
      remainingSeconds: 0,
    });
    active = !!res?.started;
  } catch {
    active = false;
  }
};

export const updateLiveActivity = async (
  endEpochMs: number,
  statusLabel: string,
  paused: boolean,
  remainingSeconds: number,
) => {
  if (!isIOS() || !active) return;
  try {
    await LiveActivity.updateActivity({ endEpochMs, statusLabel, paused, remainingSeconds });
  } catch {}
};

export const endLiveActivity = async () => {
  if (!isIOS() || !active) return;
  active = false;
  try {
    await LiveActivity.endActivity();
  } catch {}
};
