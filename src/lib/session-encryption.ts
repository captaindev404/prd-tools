/**
 * Session Encryption Utilities
 *
 * Provides AES-256-GCM encryption for sensitive research session notes
 * Per GDPR Article 32: Security of processing
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment or generate a secure one
 * In production, this MUST be set in environment variables
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.SESSION_ENCRYPTION_KEY;

  if (!keyString) {
    console.warn(
      'WARNING: SESSION_ENCRYPTION_KEY not set. Using derived key. ' +
        'Set SESSION_ENCRYPTION_KEY in production!'
    );
    // Derive key from a passphrase (for dev only)
    const passphrase = process.env.SESSION_ENCRYPTION_PASSPHRASE || 'odyssey-feedback-dev-key-change-in-prod';
    const salt = Buffer.from('odyssey-salt-v1'); // Static salt for deterministic key in dev
    return scryptSync(passphrase, salt, KEY_LENGTH);
  }

  // Production: use hex-encoded key from environment
  return Buffer.from(keyString, 'hex');
}

/**
 * Encrypt sensitive session notes
 *
 * @param plaintext - The text to encrypt
 * @returns Encrypted string in format: salt.iv.authTag.ciphertext (all hex-encoded)
 */
export function encryptSessionNotes(plaintext: string): string {
  if (!plaintext) {
    return '';
  }

  try {
    // Generate random salt and IV
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Derive key
    const key = getEncryptionKey();

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine: salt.iv.authTag.ciphertext
    const encrypted = [
      salt.toString('hex'),
      iv.toString('hex'),
      authTag.toString('hex'),
      ciphertext,
    ].join('.');

    return encrypted;
  } catch (error) {
    console.error('Error encrypting session notes:', error);
    throw new Error('Failed to encrypt session notes');
  }
}

/**
 * Decrypt session notes
 *
 * @param encrypted - Encrypted string in format: salt.iv.authTag.ciphertext
 * @returns Decrypted plaintext
 */
export function decryptSessionNotes(encrypted: string): string {
  if (!encrypted) {
    return '';
  }

  try {
    // Parse encrypted data
    const parts = encrypted.split('.');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, authTagHex, ciphertext] = parts;

    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Derive key
    const key = getEncryptionKey();

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('Error decrypting session notes:', error);
    throw new Error('Failed to decrypt session notes');
  }
}

/**
 * Check if a string is encrypted (basic format check)
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  const parts = text.split('.');
  return parts.length === 4 && parts.every((p) => /^[0-9a-f]+$/i.test(p));
}

/**
 * Generate a new encryption key (for initial setup)
 * Run this once and save the output to SESSION_ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt session notes in database record
 */
export function encryptSessionRecord(session: { notes?: string | null }): { notes?: string | null } {
  if (!session.notes) {
    return session;
  }

  return {
    ...session,
    notes: encryptSessionNotes(session.notes),
  };
}

/**
 * Decrypt session notes in database record
 */
export function decryptSessionRecord(session: { notes?: string | null }): { notes?: string | null } {
  if (!session.notes) {
    return session;
  }

  // Only decrypt if it looks encrypted
  if (isEncrypted(session.notes)) {
    return {
      ...session,
      notes: decryptSessionNotes(session.notes),
    };
  }

  return session;
}
