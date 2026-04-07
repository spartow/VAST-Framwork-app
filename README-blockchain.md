# VAST-Blockchain Integration

## Integration Points & Hook Locations

### Decision Computation Path

1. **Primary Decision Function**: `src/core/VASTFramework.js`
   - Function: `eeuCcDecision(actions, context)` (lines 182-254)
   - This is where actions are evaluated and the final decision is made
   - Returns: `{selectedAction, utilities, calculations, processingTime}`
   - Currently pushes to `this.decisionLog` directly (lines 220-228)

2. **LogManager Hook Point**: `src/core/log/LogManager.ts`
   - Method: `append(entry)` (line 29)
   - This is the **primary integration point** for post-decision processing
   - Called whenever a new decision is logged
   - Currently receives `Omit<LogEntry, 'tick' | 'timestamp' | 'scenario_id'>`
   - Returns: `LogEntry` with added tick, timestamp, scenario_id

### LogEntry Structure Mapping

Current `LogEntry` (from `src/core/types.ts` lines 140-174):

```typescript
interface LogEntry {
  tick: number;                          // Monotonic counter
  timestamp: number;                   // Epoch ms
  
  // Perception phase
  perception?: {
    event: string;
    evidence?: any;
    source?: string;
  };
  
  // Belief revision phase (JWMC)
  beliefs_before: Belief[];            // Pre-decision beliefs
  beliefs_after: Belief[];             // Post-decision beliefs
  jwmc_metrics?: {
    alpha: number;
    beta: number;
    gamma: number;
    deltas: BeliefDelta[];
  };
  
  // Decision phase (EEUCC)
  candidate_actions: string[];
  eeucc_breakdown: EUBreakdown[];      // EU, penalties, violations per action
  chosen_action: string;               // Final selected action
  justification_chain: string[];       // Why this action
  
  // Monitoring phase
  gauge_scores: GaugeScores;           // VAST gauges
  alerts: GaugeAlert[];
  
  // Metadata
  scenario_id: string;
  seed?: number;
}
```

### Blockchain Field Mapping

| DecisionRecord Field | LogEntry Source |
|---------------------|-----------------|
| `id` | Generate UUID |
| `t` | `timestamp` (epoch ms) |
| `rid` | From config default or governance |
| `model_hash` | Hash of VAST framework version/config |
| `input_commitment` | `sha256(canonicalJson(scenario inputs + candidate_actions))` |
| `justification_commitment` | `sha256(canonicalJson(justification_chain + beliefs_used))` |
| `action` | `chosen_action` |
| `constraint_summary` | Compact from `eeucc_breakdown` (penalties/alerts) |
| `agent_pubkey` | From localStorage keypair |
| `agent_signature` | ECDSA signature over canonical dt |
| `beliefs_before` | `beliefs_before` |
| `beliefs_after` | `beliefs_after` |
| `gauge_values` | `gauge_scores` |
| `eeucc_penalty_summary` | Extracted from chosen action's EEUCC breakdown |

### AuditTrail UI Component

**Location**: `src/components/AuditTrail.js` (lines 1-154)

- Displays `auditData.decision_log` array
- Each entry shows: timestamp, action, utility, components, context, moral principles
- Has export JSON button at line 39
- **Extension point**: Add blockchain verification display and "Verify" button per entry

### Files to Modify

1. **Hook into decision pipeline**:
   - `src/core/log/LogManager.ts` - Modify `append()` to create DecisionRecord and push to AnchoringHub

2. **Extend types**:
   - `src/core/types.ts` - Add optional `blockchain` field to LogEntry

3. **Update UI**:
   - `src/components/AuditTrail.js` - Add blockchain display and verification

4. **New blockchain module** (create `src/core/blockchain/`):
   - `config.ts` - Blockchain configuration
   - `crypto.ts` - WebCrypto utilities
   - `decisionRecord.ts` - DecisionRecord type and conversion
   - `merkle.ts` - Merkle tree operations
   - `anchoringHub.ts` - Batch management and STH generation
   - `ledger.mock.ts` - In-memory rule and anchor registries

## Implementation Notes

- **Do NOT modify** JWMC/EEUCC math logic - VAST reasoning stays off-chain
- Only add integrity + governance + verification layers around existing audit/log pipeline
- Use WebCrypto API for all cryptographic operations (browser compatible)
- Keep all blockchain operations async to avoid blocking UI
- Use canonical JSON serialization for deterministic hashing

---

## How It Works

### Overview

The VAST-Blockchain integration adds cryptographic integrity, governance, and auditability layers around the existing VAST moral reasoning framework. All VAST reasoning (JWMC belief revision, EEUCC decision-making, gauge calculations) remains unchanged and off-chain.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VAST Framework                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Perceive │→ │  JWMC    │→ │  EEUCC   │→ │ Gauges   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ LogManager.append() ──→ DecisionRecord (dt)           │  │
│  │                      ──→ sign with agent key          │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                 VAST-Blockchain Layer                        │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │AnchoringHub │───→│Merkle Batcher│───→│ STH Signer  │    │
│  │             │    │(T=10s,N=25) │    │  (Hub Key)  │    │
│  └─────────────┘    └─────────────┘    └──────┬──────┘    │
│                                               │            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────▼──────┐    │
│  │RuleRegistry │    │AnchorRegistry│    │On-Chain    │    │
│  │(Governance) │    │  (Anchors)   │    │Anchor(EVM) │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Decision Record (dt) Structure

