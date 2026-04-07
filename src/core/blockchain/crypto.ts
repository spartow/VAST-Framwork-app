/**
 * VAST-Blockchain Cryptographic Utilities
 * 
 * Uses WebCrypto API for SHA-256 hashing and ECDSA P-256 signatures.
 * All operations are async to avoid blocking the UI.
 */

import { getBlockchainConfig } from './config';

/** Generate a UUID v4 for decision IDs */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Canonical JSON serialization for deterministic hashing.
 * Sorts object keys recursively for consistent output.
 */
export function canonicalJson(obj: unknown): string {
  if (obj === null) return 'null';
  if (obj === undefined) return undefined as unknown as string;
  
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'boolean') return String(obj);
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  
  if (typeof obj === 'object') {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys.map(k => {
      const val = (obj as Record<string, unknown>)[k];
      return `${JSON.stringify(k)}:${canonicalJson(val)}`;
    });
    return '{' + pairs.join(',') + '}';
  }
  
  return String(obj);
}

/**
 * SHA-256 hash using WebCrypto API.
 * Returns base64-encoded digest.
 */
export async function sha256(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer as ArrayBuffer));
  return btoa(String.fromCharCode(...hashArray));
}

/**
 * Generate ECDSA P-256 keypair using WebCrypto.
 * Returns JWK (JSON Web Key) format for storage.
 */
export async function generateAgentKeypair(): Promise<{
  privateKey: JsonWebKey;
  publicKey: JsonWebKey;
}> {
  const config = getBlockchainConfig();
  
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: config.crypto.namedCurve,
    },
    true, // extractable
    ['sign', 'verify']
  );
  
  const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  
  return { privateKey, publicKey };
}

/**
 * Sign data with ECDSA private key.
 * Returns base64-encoded signature.
 */
export async function sign(
  privateKeyJwk: JsonWebKey,
  data: string | Uint8Array
): Promise<string> {
  const config = getBlockchainConfig();
  
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    {
      name: 'ECDSA',
      namedCurve: config.crypto.namedCurve,
    },
    false, // not extractable
    ['sign']
  );
  
  const encoder = new TextEncoder();
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: config.crypto.hashAlgorithm,
    },
    privateKey,
    bytes as BufferSource
  );
  
  const signatureArray = Array.from(new Uint8Array(signature));
  return btoa(String.fromCharCode(...signatureArray));
}

/**
 * Verify ECDSA signature.
 * Returns true if signature is valid.
 */
export async function verify(
  publicKeyJwk: JsonWebKey,
  data: string | Uint8Array,
  signatureBase64: string
): Promise<boolean> {
  const config = getBlockchainConfig();
  
  try {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      {
        name: 'ECDSA',
        namedCurve: config.crypto.namedCurve,
      },
      false, // not extractable
      ['verify']
    );
    
    const encoder = new TextEncoder();
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    
    // Decode base64 signature
    const signatureString = atob(signatureBase64);
    const signatureBytes = new Uint8Array(
      signatureString.split('').map(c => c.charCodeAt(0))
    );
    
    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: config.crypto.hashAlgorithm,
      },
      publicKey,
      signatureBytes,
      bytes as BufferSource
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Get or create agent keypair from localStorage.
 * Generates new keys if not present.
 */
export async function getOrCreateAgentKeypair(): Promise<{
  privateKey: JsonWebKey;
  publicKey: JsonWebKey;
}> {
  const config = getBlockchainConfig();
  
  const storedPrivate = localStorage.getItem(config.storageKeys.agentPrivateKey);
  const storedPublic = localStorage.getItem(config.storageKeys.agentPublicKey);
  
  if (storedPrivate && storedPublic) {
    return {
      privateKey: JSON.parse(storedPrivate),
      publicKey: JSON.parse(storedPublic),
    };
  }
  
  // Generate new keypair
  const keypair = await generateAgentKeypair();
  
  // Store in localStorage
  localStorage.setItem(config.storageKeys.agentPrivateKey, JSON.stringify(keypair.privateKey));
  localStorage.setItem(config.storageKeys.agentPublicKey, JSON.stringify(keypair.publicKey));
  
  return keypair;
}

/**
 * Get or create hub keypair from localStorage.
 * Separate identity from agent for STH signing.
 */
export async function getOrCreateHubKeypair(): Promise<{
  privateKey: JsonWebKey;
  publicKey: JsonWebKey;
}> {
  const config = getBlockchainConfig();
  
  const storedPrivate = localStorage.getItem(config.storageKeys.hubPrivateKey);
  const storedPublic = localStorage.getItem(config.storageKeys.hubPublicKey);
  
  if (storedPrivate && storedPublic) {
    return {
      privateKey: JSON.parse(storedPrivate),
      publicKey: JSON.parse(storedPublic),
    };
  }
  
  // Generate new keypair
  const keypair = await generateAgentKeypair();
  
  // Store in localStorage
  localStorage.setItem(config.storageKeys.hubPrivateKey, JSON.stringify(keypair.privateKey));
  localStorage.setItem(config.storageKeys.hubPublicKey, JSON.stringify(keypair.publicKey));
  
  return keypair;
}

/**
 * Clear stored keys from localStorage (for testing/reset).
 */
export function clearStoredKeys(): void {
  const config = getBlockchainConfig();
  localStorage.removeItem(config.storageKeys.agentPrivateKey);
  localStorage.removeItem(config.storageKeys.agentPublicKey);
  localStorage.removeItem(config.storageKeys.hubPrivateKey);
  localStorage.removeItem(config.storageKeys.hubPublicKey);
}
