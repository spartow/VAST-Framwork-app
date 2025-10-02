import React from 'react';
import './DecisionMaker.css';

const DecisionMaker = ({ decisionResult, onNewDecision }) => {
  if (!decisionResult) {
    return (
      <div className="decision-maker">
        <div className="no-decision">
          <p>No decision made yet. Load a scenario and create beliefs to see EEU-CC decision process.</p>
        </div>
      </div>
    );
  }

  const { selectedAction, utilities, calculations, processingTime } = decisionResult;

  return (
    <div className="decision-maker">
      <h2>EEU-CC Decision Process</h2>
      
      <div className="decision-header">
        <div className="processing-time">
          <span className="label">Processing Time:</span>
          <span className="value">{(processingTime * 1000).toFixed(2)} ms</span>
        </div>
      </div>

      <div className="selected-action">
        <h3>Selected Action</h3>
        <div className="action-badge">
          {selectedAction}
        </div>
        <div className="utility-score">
          Expected Utility: <strong>{utilities[selectedAction].toFixed(4)}</strong>
        </div>
      </div>

      <div className="actions-comparison">
        <h3>Action Utilities Comparison</h3>
        <div className="utility-bars">
          {Object.entries(utilities).map(([action, utility]) => (
            <div 
              key={action} 
              className={`utility-bar-item ${action === selectedAction ? 'selected' : ''}`}
            >
              <div className="action-name">{action}</div>
              <div className="utility-bar-container">
                <div 
                  className="utility-bar-fill"
                  style={{ 
                    width: `${utility * 100}%`,
                    background: action === selectedAction ? '#1fb8cd' : '#94a3b8'
                  }}
                >
                  <span className="utility-value">{utility.toFixed(4)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="calculation-details">
        <h3>Calculation Breakdown</h3>
        {Object.entries(calculations).map(([action, calc]) => (
          <details 
            key={action} 
            className="calculation-card"
            open={action === selectedAction}
          >
            <summary>
              <strong>{action}</strong>
              <span className="calc-utility">{calc.expectedUtility.toFixed(4)}</span>
            </summary>
            
            <div className="calc-content">
              <div className="calc-row">
                <span className="calc-label">Base Utility:</span>
                <span className="calc-value">{calc.baseUtility.toFixed(4)}</span>
                <div className="calc-bar" style={{ width: `${calc.baseUtility * 100}%` }}></div>
              </div>

              <div className="calc-row">
                <span className="calc-label">Moral Weight:</span>
                <span className="calc-value">{calc.moralWeight.toFixed(4)}</span>
                <div className="calc-bar" style={{ width: `${calc.moralWeight * 100}%` }}></div>
              </div>

              <div className="calc-row">
                <span className="calc-label">Cascade Penalty:</span>
                <span className="calc-value">{calc.cascadePenalty.toFixed(4)}</span>
                <div className="calc-bar" style={{ width: `${calc.cascadePenalty * 100}%` }}></div>
              </div>

              <div className="calc-row result">
                <span className="calc-label">Expected Utility:</span>
                <span className="calc-value">{calc.expectedUtility.toFixed(4)}</span>
                <div className="calc-bar" style={{ width: `${calc.expectedUtility * 100}%` }}></div>
              </div>

              <div className="moral-info">
                <div className="info-item">
                  <strong>Confidence:</strong> {(calc.confidence * 100).toFixed(1)}%
                </div>
                <div className="info-item">
                  <strong>Moral Principles:</strong>
                  <div className="principles-list">
                    {calc.moralPrinciples.map((p, i) => (
                      <span key={i} className="principle-tag">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>

      {onNewDecision && (
        <button onClick={onNewDecision} className="btn-new-decision">
          Make New Decision
        </button>
      )}
    </div>
  );
};

export default DecisionMaker;
