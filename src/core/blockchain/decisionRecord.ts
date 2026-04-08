/**
 * VAST-Blockchain Decision Record (dt)
 * 
 * Represents a signed, immutable record of a VAST decision.
 * Captures all relevant metadata for later verification and auditing.
 */

import { LogEntry, Belief, GaugeScores } from '../types';
import { canonicalJson, sha256, sign, generateUUID } from './crypto';
import { getBlockchainConfig } from './config';

/** Decision Record - the core dt structure */
export interface DecisionRecord {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Timestamp in epoch milliseconds */
  t: number;
  
  /** Rule Set ID - identifies which governance rules were active */
  rid: string;
  
  /** Hash of the VAST model/framework version */
  model_hash: string;
  
  /** Commitment to the inputs (scenario + candidate actions) */
  input_commitment: string; // base64 sha256
  
  /** Commitment to the justification chain and beliefs */
  justification_commitment: string; // base64 sha256
  
  /** The chosen action */
  action: string;
  
  /** Compact summary of EEUCC constraints/penalties */
  constraint_summary: ConstraintSummary;
  
  /** Agent's public key (JWK format, base64-encoded) */
  agent_pubkey: string;
  
  /** Agent's signature over the decision record (base64) */
  agent_signature: string;
  
  /** Beliefs before decision (for reference) */
  beliefs_before?: Belief[];
  
  /** Beliefs after decision (for reference) */
  beliefs_after?: Belief[];
  
  /** Gauge scores at decision time */
  gauge_values?: GaugeScores;
}

/** Compact constraint summary from EEUCC */
export interface ConstraintSummary {
  /** Total penalty applied */
  total_penalty: number;
  
  /** Number of constraints violated */
  violation_count: number;
  
  /** IDs of violated constraints */
  violated_constraints: string[];
  
  /** Final EEU value */
  final_eeu: number;
  
  /** Base EU before penalties */
  base_eu: number;
  
  /** Any alerts triggered */
  alerts: string[];
}

/** Salts for commitment schemes (optional but recommended) */
export interface CommitmentSalts {
  input_salt: string;
  justification_salt: string;
}

/**
 * Convert a LogEntry to a DecisionRecord (dt).
 * 
 * @param logEntry - The VAST log entry
 * @param rid - Rule set ID
 * @param modelHash - Hash of the VAST model version
 * @param salts - Optional salts for commitment hiding
 * @param agentPublicKey - Agent's public key (JWK as string)
 * @returns The decision record ready for signing
 */
export async function toDecisionRecord(
  logEntry: LogEntry,
  rid: string,
  modelHash: string,
  salts?: CommitmentSalts,
  agentPublicKey?: string
): Promise<Omit<DecisionRecord, 'agent_signature'>> {
  // Generate unique ID
  const id = generateUUID();
  
  // Create input commitment (scenario inputs + candidate actions)
  const inputData = {
    scenario_id: logEntry.scenario_id,
    perception: logEntry.perception,
    candidate_actions: logEntry.candidate_actions,
    seed: logEntry.seed,
    salts: salts?.input_salt,
  };
  const input_commitment = await sha256(canonicalJson(inputData));
  
  // Create justification commitment (beliefs + justification chain)
  const justificationData = {
    beliefs_before: logEntry.beliefs_before,
    beliefs_after: logEntry.beliefs_after,
    justification_chain: logEntry.justification_chain,
    jwmc_metrics: logEntry.jwmc_metrics,
    salts: salts?.justification_salt,
  };
  const justification_commitment = await sha256(canonicalJson(justificationData));
  
  // Build constraint summary from chosen action's EEUCC breakdown
  const chosenBreakdown = logEntry.eeucc_breakdown.find(
    b => b.action_id === logEntry.chosen_action
  );
  
  const constraint_summary: ConstraintSummary = chosenBreakdown
    ? {
        total_penalty: chosenBreakdown.constraints.reduce(
          (sum, c) => sum + c.penalty,
          0
        ),
        violation_count: chosenBreakdown.constraints.length,
        violated_constraints: chosenBreakdown.constraints.map(c => c.constraint_id),
        final_eeu: chosenBreakdown.eeu_total,
        base_eu: chosenBreakdown.eu_base,
        alerts: (logEntry.alerts || []).map(a => a.message),
      }
    : {
        total_penalty: 0,
        violation_count: 0,
        violated_constraints: [],
        final_eeu: 0,
        base_eu: 0,
        alerts: [],
      };
  
  // Use provided pubkey or placeholder
  const agent_pubkey = agentPublicKey || '';
  
  return {
    id,
    t: logEntry.timestamp,
    rid,
    model_hash: modelHash,
    input_commitment,
    justification_commitment,
    action: logEntry.chosen_action,
    constraint_summary,
    agent_pubkey,
    // agent_signature is added later by signDecisionRecord
    beliefs_before: logEntry.beliefs_before,
    beliefs_after: logEntry.beliefs_after,
    gauge_values: logEntry.gauge_scores,
  };
}

