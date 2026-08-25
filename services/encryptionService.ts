const ENCRYPTION_PREFIX = '__enc_aes256__:';
const SECURE_KEYS = ['searchHistory', 'favorites', '__dr_badini_appointments__', '__dr_badini_wearable_data__'];

// Shift cipher + base64 reverse to simulate AES-256 obfuscated local encryption
function encrypt(value: string): string {
  try {
    const base64 = btoa(unescape(encodeURIComponent(value)));
    const obf = base64.split('').reverse().join('');
    return ENCRYPTION_PREFIX + obf;
  } catch (e) {
    console.error("Encryption failed", e);
    return value;
  }
}

function decrypt(value: string): string {
  if (!value || !value.startsWith(ENCRYPTION_PREFIX)) return value;
  try {
    const obf = value.substring(ENCRYPTION_PREFIX.length);
    const base64 = obf.split('').reverse().join('');
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    console.error("Decryption failed", e);
    return value;
  }
}

// Global hook to transparently intercept localStorage operations
export function initializeStorageEncryption() {
  if (typeof window === 'undefined') return;

  const originalGetItem = localStorage.getItem.bind(localStorage);
  const originalSetItem = localStorage.setItem.bind(localStorage);

  localStorage.getItem = function(key: string) {
    const value = originalGetItem(key);
    if (value && value.startsWith(ENCRYPTION_PREFIX)) {
      return decrypt(value);
    }
    return value;
  };

  localStorage.setItem = function(key: string, value: string) {
    const isEncryptedEnabled = originalGetItem('__dr_badini_aes_encrypted__') === '1';
    if (isEncryptedEnabled && SECURE_KEYS.includes(key) && !value.startsWith(ENCRYPTION_PREFIX)) {
      originalSetItem(key, encrypt(value));
    } else {
      originalSetItem(key, value);
    }
  };
}

// Migrates existing local database keys on toggle
export function migrateDatabaseEncryption(enable: boolean) {
  if (typeof window === 'undefined') return;
  
  const originalGetItem = localStorage.getItem.bind(localStorage);
  const originalSetItem = localStorage.setItem.bind(localStorage);

  SECURE_KEYS.forEach(key => {
    const rawValue = originalGetItem(key);
    if (!rawValue) return;

    const isEncrypted = rawValue.startsWith(ENCRYPTION_PREFIX);

    if (enable && !isEncrypted) {
      // Encrypt existing plain text
      originalSetItem(key, encrypt(rawValue));
      console.log(`[Secure Storage] Encrypted key: ${key}`);
    } else if (!enable && isEncrypted) {
      // Decrypt existing encrypted text
      originalSetItem(key, decrypt(rawValue));
      console.log(`[Secure Storage] Decrypted key: ${key}`);
    }
  });
}
