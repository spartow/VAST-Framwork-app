/**
 * VAST-Blockchain Anchoring Hub
 * 
 * Manages batching of decision records into Merkle trees.
 * Generates Signed Tree Heads (STHs) at regular intervals or batch sizes.
 */

import { DecisionRecord, hashDecisionRecord } from './decisionRecord';
import {
  buildMerkleRoot,
  getInclusionProof,
  signTreeHead,
  SignedTreeHead,
  MerkleProof,
} from './merkle';
import { getOrCreateHubKeypair } from './crypto';
import { getBlockchainConfig } from './config';

/** Reference to an anchored decision within a batch */
export interface AnchoredDecision {
  /** The decision record */
  dt: DecisionRecord;
  
  /** Leaf hash (base64) */
  leafHash: string;
  
  /** Index in the Merkle tree */
  leafIndex: number;
  
  /** Reference to the STH that includes this decision */
  sthRef: string; // Reference ID (e.g., sth root hash)
  
  /** Merkle inclusion proof */
  inclusionProof: MerkleProof;
}

/** A batch of decisions anchored together */
export interface Batch {
  /** Unique batch ID (usually the STH root) */
  id: string;
  
  /** Decisions in this batch */
  decisions: AnchoredDecision[];
  
  /** Signed Tree Head for this batch */
  sth: SignedTreeHead;
  
  /** When the batch was created */
  createdAt: number;
}

/** In-memory storage for the anchoring hub */
interface HubStorage {
  pendingLeaves: Array<{ id: string; hash: string; dt: DecisionRecord }>;
  batches: Map<string, Batch>;
  decisionToBatch: Map<string, string>; // decisionId -> batchId
  sthHistory: SignedTreeHead[];
}

/** The AnchoringHub singleton */
class AnchoringHub {
  private storage: HubStorage;
  private config: ReturnType<typeof getBlockchainConfig>;
  private timerId: number | null = null;
  private isRunning = false;

  constructor() {
    this.storage = {
      pendingLeaves: [],
      batches: new Map(),
      decisionToBatch: new Map(),
      sthHistory: [],
    };
    this.config = getBlockchainConfig();
  }

  /**
   * Start the batching timer.
   * Automatically closes batches every T seconds.
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleNextBatch();
    console.log('[AnchoringHub] Started with interval:', this.config.batchIntervalSeconds, 's');
  }

  /**
   * Stop the batching timer.
   */
  stop(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    console.log('[AnchoringHub] Stopped');
  }

  /**
   * Append a decision record to the pending batch.
   * Returns immediately with leaf hash; proof is generated when batch closes.
   */
  async appendDecision(dt: DecisionRecord): Promise<{ index: number; leafHash: string }> {
    // Compute leaf hash
    const leafHash = await hashDecisionRecord(dt);
    
    // Add to pending
    const index = this.storage.pendingLeaves.length;
    this.storage.pendingLeaves.push({
      id: dt.id,
      hash: leafHash,
      dt,
    });
    
    // Check if we should close the batch immediately (size threshold)
    if (this.storage.pendingLeaves.length >= this.config.batchSize) {
      // Close batch asynchronously (don't block)
      this.closeBatch().catch(console.error);
    }
    
    return { index, leafHash };
  }

  /**
   * Get the anchored data for a decision (once batch is closed).
   */
  getAnchoredDecision(decisionId: string): AnchoredDecision | undefined {
    const batchId = this.storage.decisionToBatch.get(decisionId);
    if (!batchId) return undefined;
    
    const batch = this.storage.batches.get(batchId);
    if (!batch) return undefined;
    
    return batch.decisions.find(d => d.dt.id === decisionId);
  }

  /**
   * Get STH by batch ID.
   */
  getSTH(batchId: string): SignedTreeHead | undefined {
    const batch = this.storage.batches.get(batchId);
    return batch?.sth;
  }

