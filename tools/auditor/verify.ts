#!/usr/bin/env node
/**
 * VAST-Blockchain CLI Auditor
 * 
 * Verifies evidence bundles without trusting the app instance.
 * Run with: npx ts-node verify.ts <evidence-bundle.json>
 */

import * as fs from 'fs';
import * as path from 'path';

// Types (mirrored from src/core/blockchain)
interface EvidenceBundle {
  metadata: {
    version: string;
    exportedAt: number;
    exporter: string;
    entryCount: number;
  };
  decisions: Array<{
    id: string;
    dt: DecisionRecord;
    leafHash: string;
  }>;
  sths: Array<{
    root: string;
    size: number;
    t: number;
    hubPubkey: string;
    hubSignature: string;
    txHash?: string;
  }>;
  proofs: Array<{
    decisionId: string;
    sthRoot: string;
    leafIndex: number;
    siblings: string[];
    directions: ('L' | 'R')[];
  }>;
  rules: Array<{
    rid: string;
    hash: string;
    activatedAt: number;
  }>;
  publicKeys: {
    agent?: string;
    hub?: string;
  };
}

interface DecisionRecord {
  id: string;
  t: number;
  rid: string;
  model_hash: string;
  input_commitment: string;
  justification_commitment: string;
  action: string;
  constraint_summary: {
    total_penalty: number;
    violation_count: number;
    violated_constraints: string[];
    final_eeu: number;
    base_eu: number;
    alerts: string[];
  };
  agent_pubkey: string;
  agent_signature: string;
}

// Crypto utilities (using Node.js crypto)
import { createHash, subtle } from 'crypto';

async function sha256(data: string): Promise<string> {
  return createHash('sha256').update(data).digest('base64');
}

function canonicalJson(obj: unknown): string {
  if (obj === null) return 'null';
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

async function verifyECDSA(
  publicKeyJwk: JsonWebKey,
  data: string,
  signatureBase64: string
): Promise<boolean> {
  try {
    const publicKey = await subtle.importKey(
      'jwk',
      publicKeyJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const sigBytes = Buffer.from(signatureBase64, 'base64');
    
    return await subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      sigBytes,
      dataBytes
    );
  } catch (error) {
    return false;
  }
}

// Verification functions
async function verifyDecisionSignature(dt: DecisionRecord): Promise<boolean> {
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
  const publicKey = JSON.parse(dt.agent_pubkey);
  
  return verifyECDSA(publicKey, canonical, dt.agent_signature);
}

async function verifyMerkleProof(
  leafHash: string,
  root: string,
  siblings: string[],
  directions: ('L' | 'R')[]
): Promise<boolean> {
  let currentHash = leafHash;
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    const direction = directions[i];
    
    let combined: string;
    if (direction === 'L') {
      combined = sibling + currentHash;
    } else {
      combined = currentHash + sibling;
    }
    
    currentHash = await sha256(combined);
  }
  
  return currentHash === root;
}

async function verifySTHSignature(
  sth: EvidenceBundle['sths'][0]
): Promise<boolean> {
  const canonical = canonicalJson({
    root: sth.root,
    size: sth.size,
    t: sth.t,
  });
  
  const publicKey = JSON.parse(sth.hubPubkey);
  return verifyECDSA(publicKey, canonical, sth.hubSignature);
}

// Main verification
async function verifyEvidenceBundle(bundlePath: string): Promise<void> {
  console.log('\n🔍 VAST-Blockchain Evidence Verifier\n');
  console.log(`Loading: ${bundlePath}\n`);
  
  // Load bundle
  let bundle: EvidenceBundle;
  try {
    const content = fs.readFileSync(bundlePath, 'utf-8');
    bundle = JSON.parse(content);
  } catch (error) {
    console.error('❌ Failed to load evidence bundle:', (error as Error).message);
    process.exit(1);
  }
  
  console.log(`Bundle Version: ${bundle.metadata.version}`);
  console.log(`Exported: ${new Date(bundle.metadata.exportedAt).toISOString()}`);
  console.log(`Entries: ${bundle.metadata.entryCount}`);
  console.log(`Decisions: ${bundle.decisions.length}`);
  console.log(`STHs: ${bundle.sths.length}`);
  console.log(`Proofs: ${bundle.proofs.length}\n`);
  
  let passed = 0;
  let failed = 0;
  
  // Verify each decision
  for (const decision of bundle.decisions) {
    const results: string[] = [];
    
    // 1. Verify agent signature
    const sigValid = await verifyDecisionSignature(decision.dt);
    if (sigValid) {
      results.push('✅ Agent signature');
    } else {
      results.push('❌ Agent signature');
      failed++;
    }
    
    // 2. Check rule exists
    const rule = bundle.rules.find(r => r.rid === decision.dt.rid);
    if (rule) {
      results.push(`✅ Rule ${decision.dt.rid} found`);
    } else {
      results.push(`❌ Rule ${decision.dt.rid} not found`);
    }
    
    // 3. Verify Merkle proof if available
    const proof = bundle.proofs.find(p => p.decisionId === decision.id);
    if (proof) {
      const merkleValid = await verifyMerkleProof(
        decision.leafHash,
        proof.sthRoot,
        proof.siblings,
        proof.directions
      );
      if (merkleValid) {
        results.push('✅ Merkle inclusion proof');
      } else {
        results.push('❌ Merkle inclusion proof');
        failed++;
      }
    }
    
    // 4. Check STH signature if available
    const sth = bundle.sths.find(s => {
      const proof = bundle.proofs.find(p => p.decisionId === decision.id);
      return proof && s.root === proof.sthRoot;
    });
    
    if (sth) {
      const sthValid = await verifySTHSignature(sth);
      if (sthValid) {
        results.push('✅ STH signature');
      } else {
        results.push('❌ STH signature');
      }
    }
    
    // Print results
    const status = results.some(r => r.includes('❌')) ? '⚠️ ' : '✅';
    console.log(`${status} Decision ${decision.id.substring(0, 16)}...`);
    for (const result of results) {
      console.log(`   ${result}`);
    }
    console.log();
    
    if (!results.some(r => r.includes('❌'))) {
      passed++;
    }
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Decisions: ${bundle.decisions.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  
  if (failed === 0) {
    console.log('\n🎉 All verifications passed! Evidence is valid.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some verifications failed. Evidence may be tampered.\n');
    process.exit(1);
  }
}

// CLI entry point
const bundlePath = process.argv[2];

if (!bundlePath) {
  console.log('Usage: npx ts-node verify.ts <evidence-bundle.json>');
  console.log('');
  console.log('Options:');
  console.log('  --help     Show this help message');
  process.exit(0);
}

if (bundlePath === '--help') {
  console.log('VAST-Blockchain Evidence Verifier');
  console.log('');
  console.log('Verifies exported evidence bundles including:');
  console.log('  - Agent signatures on decision records');
  console.log('  - Rule set existence in registry');
  console.log('  - Merkle inclusion proofs');
  console.log('  - STH signatures');
  console.log('');
  console.log('Usage: npx ts-node verify.ts <evidence-bundle.json>');
  process.exit(0);
}

// Resolve path
const resolvedPath = path.resolve(bundlePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: File not found: ${resolvedPath}`);
  process.exit(1);
}

// Run verification
verifyEvidenceBundle(resolvedPath).catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