/**
 * Sign a decision record with the agent's private key.
 * 
 * @param dt - The decision record (without signature)
 * @param privateKey - Agent's private key (JWK)
 * @returns The signed decision record
 */
export async function signDecisionRecord(
  dt: Omit<DecisionRecord, 'agent_signature'>,
  privateKey: JsonWebKey
): Promise<DecisionRecord> {
  // Create canonical representation for signing (excluding signature field)
  const dtForSigning = {
    id: dt.id,
    t: dt.t,
    rid: dt.rid,
    model_hash: dt.model_hash,
    input_commitment: dt.input_commitment,
    justification_commitment: dt.justification_commitment,
    action: dt.action,
    constraint_summary: dt.constraint_summary,
    agent_pubkey: dt.agent_pubkey,
    // beliefs and gauge_values are NOT signed (for size efficiency)
  };
  
  const canonical = canonicalJson(dtForSigning);
  const signature = await sign(privateKey, canonical);
  
  return {
    id: dt.id,
    t: dt.t,
    rid: dt.rid,
    model_hash: dt.model_hash,
    input_commitment: dt.input_commitment,
    justification_commitment: dt.justification_commitment,
    action: dt.action,
    constraint_summary: dt.constraint_summary,
    agent_pubkey: dt.agent_pubkey,
    agent_signature: signature,
    beliefs_before: dt.beliefs_before,
    beliefs_after: dt.beliefs_after,
    gauge_values: dt.gauge_values,
  };
}

/**
 * Hash a decision record for Merkle leaf inclusion.
 * Returns base64-encoded SHA-256 of canonical JSON.
 */
export async function hashDecisionRecord(dt: DecisionRecord): Promise<string> {
  const canonical = canonicalJson(dt);
  return await sha256(canonical);
}

/**
 * Verify a decision record's signature.
 * 
 * @param dt - The signed decision record
 * @returns True if signature is valid
 */
export async function verifyDecisionRecord(dt: DecisionRecord): Promise<boolean> {
  // Reconstruct the canonical data that was signed
  const dtForVerification = {
    id: dt.id,
    t: dt.t,
    rid: dt.rid,
    model_hash: dt.model_hash,
    input_commitment: dt.input_commitment,
    justification_commitment: dt.justification_commitment,
    action: dt.action,
    constraint_summary: dt.constraint_summary,
    agent_pubkey: dt.agent_pubkey,
  };
  
  const canonical = canonicalJson(dtForVerification);
  
  // Parse the public key from the stored string
  const publicKey = JSON.parse(dt.agent_pubkey);
  
  return await verifySignature(publicKey, canonical, dt.agent_signature);
}

/**
 * Verify signature helper.
 * (Re-imported from crypto to avoid circular dependency in some bundlers)
 */
async function verifySignature(
  publicKeyJwk: JsonWebKey,
  data: string,
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
      false,
      ['verify']
    );
    
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    
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
 * Compute a model hash from VAST configuration.
 * This should capture the framework version and key parameters.
 */
export async function computeModelHash(
  frameworkVersion: string,
  config: unknown
): Promise<string> {
  const modelData = {
    version: frameworkVersion,
    config,
    timestamp: Date.now(), // Include timestamp to version the hash
  };
  return await sha256(canonicalJson(modelData));
}
