/**
 * VAST-Blockchain Rule Governance Types
 * 
 * Governance lifecycle: propose -> approve -> finalize
 * Supports locked vs mutable rules with timelock option.
 */

/** Rule lifecycle states */
export type RuleState = 'Draft' | 'Active' | 'Deprecated';

/** Rule flags for governance behavior */
export interface RuleFlags {
  /** If true, rule cannot be modified without governance flow */
  locked: boolean;
  /** If true, rule can be updated via governance even if locked */
  mutable: boolean;
}

/** Governance proposal record */
export interface GovernanceRecord {
  /** Unique proposal ID */
  proposalId: string;
  
  /** Who proposed the update */
  proposer: string;
  
  /** Addresses that have approved */
  approvals: string[];
  
  /** Required approvals to finalize */
  approvalThreshold: number;
  
  /** When the proposal can be finalized (epoch ms, 0 = no timelock) */
  timelockUntil: number;
  
  /** Current state */
  state: 'Pending' | 'Approved' | 'Finalized' | 'Rejected';
  
  /** Hash of the proposed rule */
  newRuleHash: string;
  
  /** When the proposal was created */
  createdAt: number;
}

/** Individual rule version in history */
export interface RuleVersion {
  /** Rule hash */
  hash: string;
  
  /** When this version became active */
  activatedAt: number;
  
  /** Governance record that authorized this version (if applicable) */
  governanceRecord?: string;
  
  /** State of this version */
  state: RuleState;
}

/** Complete rule entry with history */
export interface RuleEntry {
  /** Rule ID */
  rid: string;
  
  /** Current active version */
  currentVersion: RuleVersion;
  
  /** Version history (oldest first) */
  history: RuleVersion[];
  
  /** Governance flags */
  flags: RuleFlags;
  
  /** Pending proposals */
  proposals: Map<string, GovernanceRecord>;
  
  /** Default approval threshold */
  defaultThreshold: number;
}

/** Proposal creation parameters */
export interface ProposalParams {
  rid: string;
  newHash: string;
  proposer: string;
  timelockSeconds?: number;
}

/** Approval parameters */
export interface ApprovalParams {
  rid: string;
  proposalId: string;
  approver: string;
}

/** Finalization parameters */
export interface FinalizationParams {
  rid: string;
  proposalId: string;
}

/** Rule registration parameters */
export interface RegisterRuleParams {
  rid: string;
  ruleHash: string;
  flags: RuleFlags;
  proposer?: string;
}

/** UI-friendly rule display */
export interface RuleDisplay {
  rid: string;
  currentHash: string;
  state: RuleState;
  isLocked: boolean;
  isMutable: boolean;
  activatedAt: string;
  versionCount: number;
  pendingProposals: number;
}

/** UI-friendly proposal display */
export interface ProposalDisplay {
  proposalId: string;
  rid: string;
  proposer: string;
  newHash: string;
  approvals: number;
  threshold: number;
  state: GovernanceRecord['state'];
  timelockUntil: number;
  createdAt: string;
  canFinalize: boolean;
}

/**
 * Check if a proposal can be finalized.
 */
export function canFinalize(proposal: GovernanceRecord): boolean {
  if (proposal.state !== 'Approved') return false;
  if (proposal.timelockUntil > 0 && Date.now() < proposal.timelockUntil) return false;
  return true;
}

/**
 * Format timelock for display.
 */
export function formatTimelock(timelockUntil: number): string {
  if (timelockUntil === 0) return 'No timelock';
  const remaining = timelockUntil - Date.now();
  if (remaining <= 0) return 'Ready to finalize';
  const hours = Math.ceil(remaining / (1000 * 60 * 60));
  return `${hours} hours remaining`;
}

/**
 * Generate a proposal ID from parameters.
 */
export async function generateProposalId(
  rid: string,
  newHash: string,
  proposer: string
): Promise<string> {
  const data = `${rid}:${newHash}:${proposer}:${Date.now()}`;
  const { sha256 } = await import('./crypto');
  const hash = await sha256(data);
  return `prop-${hash.substring(0, 16)}`;
}
