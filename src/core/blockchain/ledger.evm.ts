/**
 * VAST-Blockchain EVM Ledger Client (Stub)
 * 
 * This is a stub implementation. For full EVM support:
 * 1. Install ethers: npm install ethers
 * 2. Implement full EVM client
 */

import type { SignedTreeHead } from './merkle';
import type { RuleEntry, GovernanceRecord, RuleFlags } from './rules';
import type { AnchorEntry } from './ledger.mock';

export class EVMLedger {
  private initialized = false;

  async initialize(): Promise<void> {
    throw new Error('EVM ledger requires ethers. Install: npm install ethers');
  }

  async registerRule(rid: string, ruleHash: string, flags: RuleFlags): Promise<RuleEntry> {
    throw new Error('Not implemented');
  }

  async getRuleHash(rid: string): Promise<string | undefined> {
    return undefined;
  }

  async proposeUpdate(rid: string, newHash: string, proposer: string, timelockSeconds = 0): Promise<GovernanceRecord> {
    throw new Error('Not implemented');
  }

  async approveUpdate(rid: string, proposalId: string, approver: string): Promise<GovernanceRecord> {
    throw new Error('Not implemented');
  }

  async finalizeUpdate(rid: string, proposalId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async anchorSTH(sth: SignedTreeHead): Promise<AnchorEntry> {
    throw new Error('Not implemented');
  }

  async isAnchored(root: string): Promise<boolean> {
    return false;
  }

  async getAnchor(root: string): Promise<AnchorEntry | undefined> {
    return undefined;
  }

  async listAnchors(): Promise<AnchorEntry[]> {
    return [];
  }
}

export const evmLedger = new EVMLedger();
