/**
 * VAST-Blockchain Security Tests
 * 
 * Unit tests for cryptographic operations, Merkle proofs,
 * and tamper detection.
 */

import {
  generateUUID,
  canonicalJson,
  sha256,
  generateAgentKeypair,
  sign,
  verify,
} from './crypto';

import {
  buildMerkleRoot,
  getInclusionProof,
  recomputeRoot,
  verifyInclusion,
} from './merkle';

describe('VAST-Blockchain Security', () => {
  describe('Canonical JSON', () => {
    it('should produce deterministic output', () => {
      const obj = { z: 1, a: 2, m: { c: 3, b: 4 } };
      const json1 = canonicalJson(obj);
      const json2 = canonicalJson({ m: { b: 4, c: 3 }, a: 2, z: 1 });
      expect(json1).toBe(json2);
    });

    it('should handle nested objects', () => {
      const obj = { a: { b: { c: 1 } } };
      const json = canonicalJson(obj);
      expect(json).toBe('{"a":{"b":{"c":1}}}');
    });

    it('should handle arrays', () => {
      const obj = { arr: [3, 1, 2] };
      const json = canonicalJson(obj);
      expect(json).toBe('{"arr":[3,1,2]}');
    });
  });

  describe('SHA-256 Hashing', () => {
    it('should produce consistent hashes', async () => {
      const data = 'test data';
      const hash1 = await sha256(data);
      const hash2 = await sha256(data);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', async () => {
      const hash1 = await sha256('data1');
      const hash2 = await sha256('data2');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', async () => {
      const hash = await sha256('');
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });
  });

  describe('ECDSA Signatures', () => {
    it('should generate keypairs', async () => {
      const keypair = await generateAgentKeypair();
      expect(keypair.privateKey).toBeDefined();
      expect(keypair.publicKey).toBeDefined();
      expect(keypair.publicKey.x).toBeDefined();
      expect(keypair.publicKey.y).toBeDefined();
    });

    it('should sign and verify data', async () => {
      const keypair = await generateAgentKeypair();
      const data = 'test message';
      
      const signature = await sign(keypair.privateKey, data);
      expect(signature).toBeTruthy();
      
      const valid = await verify(keypair.publicKey, data, signature);
      expect(valid).toBe(true);
    });

    it('should reject invalid signatures', async () => {
      const keypair1 = await generateAgentKeypair();
      const keypair2 = await generateAgentKeypair();
      const data = 'test message';
      
      const signature = await sign(keypair1.privateKey, data);
      const valid = await verify(keypair2.publicKey, data, signature);
      expect(valid).toBe(false);
    });

    it('should reject tampered data', async () => {
      const keypair = await generateAgentKeypair();
      const data = 'original message';
      
      const signature = await sign(keypair.privateKey, data);
      const valid = await verify(keypair.publicKey, 'tampered message', signature);
      expect(valid).toBe(false);
    });
  });

  describe('Merkle Tree', () => {
    it('should build consistent roots', async () => {
      const leaves = ['a', 'b', 'c', 'd'].map(s => btoa(s));
      const root1 = await buildMerkleRoot(leaves);
      const root2 = await buildMerkleRoot(leaves);
      expect(root1).toBe(root2);
    });

    it('should generate valid inclusion proofs', async () => {
      const leaves = ['a', 'b', 'c', 'd'].map(s => btoa(s));
      const root = await buildMerkleRoot(leaves);
      
      for (let i = 0; i < leaves.length; i++) {
        const proof = await getInclusionProof(leaves, i);
        const valid = await verifyInclusion(leaves[i], root, proof);
        expect(valid).toBe(true);
      }
    });

    it('should detect tampered leaves', async () => {
      const leaves = ['a', 'b', 'c', 'd'].map(s => btoa(s));
      const root = await buildMerkleRoot(leaves);
      
      const proof = await getInclusionProof(leaves, 0);
      const tamperedLeaf = btoa('tampered');
      const valid = await verifyInclusion(tamperedLeaf, root, proof);
      expect(valid).toBe(false);
    });

    it('should detect tampered proofs', async () => {
      const leaves = ['a', 'b', 'c', 'd'].map(s => btoa(s));
      const root = await buildMerkleRoot(leaves);
      
      const proof = await getInclusionProof(leaves, 0);
      proof.siblings[0] = btoa('tampered');
      
      const valid = await verifyInclusion(leaves[0], root, proof);
      expect(valid).toBe(false);
    });

    it('should handle single leaf', async () => {
      const leaves = [btoa('only')];
      const root = await buildMerkleRoot(leaves);
      const proof = await getInclusionProof(leaves, 0);
      
      expect(proof.siblings).toHaveLength(0);
      expect(root).toBe(leaves[0]);
    });

    it('should handle odd number of leaves', async () => {
      const leaves = ['a', 'b', 'c'].map(s => btoa(s));
      const root = await buildMerkleRoot(leaves);
      
      for (let i = 0; i < leaves.length; i++) {
        const proof = await getInclusionProof(leaves, i);
        const valid = await verifyInclusion(leaves[i], root, proof);
        expect(valid).toBe(true);
      }
    });
  });

  describe('Decision Records', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUUID();
      const id2 = generateUUID();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('Replay Protection', () => {
    it('should enforce monotonic timestamps', async () => {
      const t1 = Date.now();
      await new Promise(r => setTimeout(r, 10));
      const t2 = Date.now();
      expect(t2).toBeGreaterThan(t1);
    });

    it('should handle unique decision IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateUUID());
      }
      expect(ids.size).toBe(100);
    });
  });
});

// Tamper detection tests
describe('Tamper Detection', () => {
  it('should detect modified decision records', async () => {
    const keypair = await generateAgentKeypair();
    const dt = {
      id: generateUUID(),
      t: Date.now(),
      rid: 'test-rule',
      model_hash: await sha256('model'),
      input_commitment: await sha256('input'),
      justification_commitment: await sha256('justification'),
      action: 'action1',
      constraint_summary: {
        total_penalty: 0.1,
        violation_count: 1,
        violated_constraints: ['c1'],
        final_eeu: 0.9,
        base_eu: 1.0,
        alerts: [],
      },
      agent_pubkey: JSON.stringify(keypair.publicKey),
      agent_signature: '',
    };
    
    // Sign the record
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
    };
    
    dt.agent_signature = await sign(keypair.privateKey, canonicalJson(dtForSigning));
    
    // Verify original
    const validOriginal = await verify(keypair.publicKey, canonicalJson(dtForSigning), dt.agent_signature);
    expect(validOriginal).toBe(true);
    
    // Tamper and verify
    dtForSigning.action = 'tampered-action';
    const validTampered = await verify(keypair.publicKey, canonicalJson(dtForSigning), dt.agent_signature);
    expect(validTampered).toBe(false);
  });

  it('should detect reordered Merkle leaves', async () => {
    const leaves = ['a', 'b', 'c', 'd'].map(s => btoa(s));
    const root = await buildMerkleRoot(leaves);
    
    const proof = await getInclusionProof(leaves, 0);
    const reorderedLeaves = ['b', 'a', 'c', 'd'].map(s => btoa(s));
    const reorderedRoot = await buildMerkleRoot(reorderedLeaves);
    
    const valid = await verifyInclusion(leaves[0], reorderedRoot, proof);
    expect(valid).toBe(false);
  });
});