  /**
   * Get all STH history.
   */
  getSTHHistory(): SignedTreeHead[] {
    return [...this.storage.sthHistory];
  }

  /**
   * Get current pending count.
   */
  getPendingCount(): number {
    return this.storage.pendingLeaves.length;
  }

  /**
   * Force close the current pending batch.
   */
  async closeBatch(): Promise<Batch | null> {
    if (this.storage.pendingLeaves.length === 0) {
      return null;
    }
    
    const leaves = [...this.storage.pendingLeaves];
    this.storage.pendingLeaves = []; // Clear pending
    
    // Build Merkle tree
    const leafHashes = leaves.map(l => l.hash);
    const root = await buildMerkleRoot(leafHashes);
    
    // Generate inclusion proofs for all leaves
    const decisions: AnchoredDecision[] = [];
    for (let i = 0; i < leaves.length; i++) {
      const proof = await getInclusionProof(leafHashes, i);
      decisions.push({
        dt: leaves[i].dt,
        leafHash: leaves[i].hash,
        leafIndex: i,
        sthRef: root, // Use root as reference
        inclusionProof: proof,
      });
    }
    
    // Get hub keypair for signing
    const hubKeypair = await getOrCreateHubKeypair();
    
    // Create STH
    const now = Date.now();
    const sth = await signTreeHead(
      root,
      leaves.length,
      now,
      hubKeypair.privateKey,
      hubKeypair.publicKey
    );
    
    // Create batch
    const batch: Batch = {
      id: root,
      decisions,
      sth,
      createdAt: now,
    };
    
    // Store batch
    this.storage.batches.set(root, batch);
    this.storage.sthHistory.push(sth);
    
    // Map decisions to batch
    for (const d of decisions) {
      this.storage.decisionToBatch.set(d.dt.id, root);
    }
    
    // Persist to localStorage (optional, for demo)
    this.persistToStorage();
    
    console.log(`[AnchoringHub] Closed batch ${root.substring(0, 16)}... with ${leaves.length} decisions`);
    
    return batch;
  }

  /**
   * Schedule the next automatic batch closure.
   */
  private scheduleNextBatch(): void {
    if (!this.isRunning) return;
    
    this.timerId = window.setTimeout(async () => {
      if (this.storage.pendingLeaves.length > 0) {
        await this.closeBatch();
      }
      this.scheduleNextBatch();
    }, this.config.batchIntervalSeconds * 1000);
  }

  /**
   * Persist state to localStorage for demo purposes.
   */
  private persistToStorage(): void {
    try {
      const state = {
        batches: Array.from(this.storage.batches.entries()),
        decisionToBatch: Array.from(this.storage.decisionToBatch.entries()),
        sthHistory: this.storage.sthHistory,
      };
      localStorage.setItem(this.config.storageKeys.ledgerState, JSON.stringify(state));
    } catch (e) {
      console.warn('[AnchoringHub] Failed to persist state:', e);
    }
  }

  /**
   * Load state from localStorage.
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKeys.ledgerState);
      if (stored) {
        const state = JSON.parse(stored);
        this.storage.batches = new Map(state.batches || []);
        this.storage.decisionToBatch = new Map(state.decisionToBatch || []);
        this.storage.sthHistory = state.sthHistory || [];
        console.log('[AnchoringHub] Loaded state from storage:', 
          this.storage.batches.size, 'batches');
      }
    } catch (e) {
      console.warn('[AnchoringHub] Failed to load state:', e);
    }
  }

  /**
   * Clear all stored state.
   */
  clear(): void {
    this.stop();
    this.storage = {
      pendingLeaves: [],
      batches: new Map(),
      decisionToBatch: new Map(),
      sthHistory: [],
    };
    localStorage.removeItem(this.config.storageKeys.ledgerState);
    console.log('[AnchoringHub] State cleared');
  }
}

// Export singleton instance
export const anchoringHub = new AnchoringHub();

// Also export class for testing
export { AnchoringHub };
