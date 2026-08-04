/**
 * Security helper to encrypt / obfuscate access keys in URLs.
 * Encodes raw key e.g. "AFFILIATE2026" to an encrypted URL safe parameter e.g. "enc_UEYyMDI2OkFGRklMSUFURTIwMjY"
 */

export function encodeAccessKey(rawKey: string): string {
  if (!rawKey) return '';
  const clean = rawKey.trim().toUpperCase();
  try {
    const payload = `PF2026:${clean}`;
    let b64 = btoa(payload);
    // Replace standard base64 characters for URL safety
    b64 = b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `enc_${b64}`;
  } catch (e) {
    return clean;
  }
}

export function decodeAccessKey(encodedKey: string): string {
  if (!encodedKey) return '';
  let key = encodedKey.trim();

  if (key.startsWith('enc_')) {
    key = key.substring(4);
    // Restore padding
    while (key.length % 4 !== 0) {
      key += '=';
    }
    key = key.replace(/-/g, '+').replace(/_/g, '/');
    try {
      const decoded = atob(key);
      if (decoded.startsWith('PF2026:')) {
        return decoded.substring(7);
      }
      return decoded;
    } catch (e) {
      return encodedKey.trim().toUpperCase();
    }
  }

  return key.toUpperCase();
}
