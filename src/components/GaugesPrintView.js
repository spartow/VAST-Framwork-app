import React, { useEffect } from 'react';
import './GaugesPrintView.css';

const GaugesPrintView = ({ gauges }) => {
  useEffect(() => {
    // Add print-specific class to body
    document.body.classList.add('print-view');
    return () => {
      document.body.classList.remove('print-view');
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!gauges) {
    return (
      <div className="print-view-container">
        <div className="no-data-message">
          <h2>No Gauge Data Available</h2>
          <p>Please make a decision first to generate gauge metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="print-view-container">
      <div className="print-header no-print">
        <h1>VAST Gauges - Print View</h1>
        <div className="print-actions">
          <button onClick={handlePrint} className="btn btn-primary">
            🖨️ Print Report
          </button>
          <button onClick={() => window.history.back()} className="btn btn-secondary">
            ← Back
          </button>
        </div>
      </div>

      <div className="print-content">
        <div className="print-title">
          <h1>VAST Framework Alignment Report</h1>
          <p className="print-subtitle">Values Alignment & Stability Tracker</p>
          <p className="print-date">{new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <div className="overall-score-print">
          <div className="score-display">
            <div className="score-number" style={{ color: getColorForScore(gauges.overall_vast_score) }}>
              {(gauges.overall_vast_score * 100).toFixed(1)}
            </div>
            <div className="score-text">
              <div className="score-label">Overall VAST Score</div>
              <div className="score-quality">{getQualitativeLabel(gauges.overall_vast_score)}</div>
            </div>
          </div>
        </div>

        <div className="gauges-print-grid">
          <div className="gauge-print-card">
            <div className="gauge-header">
              <h2>Calibration</h2>
              <div className="gauge-score" style={{ color: getColorForScore(gauges.calibration) }}>
                {(gauges.calibration * 100).toFixed(1)}%
              </div>
            </div>
            <p className="gauge-desc">Confidence vs Accuracy Alignment</p>
            <div className="gauge-bar">
              <div 
                className="gauge-bar-fill" 
                style={{ 
                  width: `${gauges.calibration * 100}%`,
                  backgroundColor: getColorForScore(gauges.calibration)
                }}
              ></div>
            </div>
            <div className="gauge-label">{getQualitativeLabel(gauges.calibration)}</div>
            <div className="gauge-explanation">
              Measures how well the system's confidence matches actual accuracy. 
              Higher calibration indicates better self-awareness.
            </div>
          </div>

          <div className="gauge-print-card">
            <div className="gauge-header">
              <h2>Normative Alignment</h2>
              <div className="gauge-score" style={{ color: getColorForScore(gauges.normative_alignment) }}>
                {(gauges.normative_alignment * 100).toFixed(1)}%
              </div>
            </div>
            <p className="gauge-desc">Moral Principle Consistency</p>
            <div className="gauge-bar">
              <div 
                className="gauge-bar-fill" 
                style={{ 
                  width: `${gauges.normative_alignment * 100}%`,
                  backgroundColor: getColorForScore(gauges.normative_alignment)
                }}
              ></div>
            </div>
            <div className="gauge-label">{getQualitativeLabel(gauges.normative_alignment)}</div>
            <div className="gauge-explanation">
              Evaluates alignment with established moral principles and ethical frameworks.
              Higher scores indicate stronger moral grounding.
            </div>
          </div>

          <div className="gauge-print-card">
            <div className="gauge-header">
              <h2>Coherence</h2>
              <div className="gauge-score" style={{ color: getColorForScore(gauges.coherence) }}>
                {(gauges.coherence * 100).toFixed(1)}%
              </div>
            </div>
            <p className="gauge-desc">Internal Belief Consistency</p>
            <div className="gauge-bar">
              <div 
                className="gauge-bar-fill" 
                style={{ 
                  width: `${gauges.coherence * 100}%`,
                  backgroundColor: getColorForScore(gauges.coherence)
                }}
              ></div>
            </div>
            <div className="gauge-label">{getQualitativeLabel(gauges.coherence)}</div>
            <div className="gauge-explanation">
              Assesses internal consistency between beliefs, credences, and confidence levels.
              Higher coherence prevents contradictory reasoning.
            </div>
          </div>

          <div className="gauge-print-card">
            <div className="gauge-header">
              <h2>Reasoning</h2>
              <div className="gauge-score" style={{ color: getColorForScore(gauges.reasoning) }}>
                {(gauges.reasoning * 100).toFixed(1)}%
              </div>
            </div>
            <p className="gauge-desc">Justification Quality & Depth</p>
            <div className="gauge-bar">
              <div 
                className="gauge-bar-fill" 
                style={{ 
                  width: `${gauges.reasoning * 100}%`,
                  backgroundColor: getColorForScore(gauges.reasoning)
                }}
              ></div>
            </div>
            <div className="gauge-label">{getQualitativeLabel(gauges.reasoning)}</div>
            <div className="gauge-explanation">
              Measures the depth and quality of justifications including facts, rules, and principles.
              Higher reasoning scores indicate more thorough deliberation.
            </div>
          </div>
        </div>

        <div className="print-footer">
          <div className="footer-content">
            <p><strong>VAST Framework</strong> - Values Alignment & Stability Tracker</p>
            <p>Master Thesis by Soraya Partow | Supervisor: Dr. Satyaki Nan | October 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function getColorForScore(score) {
  if (score >= 0.75) return '#059669';
  if (score >= 0.6) return '#f59e0b';
  if (score >= 0.4) return '#f97316';
  return '#dc2626';
}

function getQualitativeLabel(score) {
  if (score >= 0.75) return 'Excellent';
  if (score >= 0.6) return 'Good';
  if (score >= 0.4) return 'Fair';
  return 'Needs Improvement';
}

export default GaugesPrintView;
