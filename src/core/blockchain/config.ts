/**
 * VAST-Blockchain Configuration
 * 
 * Controls blockchain integration settings including batching parameters,
 * chain mode selection, and rule set defaults.
 */

export type ChainMode = 'mock' | 'hardhat' | 'testnet';

export interface BlockchainConfig {
  /** Batch interval in seconds (default: 10) */
  batchIntervalSeconds: number;
  
  /** Batch size - number of decisions per batch (default: 25) */
  batchSize: number;
  
  /** Chain mode: mock (in-memory), hardhat (local), or testnet */
  chainMode: ChainMode;
  
  /** Default rule set ID for new decisions */
  defaultRuleSetId: string;
  
  /** WebCrypto algorithm parameters */
  crypto: {
    /** ECDSA curve for agent/hub keys */
    namedCurve: 'P-256' | 'P-384' | 'P-521';
    /** Hash algorithm for signatures */
    hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  };
  
  /** Local storage keys for persistence */
  storageKeys: {
    agentPrivateKey: string;
    agentPublicKey: string;
    hubPrivateKey: string;
    hubPublicKey: string;
    ledgerState: string;
  };
  
  /** EVM contract addresses (populated after deployment) */
  contractAddresses?: {
    ruleRegistry: string;
    anchorRegistry: string;
  };
  
  /** RPC endpoint for non-mock modes */
  rpcUrl?: string;
}

/** Default configuration */
export const DEFAULT_BLOCKCHAIN_CONFIG: BlockchainConfig = {
  batchIntervalSeconds: 10,
  batchSize: 25,
  chainMode: 'mock',
  defaultRuleSetId: 'vast-default-rules-v1',
  crypto: {
    namedCurve: 'P-256',
    hashAlgorithm: 'SHA-256',
  },
  storageKeys: {
    agentPrivateKey: 'vast_blockchain_agent_private_key',
    agentPublicKey: 'vast_blockchain_agent_public_key',
    hubPrivateKey: 'vast_blockchain_hub_private_key',
    hubPublicKey: 'vast_blockchain_hub_public_key',
    ledgerState: 'vast_blockchain_ledger_state',
  },
};

/** Get current config (can be overridden via localStorage or env) */
export function getBlockchainConfig(): BlockchainConfig {
  const stored = localStorage.getItem('vast_blockchain_config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_BLOCKCHAIN_CONFIG, ...parsed };
    } catch {
      console.warn('Failed to parse blockchain config from localStorage');
    }
  }
  return DEFAULT_BLOCKCHAIN_CONFIG;
}

/** Update config and persist to localStorage */
export function setBlockchainConfig(config: Partial<BlockchainConfig>): void {
  const current = getBlockchainConfig();
  const updated = { ...current, ...config };
  localStorage.setItem('vast_blockchain_config', JSON.stringify(updated));
}

/** Reset to defaults */
export function resetBlockchainConfig(): void {
  localStorage.removeItem('vast_blockchain_config');
}
