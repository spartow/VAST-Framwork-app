/**
 * VAST-Blockchain Merkle Tree Operations
 * 
 * Implements binary Merkle tree for batching decision records.
 * Supports inclusion proofs for verification.
 */

import { sha256, canonicalJson } from './crypto';

/** Direction in Merkle proof (Left or Right sibling) */
export type ProofDirection = 'L' | 'R';

/** Merkle inclusion proof */
export interface MerkleProof {
  /** Sibling hashes (base64) from leaf to root */
  siblings: string[];
  
  /** Direction of each sibling ('L' = sibling is left, 'R' = sibling is right) */
  directions: ProofDirection[];
  
  /** Index of the leaf in the tree */
  index: number;
}

/** Signed Tree Head - represents a batch anchor point */
export interface SignedTreeHead {
  /** Merkle root hash (base64) */
  root: string;
  
  /** Number of leaves in the tree */
  size: number;
  
  /** Timestamp when tree was anchored */
  t: number;
  
  /** Hub's public key (JWK as string) */
  hub_pubkey: string;
  
  /** Hub's signature over (root + size + t) */
  hub_signature: string;
}

/**
 * Build Merkle root from array of leaf hashes.
 * Uses binary tree structure with SHA-256 at each level.
 */
export async function buildMerkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) {
    // Empty tree hash
    return await sha256('');
  }
  
  if (leaves.length === 1) {
    return leaves[0];
  }
  
  // Build tree level by level
  let currentLevel = [...leaves];
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Duplicate last hash if odd number
      
      // Concatenate and hash: parent = H(left || right)
      const combined = left + right;
      const parent = await sha256(combined);
      nextLevel.push(parent);
    }
    
    currentLevel = nextLevel;
  }
  
  return currentLevel[0];
}

/**
 * Get Merkle inclusion proof for a leaf at given index.
 * Returns sibling hashes and directions needed to recompute root.
 */
export async function getInclusionProof(
  leaves: string[],
  index: number
): Promise<MerkleProof> {
  if (index < 0 || index >= leaves.length) {
    throw new Error(`Invalid leaf index: ${index}`);
  }
  
  if (leaves.length === 1) {
    return { siblings: [], directions: [], index };
  }
  
  const siblings: string[] = [];
  const directions: ProofDirection[] = [];
  
  let currentLevel = [...leaves];
  let currentIndex = index;
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Duplicate last hash if odd
      
      // Record sibling for proof if this pair contains our target
      if (i === currentIndex || i + 1 === currentIndex) {
        if (currentIndex === i) {
          // Target is left, sibling is right
          siblings.push(right);
          directions.push('R');
        } else {
          // Target is right, sibling is left
          siblings.push(left);
          directions.push('L');
        }
      }
      
      // Compute parent
      const combined = left + right;
      const parent = await sha256(combined);
      nextLevel.push(parent);
    }
    
    // Update index for next level
    currentIndex = Math.floor(currentIndex / 2);
    currentLevel = nextLevel;
  }
  
  return { siblings, directions, index };
}

/**
 * Recompute Merkle root from a leaf hash and its inclusion proof.
 * Returns the computed root hash.
 */
export async function recomputeRoot(
  leafHash: string,
  proof: MerkleProof
): Promise<string> {
  let currentHash = leafHash;
  
  for (let i = 0; i < proof.siblings.length; i++) {
    const sibling = proof.siblings[i];
    const direction = proof.directions[i];
    
    // Combine based on direction
    let combined: string;
    if (direction === 'L') {
      // Sibling is left, current is right
      combined = sibling + currentHash;
    } else {
      // Sibling is right, current is left
      combined = currentHash + sibling;
    }
    
    currentHash = await sha256(combined);
  }
  
  return currentHash;
}

/**
 * Verify that a leaf is included in a tree with given root.
 * Recomputes root from proof and compares.
 */
export async function verifyInclusion(
  leafHash: string,
  root: string,
  proof: MerkleProof
): Promise<boolean> {
  const recomputed = await recomputeRoot(leafHash, proof);
  return recomputed === root;
}

/**
 * Create a canonical STH (Signed Tree Head) for signing.
 */
export function canonicalSTH(
  root: string,
  size: number,
  t: number
): string {
  const sthData = {
    root,
    size,
    t,
  };
  return canonicalJson(sthData);
}

/**
 * Sign a tree head with the hub's private key.
 */
export async function signTreeHead(
  root: string,
  size: number,
  t: number,
  hubPrivateKey: JsonWebKey,
  hubPublicKey: JsonWebKey
): Promise<SignedTreeHead> {
  const { sign } = await import('./crypto');
  
  const canonical = canonicalSTH(root, size, t);
  const signature = await sign(hubPrivateKey, canonical);
  
  return {
    root,
    size,
    t,
    hub_pubkey: JSON.stringify(hubPublicKey),
    hub_signature: signature,
  };
}

/**
 * Verify a signed tree head.
 */
export async function verifyTreeHead(sth: SignedTreeHead): Promise<boolean> {
  const { verify } = await import('./crypto');
  
  try {
    const canonical = canonicalSTH(sth.root, sth.size, sth.t);
    const publicKey = JSON.parse(sth.hub_pubkey);
    
    return await verify(publicKey, canonical, sth.hub_signature);
  } catch (error) {
    console.error('STH verification failed:', error);
    return false;
  }
}
