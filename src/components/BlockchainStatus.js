import React, { useEffect, useMemo, useState } from 'react';
import './BlockchainStatus.css';
import { getBlockchainConfig } from '../core/blockchain/config';
import { anchoringHub } from '../core/blockchain/anchoringHub';
import { getOrCreateAgentKeypair, getOrCreateHubKeypair } from '../core/blockchain/crypto';

function short(value, n = 16) {
  if (!value) return '';
  if (value.length <= n) return value;
  return `${value.slice(0, n)}...`;
}

function stringifyKey(jwk) {
  try {
    return JSON.stringify(jwk);
  } catch {
    return String(jwk);
  }
}

function safeCopy(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
}

const BlockchainStatus = () => {
  const [config, setConfig] = useState(() => getBlockchainConfig());
  const [agentPub, setAgentPub] = useState('');
  const [hubPub, setHubPub] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [sths, setSths] = useState([]);
  const contracts = useMemo(() => {
    const c = config.contractAddresses;
    return {
      ruleRegistry: c?.ruleRegistry || '(not set)',
      anchorRegistry: c?.anchorRegistry || '(not set)',
    };
  }, [config.contractAddresses]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setConfig(getBlockchainConfig());

        // Ensure hub is running and can load history.
        anchoringHub.start();
        anchoringHub.loadFromStorage();

        const [agent, hub] = await Promise.all([
          getOrCreateAgentKeypair(),
          getOrCreateHubKeypair(),
        ]);

        if (!mounted) return;
        setAgentPub(stringifyKey(agent.publicKey));
        setHubPub(stringifyKey(hub.publicKey));
        setPendingCount(anchoringHub.getPendingCount());
        setSths(anchoringHub.getSTHHistory());
      } catch {
        // Intentionally silent: status screen will render what it can.
      }
    };

    load();

    const timer = window.setInterval(() => {
      try {
        if (!mounted) return;
        setPendingCount(anchoringHub.getPendingCount());
        setSths(anchoringHub.getSTHHistory());
      } catch {
        // ignore
      }
    }, 1000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="blockchain-status">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Blockchain Status</h2>
          <p className="card-description">Chain mode, contracts, keys, and anchored Signed Tree Heads (STHs)</p>
        </div>

        <div className="bc-grid">
          <div className="bc-panel">
            <h3 className="bc-panel-title">Chain Configuration</h3>
            <div className="bc-row">
              <span className="bc-label">Mode</span>
              <span className={`bc-value bc-mode bc-mode-${config.chainMode}`}>{String(config.chainMode).toUpperCase()}</span>
            </div>
            <div className="bc-row">
              <span className="bc-label">Batch Interval</span>
              <span className="bc-value">{config.batchIntervalSeconds}s</span>
            </div>
            <div className="bc-row">
              <span className="bc-label">Batch Size</span>
              <span className="bc-value">{config.batchSize}</span>
            </div>
            <div className="bc-row">
              <span className="bc-label">Default RID</span>
              <span className="bc-value mono">{config.defaultRuleSetId}</span>
            </div>
            <div className="bc-row">
              <span className="bc-label">Contract: RuleRegistry</span>
              <span className="bc-value mono" title={contracts.ruleRegistry}>{short(contracts.ruleRegistry, 20)}</span>
            </div>
            <div className="bc-row">
              <span className="bc-label">Contract: AnchorRegistry</span>
              <span className="bc-value mono" title={contracts.anchorRegistry}>{short(contracts.anchorRegistry, 20)}</span>
            </div>
          </div>

          <div className="bc-panel">
            <h3 className="bc-panel-title">Keys</h3>

            <div className="bc-key">
              <div className="bc-key-header">
                <span className="bc-label">Agent Public Key</span>
                <button className="bc-copy" onClick={() => safeCopy(agentPub)} disabled={!agentPub}>
                  Copy
                </button>
              </div>
              <div className="bc-key-value mono">{agentPub || 'Loading...'}</div>
            </div>

            <div className="bc-key">
              <div className="bc-key-header">
                <span className="bc-label">Hub Public Key</span>
                <button className="bc-copy" onClick={() => safeCopy(hubPub)} disabled={!hubPub}>
                  Copy
                </button>
              </div>
              <div className="bc-key-value mono">{hubPub || 'Loading...'}</div>
            </div>
          </div>
        </div>

        <div className="bc-anchors">
          <div className="bc-anchors-header">
            <h3 className="bc-panel-title">Anchored STHs ({sths.length})</h3>
            <div className="bc-meta">Pending leaves: {pendingCount}</div>
          </div>

          {sths.length === 0 ? (
            <div className="bc-empty">No anchors yet. Run scenarios and wait for batches to close.</div>
          ) : (
            <div className="bc-table-wrap">
              <table className="bc-table">
                <thead>
                  <tr>
                    <th>Root</th>
                    <th>Size</th>
                    <th>Anchored At</th>
                    <th>Hub PubKey</th>
                  </tr>
                </thead>
                <tbody>
                  {sths.slice().reverse().map((sth) => (
                    <tr key={sth.root}>
                      <td className="mono" title={sth.root}>{short(sth.root, 20)}</td>
                      <td>{sth.size}</td>
                      <td>{sth.t ? new Date(sth.t).toLocaleString() : '-'}</td>
                      <td className="mono" title={sth.hub_pubkey}>{short(sth.hub_pubkey, 20)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainStatus;
