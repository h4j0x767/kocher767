/**
 * notificationService.ts
 * Unified notification layer for Dr. Smart.
 * Uses Web Notifications API with full iOS WKWebView support.
 */
import { Capacitor } from '@capacitor/core';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id?: number;
  title: string;
  body: string;
  icon?: string;
  scheduledAt?: Date;
  data?: Record<string, unknown>;
}

export type NotificationPermission = 'granted' | 'denied' | 'prompt' | 'unknown';

let _notifId = 1000;
const nextId = () => ++_notifId;

// ── Web Notifications ────────────────────────────────────────────────────────

async function webRequest(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unknown';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

function webSchedule(n: AppNotification): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const fire = () => {
    new Notification(n.title, {
      body: n.body,
      icon: n.icon ?? '/favicon.ico',
      data: n.data,
      tag: String(n.id ?? nextId()),
    });
  };

  if (n.scheduledAt) {
    const delay = n.scheduledAt.getTime() - Date.now();
    if (delay > 0) setTimeout(fire, delay);
    else fire();
  } else {
    fire();
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  try {
    return await webRequest();
  } catch (e) {
    console.warn('[notificationService] requestPermission failed', e);
    return 'unknown';
  }
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unknown';
    return Notification.permission as NotificationPermission;
  } catch (e) {
    console.warn('[notificationService] getPermission failed', e);
    return 'unknown';
  }
}

export async function scheduleNotification(n: AppNotification): Promise<void> {
  try {
    webSchedule(n);
  } catch (e) {
    console.warn('[notificationService] schedule failed', e);
  }
}

export async function cancelNotification(id: number): Promise<void> {
  // Web notifications do not require manual cancellation
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

export async function scheduleHealthReminder(at: Date): Promise<void> {
  await scheduleNotification({
    id: 2010,
    title: 'یادکرنا تەندروستیێ',
    body: 'دەما پشکنینا تەندروستی و دەرمانێن تە هاتیە.',
    scheduledAt: at,
    data: { type: 'health_reminder' },
  });
}
