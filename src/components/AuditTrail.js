import React, { useState } from 'react';
import './AuditTrail.css';

const AuditTrail = ({ auditData, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [verifyingEntry, setVerifyingEntry] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});

  if (!auditData || auditData.decision_log.length === 0) {
    return (
      <div className="audit-trail">
        <h2>Audit Trail</h2>
        <div className="no-audit">
          <p>No decisions logged yet. Make decisions to build the audit trail.</p>
        </div>
      </div>
    );
  }

  const filteredLog = auditData.decision_log.filter(entry => 
    entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.moralPrinciples.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    const dataStr = JSON.stringify(auditData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vast_audit_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const handleVerify = async (entry, index) => {
    setVerifyingEntry(index);
    
    try {
      const blockchain = entry.blockchain;
      if (!blockchain || !blockchain.dt) {
        setVerificationResults({
          ...verificationResults,
          [index]: { ok: false, reason: 'No blockchain record for this decision' }
        });
        return;
      }
      
      // Import verification functions
      const { verifyDecisionRecord } = await import('../core/blockchain/decisionRecord');
      const { verifyInclusion } = await import('../core/blockchain/merkle');
      const { mockLedger } = await import('../core/blockchain/ledger.mock');
      
      // 1. Verify agent signature on dt
      const signatureValid = await verifyDecisionRecord(blockchain.dt);
      if (!signatureValid) {
        setVerificationResults({
          ...verificationResults,
          [index]: { ok: false, reason: 'Agent signature verification failed' }
        });
        return;
      }
      
      // 2. Check rid exists in registry
      const ruleHash = mockLedger.rules.getRuleHash(blockchain.rid);
      if (!ruleHash) {
        setVerificationResults({
          ...verificationResults,
          [index]: { ok: false, reason: `Rule ${blockchain.rid} not found in registry` }
        });
        return;
      }
      
      // 3. Verify Merkle inclusion proof
      if (blockchain.inclusion_proof && blockchain.inclusion_proof.siblings.length > 0) {
        const merkleValid = await verifyInclusion(
          blockchain.leaf_hash,
          blockchain.sth.root,
          blockchain.inclusion_proof
        );
        if (!merkleValid) {
          setVerificationResults({
            ...verificationResults,
            [index]: { ok: false, reason: 'Merkle inclusion proof verification failed' }
          });
          return;
        }
      }
      
      // All checks passed
      setVerificationResults({
        ...verificationResults,
        [index]: { ok: true, checkedAt: Date.now() }
      });
      
    } catch (error) {
      setVerificationResults({
        ...verificationResults,
        [index]: { ok: false, reason: `Verification error: ${error.message}` }
      });
    } finally {
      setVerifyingEntry(null);
    }
  };

  return (
    <div className="audit-trail">
      <div className="audit-header">
        <h2>Audit Trail</h2>
        <button onClick={handleExport} className="btn-export">
          📥 Export JSON
        </button>
      </div>

      <div className="audit-summary">
        <div className="summary-card">
          <span className="summary-label">Total Decisions</span>
          <span className="summary-value">{auditData.decision_log.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Beliefs</span>
          <span className="summary-value">{auditData.beliefs.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Avg Processing Time</span>
          <span className="summary-value">
            {(auditData.performance_metrics.avg_processing_time * 1000).toFixed(0)} ms
          </span>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by action or moral principle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="audit-log">
        {filteredLog.map((entry, index) => (
          <div 
            key={index} 
            className={`audit-entry ${expandedEntry === index ? 'expanded' : ''}`}
            onClick={() => setExpandedEntry(expandedEntry === index ? null : index)}
          >
            <div className="entry-header">
              <div className="entry-time">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              <div className="entry-action">{entry.action}</div>
              <div className="entry-utility">
                Utility: {entry.expectedUtility.toFixed(4)}
              </div>
            </div>

            {expandedEntry === index && (
              <div className="entry-details">
                <div className="details-section">
                  <h4>Utility Components</h4>
                  <div className="component-grid">
                    <div className="component">
                      <span className="component-label">Base Utility:</span>
                      <span className="component-value">
                        {entry.components.baseUtility.toFixed(4)}
                      </span>
                    </div>
                    <div className="component">
                      <span className="component-label">Moral Weight:</span>
                      <span className="component-value">
                        {entry.components.moralWeight.toFixed(4)}
                      </span>
                    </div>
                    <div className="component">
                      <span className="component-label">Cascade Penalty:</span>
                      <span className="component-value">
                        {entry.components.cascadePenalty.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h4>Context</h4>
                  <div className="context-info">
                    {Object.entries(entry.context).map(([key, value]) => (
                      <div key={key} className="context-item">
                        <strong>{key}:</strong> {JSON.stringify(value)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="details-section">
                  <h4>Moral Principles Applied</h4>
                  <div className="principles-list">
                    {entry.moralPrinciples.map((p, i) => (
                      <span key={i} className="principle-badge">{p}</span>
                    ))}
                  </div>
                </div>

                <div className="details-section">
                  <h4>Belief Confidence</h4>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ width: `${entry.beliefConfidence * 100}%` }}
                    >
                      {(entry.beliefConfidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Blockchain Section */}
                {entry.blockchain && (
                  <div className="details-section blockchain-section">
                    <h4>Blockchain Verification</h4>
                    <div className="blockchain-info">
                      <div className="blockchain-field">
                        <span className="field-label">Decision ID:</span>
                        <span className="field-value mono">{entry.blockchain.decision_id.substring(0, 16)}...</span>
                      </div>
                      <div className="blockchain-field">
                        <span className="field-label">Rule Set (RID):</span>
                        <span className="field-value">{entry.blockchain.rid}</span>
                      </div>
                      <div className="blockchain-field">
                        <span className="field-label">Leaf Hash:</span>
                        <span className="field-value mono">{entry.blockchain.leaf_hash.substring(0, 16)}...</span>
                      </div>
                      {entry.blockchain.sth?.root && (
                        <>
                          <div className="blockchain-field">
                            <span className="field-label">STH Root:</span>
                            <span className="field-value mono">{entry.blockchain.sth.root.substring(0, 16)}...</span>
                          </div>
                          <div className="blockchain-field">
                            <span className="field-label">Batch Size:</span>
                            <span className="field-value">{entry.blockchain.sth.size}</span>
                          </div>
                          <div className="blockchain-field">
                            <span className="field-label">Anchored:</span>
                            <span className="field-value">
                              {new Date(entry.blockchain.sth.t).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="verification-status">
                      {verificationResults[index] ? (
                        verificationResults[index].ok ? (
                          <div className="verification-result success">
                            <span className="verification-icon">✅</span>
                            <span>Verified</span>
                            {verificationResults[index].checkedAt && (
                              <span className="verification-time">
                                ({new Date(verificationResults[index].checkedAt).toLocaleTimeString()})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="verification-result failure">
                            <span className="verification-icon">❌</span>
                            <span>{verificationResults[index].reason}</span>
                          </div>
                        )
                      ) : (
                        <button 
                          className="btn-verify"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerify(entry, index);
                          }}
                          disabled={verifyingEntry === index}
                        >
                          {verifyingEntry === index ? 'Verifying...' : '🔐 Verify'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditTrail;
