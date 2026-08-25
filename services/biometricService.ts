/**
 * biometricService.ts
 * Biometric Authentication for Dr. Badini AI.
 * Strategy:
 *   1. WebAuthn (FIDO2) platform authenticator — browser fingerprint / Face ID
 *   2. PIN fallback — stored PIN in localStorage (hashed)
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'webauthn' | 'pin' | 'none';

export interface BiometricCapability {
  available: boolean;
  type: BiometricType;
  strongBiometricAvailable: boolean;
}

export interface AuthResult {
  success: boolean;
  method: BiometricType | 'fallback';
  error?: string;
}

// ── PIN helpers ──────────────────────────────────────────────────────────────

const PIN_KEY = '__dr_badini_pin_hash__';

async function hashPin(pin: string): Promise<string> {
  const salted = 'badini_salt_' + pin;
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    let hash = 5381;
    for (let i = 0; i < salted.length; i++) {
      hash = ((hash << 5) + hash) + salted.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(salted));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function setPIN(pin: string): Promise<void> {
  localStorage.setItem(PIN_KEY, await hashPin(pin));
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return false;
  return stored === await hashPin(pin);
}

export function hasPIN(): boolean {
  return !!localStorage.getItem(PIN_KEY);
}

export function clearPIN(): void {
  localStorage.removeItem(PIN_KEY);
}

// ── WebAuthn helpers ─────────────────────────────────────────────────────────

const WEBAUTHN_RP_ID = (typeof location !== 'undefined' && location.hostname) ? location.hostname : 'localhost';
const WEBAUTHN_CRED_KEY = '__dr_badini_webauthn_cred__';

function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!(window.PublicKeyCredential && navigator.credentials)
  );
}

function randomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(arr);
  }
  for (let i = 0; i < n; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
}

export async function registerWebAuthn(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32) as unknown as BufferSource,
        rp: { name: 'Dr. Badini AI', id: WEBAUTHN_RP_ID },
        user: {
          id: randomBytes(16) as unknown as BufferSource,
          name: 'badini_user',
          displayName: 'بکارئینەر',
        },
        pubKeyCredParams: [
          { alg: -7,   type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;
    localStorage.setItem(
      WEBAUTHN_CRED_KEY,
      btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
    );
    return true;
  } catch (e) {
    console.warn('[biometric] WebAuthn register failed', e);
    return false;
  }
}

export async function verifyWebAuthn(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  const rawIdB64 = localStorage.getItem(WEBAUTHN_CRED_KEY);
  if (!rawIdB64) return false;

  try {
    const rawId = Uint8Array.from(atob(rawIdB64), c => c.charCodeAt(0));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32) as unknown as BufferSource,
        rpId: WEBAUTHN_RP_ID,
        allowCredentials: [{ id: rawId as unknown as BufferSource, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return !!assertion;
  } catch (e) {
    console.warn('[biometric] WebAuthn verify failed', e);
    return false;
  }
}

export function hasWebAuthnCredential(): boolean {
  return !!localStorage.getItem(WEBAUTHN_CRED_KEY);
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (isWebAuthnAvailable()) {
    try {
      const platformAvail = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (platformAvail) {
        return { available: true, type: 'webauthn', strongBiometricAvailable: true };
      }
    } catch {
      // ignore
    }
  }
  return { available: false, type: 'none', strongBiometricAvailable: false };
}

export async function authenticate(
  _reason = 'دەستپێکرنا Dr. Badini AI'
): Promise<AuthResult> {
  if (isWebAuthnAvailable()) {
    try {
      const platformAvail = await PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable()
        .catch(() => false);

      if (platformAvail) {
        if (!hasWebAuthnCredential()) {
          const registered = await registerWebAuthn();
          if (registered) return { success: true, method: 'webauthn' };
        } else {
          const ok = await verifyWebAuthn();
          return {
            success: ok,
            method: 'webauthn',
            error: ok ? undefined : 'دڵنیابون سەرنەکەت',
          };
        }
      }
    } catch {
      // fall through to PIN
    }
  }

  return { success: false, method: 'fallback', error: 'بیومتریک بردەست نینە' };
}

// ── Settings helpers ─────────────────────────────────────────────────────────

const BIOMETRIC_ENABLED_KEY = '__dr_badini_biometric_on__';

export function isBiometricLockEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === '1';
}

export function setBiometricLockEnabled(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, '1');
  } else {
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    localStorage.removeItem(WEBAUTHN_CRED_KEY);
    clearPIN();
  }
}
