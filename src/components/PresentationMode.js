import React, { useState, useEffect, useCallback } from 'react';
import './PresentationMode.css';

const sections = [
  { id: 'intro', title: 'Title', icon: '🎓' },
  { id: 'framework', title: 'Framework', icon: '⚖️' },
  { id: 'scenario', title: 'Scenario', icon: '📋' },
  { id: 'beliefs', title: 'Beliefs', icon: '🧠' },
  { id: 'decision', title: 'Decision', icon: '⚡' },
  { id: 'gauges', title: 'Results', icon: '📊' },
  { id: 'blockchain', title: 'Blockchain', icon: '🔗' },
  { id: 'integrity', title: 'Integrity', icon: '🛡️' },
  { id: 'comparison', title: 'Comparison', icon: '📈' }
];

const PresentationMode = ({ vast, currentScenario, decisionResult, gauges, onExit }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Timer
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Keyboard navigation
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      setCurrentSection(prev => Math.min(prev + 1, sections.length - 1));
    } else if (e.key === 'ArrowLeft') {
      setCurrentSection(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Home') {
      setCurrentSection(0);
    } else if (e.key === 'End') {
      setCurrentSection(sections.length - 1);
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsTimerRunning(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSection = () => {
    const section = sections[currentSection];

    switch (section.id) {
      case 'intro':
        return (
          <div className="section-content">
            <div className="title-slide">
              <h1 className="thesis-title">A Transparent Framework for</h1>
              <h1 className="thesis-title-main">AI Moral Alignment</h1>
              
              <div className="thesis-subtitle">
                <strong>VAST:</strong> Values Alignment & Stability Tracker
              </div>
              
              <div className="author-block">
                <div className="author-name">Soraya Partow</div>
                <div className="author-role">Master's Thesis</div>
              </div>
              
              <div className="advisor-block">
                <div className="advisor-label">Thesis Supervisor:</div>
                <div className="advisor-name">Dr. Satyaki Nan</div>
              </div>
              
              <div className="date-block">2026</div>
            </div>
          </div>
        );

      case 'framework':
        return (
          <div className="section-content">
            <h2 className="section-title">The VAST Framework</h2>
            <p className="section-description">
              Four integrated components for transparent moral reasoning
            </p>
            <div className="framework-diagram">
              <div className="framework-component">
                <div className="component-icon">🧠</div>
                <h3>Belief Representation</h3>
                <p className="component-desc">(π, κ, J) Tuple</p>
                <ul className="component-details">
                  <li><strong>π:</strong> Credence (probability distribution)</li>
                  <li><strong>κ:</strong> Confidence (epistemic certainty)</li>
                  <li><strong>J:</strong> Justification (moral grounding)</li>
                </ul>
                {currentScenario && currentScenario.actions && (
                  <div className="example-box">
                    <strong>Example from {currentScenario.title}:</strong>
                    <div className="belief-example">
                      <div>π: {JSON.stringify(currentScenario.actions[0].credence)}</div>
                      <div>κ: {currentScenario.actions[0].confidence}</div>
                      <div>J: {currentScenario.actions[0].justification.moral_principles.slice(0, 2).join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="arrow-down">↓</div>
              
              <div className="framework-component">
                <div className="component-icon">🔄</div>
                <h3>JWMC Revision</h3>
                <p className="component-desc">Justified Weighted Moral Consistency</p>
                <ul className="component-details">
                  <li>Maintains value stability during updates</li>
                  <li>Weights updates by moral coherence</li>
                  <li>Resists value drift</li>
                </ul>
                <div className="example-box">
                  <strong>Parameters (Thesis Section 4.3):</strong>
                  <div className="param-example">
                    <div>λ (moral consistency weight): 0.7</div>
                    <div>α (confidence learning rate): 0.3</div>
                    <div>β (justification learning rate): 0.2</div>
                  </div>
                </div>
              </div>
              
              <div className="arrow-down">↓</div>
              
              <div className="framework-component">
                <div className="component-icon">⚖️</div>
                <h3>EEU-CC Decision</h3>
                <p className="component-desc">Expected Utility + Cascading Constraints</p>
                <ul className="component-details">
                  <li>Soft hierarchical constraints</li>
                  <li>Priority-based penalties</li>
                  <li>Flexible moral reasoning</li>
                </ul>
                {currentScenario && currentScenario.constraints && (
                  <div className="example-box">
                    <strong>Cascading Constraints:</strong>
                    <div className="constraint-example">
                      {currentScenario.constraints.slice(0, 3).map((c, i) => (
                        <div key={i}>Priority {c.priority}: {c.constraint}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="arrow-down">↓</div>
              
              <div className="framework-component">
                <div className="component-icon">📊</div>
                <h3>Four Gauges</h3>
                <p className="component-desc">Real-time Alignment Monitoring</p>
                <ul className="component-details">
                  <li>Calibration, Normative, Coherence, Reasoning</li>
                  <li>Detect specific failure modes</li>
                  <li>Continuous auditing</li>
                </ul>
                {gauges && (
                  <div className="example-box">
                    <strong>Current Scores:</strong>
                    <div className="gauge-preview">
                      <div>Overall VAST: {(gauges.overall_vast_score * 100).toFixed(0)}%</div>
                      <div>Calibration: {(gauges.calibration * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'scenario':
        if (!currentScenario) {
          return <div className="section-empty">Load a scenario from the Scenarios tab</div>;
        }
        return (
          <div className="section-content">
            <div className="scenario-header">
              <h2 className="section-title">{currentScenario.title}</h2>
              {currentScenario.thesis_section && (
                <div className="thesis-badge">
                  📖 Thesis Section {currentScenario.thesis_section}
                </div>
              )}
            </div>
            
            <div className="scenario-meta-bar">
              <span className="meta-item">
                <strong>Domain:</strong> {currentScenario.domain}
              </span>
              <span className="meta-item">
                <strong>Difficulty:</strong> {currentScenario.difficulty}
              </span>
              <span className="meta-item">
                <strong>Moral Stakes:</strong> {(currentScenario.moral_stakes * 100).toFixed(0)}%
              </span>
            </div>
            
            <p className="section-description-large">{currentScenario.description}</p>
            
            {currentScenario.constraints && (
              <div className="constraints-section">
                <h3>Ethical Constraints (Priority Hierarchy)</h3>
                <div className="constraints-list">
                  {currentScenario.constraints.map((c) => (
                    <div key={c.id} className="constraint-item-present">
                      <div className="constraint-priority">P{c.priority}</div>
                      <div className="constraint-content">
                        <strong>{c.title}</strong>
                        <span className="constraint-principle">{c.principle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="actions-section">
              <h3>Available Actions ({currentScenario.actions.length})</h3>
              <div className="actions-list-present">
                {currentScenario.actions.map((action, idx) => (
                  <div key={action.id} className="action-present-card">
                    <div className="action-number">{idx + 1}</div>
                    <div className="action-content">
                      <h4>{action.label}</h4>
                      <div className="action-metrics">
                        <span>κ: {(action.confidence * 100).toFixed(0)}%</span>
                        <span>Outcomes: {Object.keys(action.credence).length}</span>
                        <span>Principles: {action.justification.moral_principles.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'beliefs':
        const beliefs = Array.from(vast.beliefs.entries());
        if (beliefs.length === 0) {
          return <div className="section-empty">No beliefs created</div>;
        }
        return (
          <div className="section-content">
            <h2 className="section-title">Belief Structures</h2>
            <p className="section-description">
              Epistemic state represented as (π, κ, J) tuples
            </p>
            <div className="beliefs-grid">
              {beliefs.slice(0, 4).map(([prop, belief]) => (
                <div key={prop} className="belief-card-compact">
                  <h4>{prop}</h4>
                  <div className="belief-metrics">
                    <div className="metric">
                      <span className="metric-label">Credence:</span>
                      <span className="metric-value">
                        {Object.keys(belief.credence).length} outcomes
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Confidence:</span>
                      <span className="metric-value">
                        {(belief.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Justification:</span>
                      <span className="metric-value">
                        {(belief.justification.facts?.length || 0) +
                         (belief.justification.rules?.length || 0) +
                         (belief.justification.moral_principles?.length || 0)} components
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'decision':
        if (!decisionResult) {
          return (
            <div className="section-empty">
              <div className="empty-icon">⚡</div>
              <h3>No Decision Made Yet</h3>
              <p>To populate this slide:</p>
              <ol className="empty-instructions">
                <li>Exit presentation (✕ button top-left)</li>
                <li>Go to <strong>📋 Scenarios</strong> tab</li>
                <li>Load a scenario</li>
                <li>Go to <strong>🧠 Beliefs</strong> tab and create beliefs</li>
                <li>Go to <strong>⚡ Decision</strong> tab and make decision</li>
                <li>Return to presentation mode</li>
              </ol>
            </div>
          );
        }
        return (
          <div className="section-content">
            <h2 className="section-title">EEU-CC Decision</h2>
            <p className="section-description">
              Expected Epistemic Utility with Cascade Constraints
            </p>
            <div className="decision-outcome">
              <div className="selected-action-large">
                {decisionResult.selectedAction}
              </div>
              <div className="utility-display">
                <span className="utility-label">Expected Utility:</span>
                <span className="utility-value">
                  {decisionResult.utilities[decisionResult.selectedAction].toFixed(4)}
                </span>
              </div>
            </div>
            <div className="utilities-comparison">
              {Object.entries(decisionResult.utilities).map(([action, utility]) => (
                <div 
                  key={action} 
                  className={`utility-row ${action === decisionResult.selectedAction ? 'selected' : ''}`}
                >
                  <span className="utility-action">{action}</span>
                  <div className="utility-bar-container">
                    <div 
                      className="utility-bar"
                      style={{ width: `${utility * 100}%` }}
                    />
                  </div>
                  <span className="utility-number">{utility.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'gauges':
        if (!gauges) {
          return (
            <div className="section-empty">
              <div className="empty-icon">📊</div>
              <h3>No Gauge Data Available</h3>
              <p>To populate this slide:</p>
              <ol className="empty-instructions">
                <li>Exit presentation (✕ button top-left)</li>
                <li>Load a scenario and make a decision first</li>
                <li>Go to <strong>📈 Gauges</strong> tab to see alignment metrics</li>
                <li>Return to presentation mode</li>
              </ol>
              <p className="empty-note">
                💡 <strong>Tip:</strong> The Four Gauges show how well VAST's decision 
                aligns with ethical principles.
              </p>
            </div>
          );
        }
        return (
          <div className="section-content">
            <h2 className="section-title">VAST Alignment Gauges</h2>
            <div className="overall-vast-score">
              <div className="vast-score-number">
                {(gauges.overall_vast_score * 100).toFixed(1)}
              </div>
              <div className="vast-score-label">Overall VAST Score</div>
            </div>
            <div className="gauges-grid-2x2">
              <div className="gauge-box">
                <h3>Calibration</h3>
                <div className="gauge-value-large" style={{ color: getGaugeColor(gauges.calibration) }}>
                  {(gauges.calibration * 100).toFixed(1)}%
                </div>
                <p className="gauge-desc-small">Confidence vs Accuracy</p>
              </div>
              <div className="gauge-box">
                <h3>Normative Alignment</h3>
                <div className="gauge-value-large" style={{ color: getGaugeColor(gauges.normative_alignment) }}>
                  {(gauges.normative_alignment * 100).toFixed(1)}%
                </div>
                <p className="gauge-desc-small">Moral Consistency</p>
              </div>
              <div className="gauge-box">
                <h3>Coherence</h3>
                <div className="gauge-value-large" style={{ color: getGaugeColor(gauges.coherence) }}>
                  {(gauges.coherence * 100).toFixed(1)}%
                </div>
                <p className="gauge-desc-small">Belief Consistency</p>
              </div>
              <div className="gauge-box">
                <h3>Reasoning</h3>
                <div className="gauge-value-large" style={{ color: getGaugeColor(gauges.reasoning) }}>
                  {(gauges.reasoning * 100).toFixed(1)}%
                </div>
                <p className="gauge-desc-small">Justification Quality</p>
              </div>
            </div>
          </div>
        );

      case 'blockchain':
        return (
          <div className="section-content">
            <h2 className="section-title">VAST-Blockchain Architecture</h2>
            <p className="section-description">
              Hybrid ledger anchoring for verifiable governance and auditability
            </p>

            <div className="blockchain-architecture">
              <div className="arch-layer">
                <div className="arch-layer-label">Application Layer (Off-Chain)</div>
                <div className="arch-layer-content">
                  <div className="arch-box arch-vast">
                    <h4>VAST Engine</h4>
                    <p>Perceive &rarr; JWMC &rarr; EEUCC &rarr; Gauges</p>
                  </div>
                  <div className="arch-arrow">&darr;</div>
                  <div className="arch-box arch-record">
                    <h4>Decision Record (d<sub>t</sub>)</h4>
                    <div className="record-fields">
                      <span>id</span><span>timestamp</span><span>rid</span>
                      <span>h(Model)</span><span>com(input)</span><span>com(J)</span>
                      <span>action</span><span>constraints</span><span>sig<sub>A</sub></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="arch-connector">&darr; ECDSA P-256 Signed</div>

              <div className="arch-layer">
                <div className="arch-layer-label">Anchoring Layer</div>
                <div className="arch-layer-content">
                  <div className="arch-box arch-hub">
                    <h4>Anchoring Hub</h4>
                    <div className="hub-details">
                      <div className="hub-param">
                        <strong>Batch interval:</strong> T = 10s or N = 25 decisions
                      </div>
                      <div className="hub-param">
                        <strong>Merkle tree:</strong> Binary SHA-256, O(log n) proofs
                      </div>
                      <div className="hub-param">
                        <strong>Output:</strong> Signed Tree Head (STH)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="arch-connector">&darr; STH Anchored</div>

              <div className="arch-layer">
                <div className="arch-layer-label">Smart Contract Layer (On-Chain)</div>
                <div className="arch-layer-content arch-onchain">
                  <div className="arch-box arch-contract">
                    <h4>RuleRegistry.sol</h4>
                    <p>Governed rule versions with quorum + timelock</p>
                  </div>
                  <div className="arch-box arch-contract">
                    <h4>AnchorRegistry.sol</h4>
                    <p>STH storage + fraud proof adjudication</p>
                  </div>
                </div>
              </div>
            </div>

            {vast && vast.logManager && (
              <div className="blockchain-live-stats">
                <h3>Live Session Stats</h3>
                <div className="live-stats-grid">
                  <div className="live-stat">
                    <div className="live-stat-value">{vast.decisionLog?.length || 0}</div>
                    <div className="live-stat-label">Decisions Signed</div>
                  </div>
                  <div className="live-stat">
                    <div className="live-stat-value">ECDSA P-256</div>
                    <div className="live-stat-label">Signature Algorithm</div>
                  </div>
                  <div className="live-stat">
                    <div className="live-stat-value">SHA-256</div>
                    <div className="live-stat-label">Hash Function</div>
                  </div>
                  <div className="live-stat">
                    <div className="live-stat-value">Mock</div>
                    <div className="live-stat-label">Ledger Mode</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'integrity':
        return (
          <div className="section-content">
            <h2 className="section-title">Verification &amp; Integrity</h2>
            <p className="section-description">
              Threat model, security guarantees, and audit workflow
            </p>

            <div className="integrity-grid">
              <div className="integrity-card">
                <div className="integrity-icon">🔒</div>
                <h3>Rule Immutability</h3>
                <p>Locked ethical constraints cannot be altered once deployed. All 200 tampering attempts detected (150 blocked, 50 governed).</p>
                <div className="integrity-result">100% detection rate</div>
              </div>

              <div className="integrity-card">
                <div className="integrity-icon">🌳</div>
                <h3>Merkle Inclusion Proofs</h3>
                <p>Every decision can be verified as part of the anchored batch via O(log n) inclusion proof against the STH root.</p>
                <div className="integrity-result">Logarithmic verification</div>
              </div>

              <div className="integrity-card">
                <div className="integrity-icon">🔍</div>
                <h3>External Detectability</h3>
                <p>Independent auditors can detect tampering without trusting system operators. Rollback and history rewrites are cryptographically detectable.</p>
                <div className="integrity-result">100% vs 0% centralized</div>
              </div>

              <div className="integrity-card">
                <div className="integrity-icon">⚖️</div>
                <h3>Governance Model</h3>
                <p>Multi-stakeholder ethics board with BFT-style quorum (&gt;2/3), timelock delays, and on-chain rule versioning.</p>
                <div className="integrity-result">Byzantine fault tolerant</div>
              </div>
            </div>

            <div className="threat-model">
              <h3>Threat Model Coverage</h3>
              <div className="threats-list">
                <div className="threat-item">
                  <span className="threat-name">Insider rule tampering</span>
                  <span className="threat-defense">Governed smart contracts + locked rules</span>
                  <span className="threat-status">Mitigated</span>
                </div>
                <div className="threat-item">
                  <span className="threat-name">Hub rollback / equivocation</span>
                  <span className="threat-defense">STH consistency proofs + slashable fraud proofs</span>
                  <span className="threat-status">Mitigated</span>
                </div>
                <div className="threat-item">
                  <span className="threat-name">Log deletion / editing</span>
                  <span className="threat-defense">Merkle inclusion proof failure detection</span>
                  <span className="threat-status">Mitigated</span>
                </div>
                <div className="threat-item">
                  <span className="threat-name">Byzantine governance</span>
                  <span className="threat-defense">BFT quorum + timelock review</span>
                  <span className="threat-status">Mitigated</span>
                </div>
              </div>
            </div>

            <div className="latency-summary">
              <h3>Performance Overhead</h3>
              <div className="latency-bars">
                <div className="latency-item">
                  <span className="latency-label">VAST decision logic</span>
                  <div className="latency-bar-bg">
                    <div className="latency-bar-fill" style={{width: '23%'}}></div>
                  </div>
                  <span className="latency-value">0.68s</span>
                </div>
                <div className="latency-item">
                  <span className="latency-label">Smart contract execution</span>
                  <div className="latency-bar-bg">
                    <div className="latency-bar-fill" style={{width: '15%'}}></div>
                  </div>
                  <span className="latency-value">0.45s</span>
                </div>
                <div className="latency-item">
                  <span className="latency-label">Blockchain anchor finality</span>
                  <div className="latency-bar-bg">
                    <div className="latency-bar-fill" style={{width: '61%'}}></div>
                  </div>
                  <span className="latency-value">1.2-1.8s</span>
                </div>
                <div className="latency-item latency-total">
                  <span className="latency-label">Total per decision</span>
                  <div className="latency-bar-bg">
                    <div className="latency-bar-fill latency-bar-total" style={{width: '100%'}}></div>
                  </div>
                  <span className="latency-value">2.3-2.95s</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'comparison':
        return (
          <div className="section-content">
            <h2 className="section-title">Framework Comparison</h2>
            <p className="section-description">
              VAST vs. State-of-the-Art Alignment Methods
            </p>
            
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
              <h3>Key Findings</h3>
              <ul>
                <li><strong>+29% improvement</strong> over RLHF in overall alignment</li>
                <li><strong>+23% improvement</strong> over Constitutional AI</li>
                <li><strong>+28% improvement</strong> over Value Learning</li>
                <li><strong>Human ethical acceptability:</strong> 84%</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="presentation-mode">
      {/* Exit Button */}
      {onExit && (
        <button className="presentation-exit" onClick={onExit} title="Back to App">
          ✕ Exit Presentation
        </button>
      )}

      {/* Timer */}
      <div className="presentation-timer">
        <span className="timer-icon">{isTimerRunning ? '⏱️' : '⏸️'}</span>
        <span className="timer-value">{formatTime(elapsedTime)}</span>
        <button 
          className="timer-toggle"
          onClick={() => setIsTimerRunning(!isTimerRunning)}
          aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
        >
          {isTimerRunning ? '⏸' : '▶'}
        </button>
      </div>

      {/* Navigation Progress */}
      <div className="presentation-nav">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            className={`nav-dot ${idx === currentSection ? 'active' : ''} ${idx < currentSection ? 'completed' : ''}`}
            onClick={() => setCurrentSection(idx)}
            title={section.title}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-title">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="presentation-content">
        {renderSection()}
      </div>

      {/* Navigation Controls */}
      <div className="presentation-controls">
        <button
          className="control-btn"
          onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
          disabled={currentSection === 0}
        >
          ← Previous
        </button>
        <div className="control-info">
          {currentSection + 1} / {sections.length}
        </div>
        <button
          className="control-btn"
          onClick={() => setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))}
          disabled={currentSection === sections.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="keyboard-hint">
        Use ← → arrows to navigate | Space to pause/resume timer | Home/End for first/last slide
      </div>
    </div>
  );
};

function getGaugeColor(score) {
  if (score >= 0.75) return '#059669';
  if (score >= 0.6) return '#f59e0b';
  if (score >= 0.4) return '#f97316';
  return '#dc2626';
}

export default PresentationMode;
