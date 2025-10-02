import React, { useState } from 'react';
import { VASTFramework } from './core/VASTFramework';
import ScenarioLoader from './components/ScenarioLoader';
import BeliefCreator from './components/BeliefCreator';
import VastGauges from './components/VastGauges';
import DecisionMaker from './components/DecisionMaker';
import AuditTrail from './components/AuditTrail';
import { comparisonFrameworks } from './data/scenarios';
import './App.css';

function App() {
  const [vast] = useState(() => new VASTFramework());
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentGauges, setCurrentGauges] = useState(null);
  const [decisionResult, setDecisionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('scenario');
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleScenarioLoad = (scenario) => {
    setCurrentScenario(scenario);
    setActiveTab('beliefs');
    
    // Create beliefs for all actions
    scenario.actions.forEach(action => {
      vast.createBelief(
        action.id,
        action.credence,
        action.confidence,
        action.justification
      );
    });

    showNotification(`Loaded scenario: ${scenario.title}`);
  };

  const handleJWMCDemo = (scenario) => {
    // First load the scenario
    handleScenarioLoad(scenario);
    
    // Wait a bit then apply JWMC revision
    setTimeout(() => {
      const targetAction = scenario.actions[1]; // Usually the preferred action
      const result = vast.jwmcRevision(targetAction.id, scenario.newEvidence);
      
      showNotification(
        `JWMC Revision applied! Moral weight: ${result.moralWeight.toFixed(3)}`,
        'info'
      );
      
      // Calculate updated gauges
      const gauges = vast.calculateVastGauges(targetAction.id);
      setCurrentGauges(gauges);
      setActiveTab('gauges');
    }, 500);
  };

  const handleBeliefCreated = (beliefData) => {
    try {
      vast.createBelief(
        beliefData.proposition,
        beliefData.credence,
        beliefData.confidence,
        beliefData.justification
      );
      
      showNotification(`Belief created: ${beliefData.proposition}`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleMakeDecision = () => {
    if (!currentScenario) {
      showNotification('Please load a scenario first', 'error');
      return;
    }

    try {
      const actionIds = currentScenario.actions.map(a => a.id);
      const result = vast.eeuCcDecision(actionIds, currentScenario.context);
      
      setDecisionResult(result);
      
      // Calculate gauges for selected action
      const gauges = vast.calculateVastGauges(result.selectedAction);
      setCurrentGauges(gauges);
      
      setActiveTab('decision');
      showNotification(`Decision made: ${result.selectedAction}`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleViewGauges = () => {
    if (!decisionResult) {
      showNotification('Make a decision first', 'error');
      return;
    }
    setActiveTab('gauges');
  };

  const handleViewAudit = () => {
    setActiveTab('audit');
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>
            <span className="logo">⚖️</span> VAST Framework
          </h1>
          <p className="subtitle">Values Alignment & Stability Tracker - AI Moral Alignment System</p>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Main Navigation */}
      <nav className="main-nav">
        <button 
          className={activeTab === 'scenario' ? 'active' : ''}
          onClick={() => setActiveTab('scenario')}
        >
          📋 Scenarios
        </button>
        <button 
          className={activeTab === 'beliefs' ? 'active' : ''}
          onClick={() => setActiveTab('beliefs')}
        >
          🧠 Beliefs
        </button>
        <button 
          className={activeTab === 'decision' ? 'active' : ''}
          onClick={handleMakeDecision}
        >
          ⚡ Make Decision
        </button>
        <button 
          className={activeTab === 'gauges' ? 'active' : ''}
          onClick={handleViewGauges}
        >
          📊 Gauges
        </button>
        <button 
          className={activeTab === 'audit' ? 'active' : ''}
          onClick={handleViewAudit}
        >
          📝 Audit Trail
        </button>
        <button 
          className={activeTab === 'compare' ? 'active' : ''}
          onClick={() => setActiveTab('compare')}
        >
          📈 Compare
        </button>
      </nav>

      {/* Main Content */}
      <main className="app-content">
        {activeTab === 'scenario' && (
          <ScenarioLoader 
            onScenarioLoad={handleScenarioLoad}
            onJWMCDemo={handleJWMCDemo}
          />
        )}

        {activeTab === 'beliefs' && (
          <div className="beliefs-container">
            {currentScenario && (
              <div className="scenario-info">
                <h2>{currentScenario.title}</h2>
                <p>{currentScenario.description}</p>
                
                {currentScenario.patients && (
                  <div className="patients-grid">
                    {currentScenario.patients.map(patient => (
                      <div key={patient.id} className="patient-card">
                        <h4>{patient.name}</h4>
                        <div className="patient-details">
                          <span>Age: {patient.age}</span>
                          <span>Severity: {patient.severity}</span>
                          <span>Comorbidities: {patient.comorbidities}</span>
                          <span>Prognosis: {patient.prognosis}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="actions-list">
                  <h3>Available Actions:</h3>
                  {currentScenario.actions.map(action => (
                    <div key={action.id} className="action-item">
                      <strong>{action.label}</strong>
                      <span className="action-confidence">
                        κ = {action.confidence.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <BeliefCreator onBeliefCreated={handleBeliefCreated} />
          </div>
        )}

        {activeTab === 'decision' && (
          <DecisionMaker decisionResult={decisionResult} />
        )}

        {activeTab === 'gauges' && (
          <VastGauges gauges={currentGauges} />
        )}

        {activeTab === 'audit' && (
          <AuditTrail auditData={vast.exportAuditTrail()} />
        )}

        {activeTab === 'compare' && (
          <div className="comparison-view">
            <h2>Framework Comparison</h2>
            <p className="comparison-desc">
              VAST framework compared against existing AI alignment approaches
            </p>
            
            <div className="comparison-grid">
              {comparisonFrameworks.map(framework => (
                <div 
                  key={framework.name} 
                  className="comparison-card"
                  style={{ borderColor: framework.color }}
                >
                  <h3 style={{ color: framework.color }}>{framework.name}</h3>
                  
                  <div className="score-display">
                    <div className="score-circle-small" style={{ borderColor: framework.color }}>
                      <span className="score-number">{framework.score}</span>
                    </div>
                  </div>

                  <div className="framework-details">
                    <div className="detail-row">
                      <strong>Transparency:</strong>
                      <span>{framework.transparency}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Beliefs:</strong>
                      <span>{framework.beliefRepresentation}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Moral Integration:</strong>
                      <span>{framework.moralIntegration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="comparison-chart">
              <h3>Alignment Score Comparison</h3>
              <div className="chart-bars">
                {comparisonFrameworks.map(framework => (
                  <div key={framework.name} className="chart-bar-item">
                    <span className="bar-label">{framework.name}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${framework.score * 100}%`,
                          background: framework.color
                        }}
                      >
                        <span className="bar-value">{framework.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          VAST Framework v1.0.0 | Master Thesis by Soraya Partow | 
          Supervisor: Dr. Satyaki Nan | October 2025
        </p>
      </footer>
    </div>
  );
}

export default App;
