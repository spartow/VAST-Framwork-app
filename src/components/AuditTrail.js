import React, { useState } from 'react';
import './AuditTrail.css';

const AuditTrail = ({ auditData, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntry, setExpandedEntry] = useState(null);

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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditTrail;
