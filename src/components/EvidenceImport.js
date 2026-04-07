import React, { useState } from 'react';
import './EvidenceImport.css';
import { parseEvidenceBundle } from '../core/blockchain/evidence';
import { verifyDecisionRecord } from '../core/blockchain/decisionRecord';
import { verifyInclusion } from '../core/blockchain/merkle';
import { mockLedger } from '../core/blockchain/ledger.mock';

const EvidenceImport = () => {
  const [dragActive, setDragActive] = useState(false);
  const [bundle, setBundle] = useState(null);
  const [verificationResults, setVerificationResults] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = parseEvidenceBundle(content);
        setBundle(parsed);
        setError(null);
        setVerificationResults([]);
      } catch (err) {
        setError(`Failed to parse evidence bundle: ${err.message}`);
        setBundle(null);
      }
    };
    reader.readAsText(file);
  };

  const verifyAll = async () => {
    if (!bundle) return;
    
    setIsVerifying(true);
    setVerificationResults([]);
    
    const results = [];
    
    for (const decision of bundle.decisions) {
      const decisionResults = {
        id: decision.id,
        checks: [],
        passed: true,
      };
      
      // 1. Verify agent signature
      try {
        const sigValid = await verifyDecisionRecord(decision.dt);
        decisionResults.checks.push({
          name: 'Agent Signature',
          passed: sigValid,
          detail: sigValid ? 'Valid ECDSA signature' : 'Signature verification failed',
        });
        if (!sigValid) decisionResults.passed = false;
      } catch (err) {
        decisionResults.checks.push({
          name: 'Agent Signature',
          passed: false,
          detail: `Error: ${err.message}`,
        });
        decisionResults.passed = false;
      }
      
      // 2. Check rule in registry
      const ruleHash = mockLedger.rules.getRuleHash(decision.dt.rid);
      const ruleValid = ruleHash !== undefined;
      decisionResults.checks.push({
        name: 'Rule Registry',
        passed: ruleValid,
        detail: ruleValid ? `Rule ${decision.dt.rid} found` : `Rule ${decision.dt.rid} not found`,
      });
      if (!ruleValid) decisionResults.passed = false;
      
      // 3. Verify Merkle proof
      const proof = bundle.proofs.find(p => p.decisionId === decision.id);
      if (proof) {
        try {
          const merkleValid = await verifyInclusion(
            decision.leafHash,
            proof.sthRoot,
            {
              siblings: proof.siblings,
              directions: proof.directions,
              index: proof.leafIndex,
            }
          );
          decisionResults.checks.push({
            name: 'Merkle Proof',
            passed: merkleValid,
            detail: merkleValid ? 'Inclusion proof valid' : 'Merkle verification failed',
          });
          if (!merkleValid) decisionResults.passed = false;
        } catch (err) {
          decisionResults.checks.push({
            name: 'Merkle Proof',
            passed: false,
            detail: `Error: ${err.message}`,
          });
          decisionResults.passed = false;
        }
      }
      
      // 4. Check STH
      const sth = bundle.sths.find(s => {
        const p = bundle.proofs.find(pr => pr.decisionId === decision.id);
        return p && s.root === p.sthRoot;
      });
      
      if (sth) {
        decisionResults.checks.push({
          name: 'STH Reference',
          passed: true,
          detail: `Anchored in batch of ${sth.size} decisions`,
        });
      }
      
      results.push(decisionResults);
    }
    
    setVerificationResults(results);
    setIsVerifying(false);
  };

  const clearBundle = () => {
    setBundle(null);
    setVerificationResults([]);
    setError(null);
  };

  const allPassed = verificationResults.length > 0 && 
    verificationResults.every(r => r.passed);

  return (
    <div className="evidence-import">
      <div className="import-header">
        <h2>Import Evidence Bundle</h2>
        <p>Verify exported decision evidence from external sources</p>
      </div>

      {!bundle ? (
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="drop-content">
            <div className="upload-icon">📁</div>
            <p>Drag & drop evidence bundle here</p>
            <p className="or">or</p>
            <label className="file-input-label">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="file-input"
              />
              Browse Files
            </label>
          </div>
        </div>
      ) : (
        <div className="bundle-info">
          <div className="bundle-header">
            <div className="bundle-meta">
              <h3>Evidence Bundle Loaded</h3>
              <div className="meta-grid">
                <div className="meta-item">
                  <label>Version:</label>
                  <span>{bundle.metadata.version}</span>
                </div>
                <div className="meta-item">
                  <label>Exported:</label>
                  <span>{new Date(bundle.metadata.exportedAt).toLocaleString()}</span>
                </div>
                <div className="meta-item">
                  <label>Decisions:</label>
                  <span>{bundle.decisions.length}</span>
                </div>
                <div className="meta-item">
                  <label>STHs:</label>
                  <span>{bundle.sths.length}</span>
                </div>
                <div className="meta-item">
                  <label>Rules:</label>
                  <span>{bundle.rules.length}</span>
                </div>
              </div>
            </div>
            <button className="btn-clear" onClick={clearBundle}>
              Clear
            </button>
          </div>

          {verificationResults.length === 0 ? (
            <div className="verify-section">
              <p>Click verify to check all evidence:</p>
              <button
                className="btn-verify-all"
                onClick={verifyAll}
                disabled={isVerifying}
              >
                {isVerifying ? '🔍 Verifying...' : '🔐 Verify All Evidence'}
              </button>
            </div>
          ) : (
            <div className="verification-results">
              <div className={`summary-banner ${allPassed ? 'success' : 'warning'}`}>
                <span className="banner-icon">{allPassed ? '✅' : '⚠️'}</span>
                <span>
                  {allPassed
                    ? 'All evidence verified successfully!'
                    : `${verificationResults.filter(r => !r.passed).length} of ${verificationResults.length} decisions failed verification`}
                </span>
              </div>

              <div className="results-list">
                {verificationResults.map((result) => (
                  <div
                    key={result.id}
                    className={`result-card ${result.passed ? 'passed' : 'failed'}`}
                  >
                    <div className="result-header">
                      <span className="result-icon">
                        {result.passed ? '✅' : '❌'}
                      </span>
                      <code className="decision-id">
                        {result.id.substring(0, 20)}...
                      </code>
                    </div>
                    <div className="checks-list">
                      {result.checks.map((check, idx) => (
                        <div
                          key={idx}
                          className={`check-item ${check.passed ? 'passed' : 'failed'}`}
                        >
                          <span className="check-icon">
                            {check.passed ? '✓' : '✗'}
                          </span>
                          <span className="check-name">{check.name}:</span>
                          <span className="check-detail">{check.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-reverify"
                onClick={verifyAll}
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Re-verify'}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="import-help">
        <h4>What is an Evidence Bundle?</h4>
        <p>
          An evidence bundle contains cryptographically signed decision records,
          Merkle inclusion proofs, and Signed Tree Heads (STHs) that can be
          independently verified without trusting the original VAST instance.
        </p>
        <p>
          Use the CLI auditor for command-line verification:{' '}
          <code>npx ts-node tools/auditor/verify.ts bundle.json</code>
        </p>
      </div>
    </div>
  );
};

export default EvidenceImport;
