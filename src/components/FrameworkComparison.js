import React from 'react';
import './FrameworkComparison.css';

const FrameworkComparison = () => {
  return (
    <div className="framework-comparison-container">
      <div className="comparison-header">
        <h2>Framework Comparison</h2>
        <p className="comparison-subtitle">
          VAST vs. State-of-the-Art Alignment Methods (Thesis Chapter 7)
        </p>
      </div>
      
      <div className="comparison-grid">
        <div className="framework-compare-card">
          <h3>RLHF</h3>
          <div className="score-badge score-low">55%</div>
          <div className="compare-details">
            <div className="compare-item">
              <span className="compare-label">Transparency:</span>
              <span className="compare-value low">Low</span>
            </div>
            <div className="compare-item">
              <span className="compare-label">Belief Representation:</span>
              <span className="compare-value">Black-box rewards</span>
            </div>
            <div className="compare-item">
              <span className="compare-label">Limitation:</span>
              <span className="compare-value">Opaque decision-making</span>
            </div>
          </div>
        </div>
        
        <div className="framework-compare-card">
          <h3>Constitutional AI</h3>
          <div className="score-badge score-medium">61%</div>
          <div className="compare-details">
            <div className="compare-item">
              <span className="compare-label">Transparency:</span>
              <span className="compare-value medium">Medium</span>
            </div>
            <div className="compare-item">
              <span className="compare-label">Belief Representation:</span>
              <span className="compare-value">Hard constraints</span>
            </div>
            <div className="compare-item">
              <span className="compare-label">Limitation:</span>
              <span className="compare-value">Rigid rules, brittle</span>
            </div>
          </div>
        </div>
        
        <div className="framework-compare-card">
          <h3>Value Learning</h3>
          <div className="score-badge score-medium">56%</div>
          <div className="compare-details">
            <div className="compare-item">
              <span className="compare-label">Transparency:</span>
              <span className="compare-value low">Low</span>
            </div>
            <div className="compare-item">
              <span className="compare-label">Belief Representation:</span>
              <span className="compare-value">Implicit values</span>
            </div>
            <div className="compare-item">
              <span className="compare-label">Limitation:</span>
              <span className="compare-value">Value drift risk</span>
            </div>
          </div>
        </div>
        
        <div className="framework-compare-card highlight-vast">
          <h3>VAST (Ours)</h3>
          <div className="score-badge score-high">84%</div>
          <div className="compare-details">
            <div className="compare-item">
              <span className="compare-label">Transparency:</span>
              <span className="compare-value high">High ✓</span>
            </div>
            <div className="compare-item">
              <span className="compare-label">Belief Representation:</span>
              <span className="compare-value">(π, κ, J) structured</span>
            </div>
            <div className="compare-item">
              <span className="compare-label">Advantage:</span>
              <span className="compare-value">Full audit trail + stable</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="key-findings">
        <h3>📊 Key Findings from Thesis Evaluation (Chapter 7)</h3>
        <div className="findings-grid">
          <div className="finding-card">
            <div className="finding-value">+29%</div>
            <div className="finding-label">improvement over RLHF</div>
          </div>
          <div className="finding-card">
            <div className="finding-value">+23%</div>
            <div className="finding-label">improvement over Constitutional AI</div>
          </div>
          <div className="finding-card">
            <div className="finding-value">+28%</div>
            <div className="finding-label">improvement over Value Learning</div>
          </div>
          <div className="finding-card highlight">
            <div className="finding-value">4.2/5.0</div>
            <div className="finding-label">Human ethical acceptability rating</div>
          </div>
        </div>
      </div>

      <div className="methodology-note">
        <h4>📖 Evaluation Methodology</h4>
        <p>
          All frameworks were evaluated on the 5 thesis scenarios using the Four Gauges 
          Alignment System (Calibration, Normative Alignment, Coherence, Reasoning Quality). 
          VAST's structured belief representation and cascading constraints provide superior 
          transparency and value stability compared to existing approaches.
        </p>
      </div>
    </div>
  );
};

export default FrameworkComparison;
