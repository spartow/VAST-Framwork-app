/**
 * VAST-Blockchain Evidence Bundle Export
 * 
 * Exports complete evidence including decision records, STHs,
 * inclusion proofs, and rule references for external verification.
 */

import type { LogEntry } from '../types';
import type { DecisionRecord } from './decisionRecord';

/** Complete evidence bundle for export */
export interface EvidenceBundle {
  /** Bundle metadata */
  metadata: {
    version: string;
    exportedAt: number;
    exporter: string;
    entryCount: number;
  };
  
  /** Decision records */
  decisions: Array<{
    id: string;
    dt: DecisionRecord;
    leafHash: string;
  }>;
  
  /** Signed Tree Heads */
  sths: Array<{
    root: string;
    size: number;
    t: number;
    hubPubkey: string;
    hubSignature: string;
    txHash?: string;
  }>;
  
  /** Inclusion proofs */
  proofs: Array<{
    decisionId: string;
    sthRoot: string;
    leafIndex: number;
    siblings: string[];
    directions: ('L' | 'R')[];
  }>;
  
  /** Rule references */
  rules: Array<{
    rid: string;
    hash: string;
    activatedAt: number;
  }>;
  
  /** Public keys for verification */
  publicKeys: {
    agent?: string;
    hub?: string;
  };
}

/**
 * Create an evidence bundle from log entries
 */
export async function createEvidenceBundle(
  entries: LogEntry[],
  exporter = 'vast-framework'
): Promise<EvidenceBundle> {
  const bundle: EvidenceBundle = {
    metadata: {
      version: '1.0.0',
      exportedAt: Date.now(),
      exporter,
      entryCount: 0,
    },
    decisions: [],
    sths: [],
    proofs: [],
    rules: [],
    publicKeys: {},
  };

  const seenSTHs = new Set<string>();
  const seenRules = new Set<string>();

  for (const entry of entries) {
    if (!entry.blockchain) continue;

    // Add decision
    bundle.decisions.push({
      id: entry.blockchain.decision_id,
      dt: entry.blockchain.dt,
      leafHash: entry.blockchain.leaf_hash,
    });

    // Add STH (if not already added)
    if (entry.blockchain.sth?.root && !seenSTHs.has(entry.blockchain.sth.root)) {
      seenSTHs.add(entry.blockchain.sth.root);
      bundle.sths.push({
        root: entry.blockchain.sth.root,
        size: entry.blockchain.sth.size,
        t: entry.blockchain.sth.t,
        hubPubkey: entry.blockchain.sth.hub_pubkey,
        hubSignature: entry.blockchain.sth.hub_signature,
      });
    }

    // Add proof
    if (entry.blockchain.inclusion_proof?.siblings.length > 0) {
      bundle.proofs.push({
        decisionId: entry.blockchain.decision_id,
        sthRoot: entry.blockchain.sth.root,
        leafIndex: entry.blockchain.inclusion_proof.index,
        siblings: entry.blockchain.inclusion_proof.siblings,
        directions: entry.blockchain.inclusion_proof.directions,
      });
    }

    // Add rule (if not already added)
    if (!seenRules.has(entry.blockchain.rid)) {
      seenRules.add(entry.blockchain.rid);
      const { mockLedger } = await import('./ledger.mock');
      const ruleHash = mockLedger.rules.getRuleHash(entry.blockchain.rid);
      if (ruleHash) {
        bundle.rules.push({
          rid: entry.blockchain.rid,
          hash: ruleHash,
          activatedAt: Date.now(), // Would fetch from registry in production
        });
      }
    }

    // Capture public keys
    if (!bundle.publicKeys.agent && entry.blockchain.dt.agent_pubkey) {
      bundle.publicKeys.agent = entry.blockchain.dt.agent_pubkey;
    }
    if (!bundle.publicKeys.hub && entry.blockchain.sth?.hub_pubkey) {
      bundle.publicKeys.hub = entry.blockchain.sth.hub_pubkey;
    }
  }

  bundle.metadata.entryCount = bundle.decisions.length;
  return bundle;
}

/**
 * Export evidence bundle to JSON string
 */
export function exportEvidenceBundle(bundle: EvidenceBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/**
 * Export evidence bundle to downloadable file
 */
export function downloadEvidenceBundle(
  bundle: EvidenceBundle,
  filename?: string
): void {
  const json = exportEvidenceBundle(bundle);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `vast-evidence-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Parse evidence bundle from JSON string
 */
export function parseEvidenceBundle(json: string): EvidenceBundle {
  const parsed = JSON.parse(json);
  
  // Basic validation
  if (!parsed.metadata || !parsed.decisions) {
    throw new Error('Invalid evidence bundle format');
  }
  
  return parsed as EvidenceBundle;
}

/**
 * Create minimal evidence for a single decision
 */
export async function createSingleEvidence(
  entry: LogEntry
): Promise<EvidenceBundle | null> {
  if (!entry.blockchain) return null;
  return createEvidenceBundle([entry], 'vast-single-export');
}