Each decision produces a cryptographically signed Decision Record:

```typescript
interface DecisionRecord {
  id: string;                    // UUID v4
  t: number;                     // Epoch timestamp (ms)
  rid: string;                   // Rule set ID
  model_hash: string;            // VAST framework version hash
  input_commitment: string;      // SHA-256 of inputs
  justification_commitment: string; // SHA-256 of reasoning
  action: string;                // Chosen action
  constraint_summary: {
    total_penalty: number;
    violation_count: number;
    violated_constraints: string[];
    final_eeu: number;
    base_eu: number;
    alerts: string[];
  };
  agent_pubkey: string;          // Agent's ECDSA P-256 public key
  agent_signature: string;       // Signature over canonical dt
}
```

### Merkle Batching & STHs

Decision records are batched into Merkle trees:

1. **Batching**: Decisions accumulate until either:
   - `T` seconds pass (default: 10s)
   - `N` decisions collected (default: 25)

2. **Merkle Tree**: Binary tree built with SHA-256
   - Leaf: `hash(canonicalJson(dt))`
   - Parent: `hash(left || right)`

3. **Signed Tree Head (STH)**:
```typescript
interface SignedTreeHead {
  root: string;           // Merkle root
  size: number;           // Number of leaves
  t: number;              // Timestamp
  hub_pubkey: string;     // Hub's public key
  hub_signature: string;  // Hub signs (root || size || t)
}
```

4. **Inclusion Proof**: Each decision gets a proof
   - Sibling hashes + directions (L/R)
   - Verifiable against STH root

### Rule Governance Lifecycle

Rules follow a governance flow for updates:

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Draft  │───→│ Proposed │───→│ Approved │───→│ Finalized│
└─────────┘    └──────────┘    └──────────┘    └──────────┘
                    ↑                │
                    └────────────────┘
                   (threshold reached)
```

- **Propose**: Create proposal with new rule hash
- **Approve**: Stakeholders add approvals (configurable threshold)
- **Finalize**: Execute after timelock (if set) and threshold met
- **Locked rules**: Require governance flow for any updates

### Verification Flow

To verify a decision:

1. **Verify Agent Signature**: Check ECDSA signature on dt
2. **Check Rule Registry**: Verify rid exists and matches expected hash
3. **Recompute Merkle Root**: Use inclusion proof + leaf hash
4. **Compare STH**: Root should match anchored STH
5. **Verify STH Signature**: Check hub signature
6. **Check On-Chain Anchor** (if using EVM): Verify STH is anchored

### Running the System

#### Mock Mode (Development)

```bash
# No blockchain needed - runs entirely in browser
npm start
# Default: batch interval 10s, batch size 25
```

#### Hardhat Local Network

```bash
# 1. Start Hardhat node
cd blockchain
npx hardhat node

# 2. Deploy contracts (new terminal)
npx hardhat run scripts/deploy.js --network localhost

# 3. Update app config
# Edit src/core/blockchain/config.ts:
# chainMode: 'hardhat'

# 4. Start app
npm start
```

#### Auditor CLI Verification

```bash
# Export evidence bundle from UI, then:
cd tools/auditor
npx ts-node verify.ts evidence-bundle.json

# Output shows:
# - Agent signature verification
# - Rule registry check
# - Merkle proof verification
# - STH signature check
# - PASS/FAIL summary
```

### File Structure

```
src/core/blockchain/
├── config.ts           # Blockchain configuration
├── crypto.ts           # WebCrypto utilities (SHA-256, ECDSA)
├── decisionRecord.ts   # Decision record types & signing
├── merkle.ts           # Merkle tree operations
├── anchoringHub.ts     # Batching & STH generation
├── ledger.mock.ts      # In-memory rule/anchor registries
├── ledger.evm.ts       # EVM contract interface (ethers.js)
├── rules.ts            # Governance types & utilities
├── evidence.ts         # Evidence bundle export
└── deployed.json       # Contract addresses (auto-generated)

src/components/
├── AuditTrail.js       # Extended with blockchain display
├── Rules.js            # Governance UI
└── EvidenceImport.js   # Import & verify external evidence

tools/auditor/
└── verify.ts           # CLI verification tool

blockchain/
├── contracts/
│   ├── RuleRegistry.sol    # On-chain governance
│   └── AnchorRegistry.sol  # On-chain anchoring
├── scripts/
│   └── deploy.js           # Deployment script
├── hardhat.config.js
└── package.json
```

### Security Properties

1. **Integrity**: Any tampering with dt, proof, or STH breaks verification
2. **Non-repudiation**: Agent signatures prove who made the decision
3. **Transparency**: All decisions publicly auditable via Merkle proofs
4. **Governance**: Rule updates require multi-party approval
5. **Replay protection**: Unique UUIDs + timestamps prevent replay

### Tamper Detection

| Tampered Component | Detection Method |
|-------------------|------------------|
| Decision record | ECDSA signature verification fails |
| Inclusion proof | Merkle root recomputation mismatch |
| STH signature | Hub signature verification fails |
| Rule reference | Rule registry lookup fails |
| Evidence bundle | Hash chain verification fails |

### Performance Considerations

- All crypto operations use WebCrypto (async, non-blocking)
- Batching amortizes verification costs
- Merkle proofs are O(log n) in tree size
- LocalStorage persistence for demo (use IndexedDB for production)
