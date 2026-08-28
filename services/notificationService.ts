/**
 * notificationService.ts
 * Unified notification & reminder layer for Dr. Smart (نۆژدارێ زیرەک).
 * Handles Native iOS UNUserNotificationCenter (outside the app / lock screen),
 * Web Notifications API, Synthesized iOS Chime Audio, Haptics,
 * and In-App native iOS Dynamic Notification Banners.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id?: number;
  title: string;
  body: string;
  icon?: string;
  scheduledAt?: Date;
  data?: Record<string, unknown>;
}

export interface MedicationAlertEventDetail {
  id: string;
  title: string;
  body: string;
  medName: string;
  dosage: string;
  time: string;
  icon?: string;
}

export type NotificationPermission = 'granted' | 'denied' | 'prompt' | 'unknown';

let _notifId = 1000;
const nextId = () => ++_notifId;

// ── Synthesized iOS Bell / Chime Sound (Web Audio API) ───────────────────────

let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!_audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      _audioCtx = new AudioCtx();
    }
  }
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

/**
 * Plays a clean, crisp Apple iOS-style harmonic bell notification chime.
 */
export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic bell frequencies (G5 -> C6 -> E6 chime chord)
    const tones = [
      { freq: 783.99, start: 0, dur: 0.45, gain: 0.35 },    // G5
      { freq: 1046.50, start: 0.08, dur: 0.55, gain: 0.45 }, // C6
      { freq: 1318.51, start: 0.16, dur: 0.75, gain: 0.4 },  // E6
    ];

    tones.forEach(({ freq, start, dur, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gainNode.gain.setValueAtTime(0, now + start);
      gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (e) {
    console.warn('[notificationService] Failed to play chime audio', e);
  }
}

/**
 * Triggers native haptic vibration.
 */
export function triggerNotificationHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([120, 80, 120]);
    }
  } catch {}
}

// ── Native iOS + Web Permissions ─────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  // 1. Try Native iOS LocalNotifications plugin first
  try {
    if (Capacitor.isNativePlatform() && LocalNotifications && typeof LocalNotifications.requestPermissions === 'function') {
      const res = await LocalNotifications.requestPermissions();
      if (res.display === 'granted') return 'granted';
      if (res.display === 'denied') return 'denied';
    }
  } catch (e) {
    console.warn('[notificationService] Native permission request error', e);
  }

  // 2. Fallback to Web Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return 'granted';
    try {
      const result = await Notification.requestPermission();
      return result as NotificationPermission;
    } catch {
      return 'unknown';
    }
  }

  return 'unknown';
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  try {
    if (Capacitor.isNativePlatform() && LocalNotifications && typeof LocalNotifications.checkPermissions === 'function') {
      const res = await LocalNotifications.checkPermissions();
      if (res.display === 'granted') return 'granted';
      if (res.display === 'denied') return 'denied';
    }
  } catch {}

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission as NotificationPermission;
  }
  return 'unknown';
}

// ── Schedule Notification (Native iOS UNUserNotificationCenter + Web) ─────────

export async function scheduleNotification(n: AppNotification): Promise<void> {
  const notifId = n.id ?? nextId();

  // 1. Native iOS Notification (outside the app / lock screen)
  try {
    if (Capacitor.isNativePlatform() && LocalNotifications && typeof LocalNotifications.schedule === 'function') {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: n.title,
            body: n.body,
            schedule: n.scheduledAt ? { at: n.scheduledAt } : { at: new Date(Date.now() + 200) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            extra: n.data,
          },
        ],
      });
      return;
    }
  } catch (e) {
    console.warn('[notificationService] Native LocalNotifications.schedule error', e);
  }

  // 2. Web Notification Fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const fire = () => {
      try {
        new Notification(n.title, {
          body: n.body,
          icon: n.icon ?? '/logo.png',
          data: n.data,
          tag: String(notifId),
        });
      } catch (err) {
        console.warn('[notificationService] Web Notification error', err);
      }
    };

    if (n.scheduledAt) {
      const delay = n.scheduledAt.getTime() - Date.now();
      if (delay > 0) setTimeout(fire, delay);
      else fire();
    } else {
      fire();
    }
  }
}

/**
 * Fires a high-priority Medication Reminder alert:
 * 1. Native iOS System Notification (Lock Screen / Notification Center outside app)
 * 2. Synthesizes iOS Bell Chime Sound
 * 3. Vibrates device (Haptic Feedback)
 * 4. Dispatches in-app native iOS Glassmorphic Banner
 */
export async function triggerMedicationAlert(params: {
  id?: string;
  medName: string;
  dosage: string;
  time?: string;
}): Promise<void> {
  const { id = String(Date.now()), medName, dosage, time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) } = params;

  const title = 'نۆژدارێ زیرەک';
  const body = `نوکە دەمێ وەرگرتنا حەبکا تە یا (${medName} - ${dosage}) یە`;

  // 1. Play sound
  playNotificationChime();

  // 2. Vibrate
  triggerNotificationHaptic();

  // 3. Native iOS System Notification (Lock Screen / outside app)
  await scheduleNotification({
    id: nextId(),
    title,
    body,
    icon: '/logo.png',
    data: { type: 'medication_reminder', medName, dosage, time },
  });

  // 4. In-App iOS Banner Event
  if (typeof window !== 'undefined') {
    const event = new CustomEvent<MedicationAlertEventDetail>('dr-smart:medication-alert', {
      detail: {
        id,
        title,
        body,
        medName,
        dosage,
        time,
        icon: '/logo.png',
      },
    });
    window.dispatchEvent(event);
  }
}

// ── Pre-built notifications ──────────────────────────────────────────────────

export async function notifyNearbyHospital(hospitalName: string, distanceKm: number): Promise<void> {
  const dist = distanceKm < 1
    ? `${(distanceKm * 1000).toFixed(0)} م`
    : `${distanceKm.toFixed(1)} کم`;

  await scheduleNotification({
    id: 2001,
    title: 'نەخۆشخانەیەک ل نێزیک تە!',
    body: `${hospitalName} — ${dist} دووری تە یە`,
    data: { type: 'nearby_hospital', name: hospitalName },
  });
}

export async function notifyAnalysisReady(queryName: string): Promise<void> {
  await scheduleNotification({
    id: 2002,
    title: 'شیکاری تەواو بوو',
    body: `راپۆرتا "${queryName}" ئامادەیە`,
    data: { type: 'analysis_done', query: queryName },
  });
}
