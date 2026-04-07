import React, { useState } from 'react';
import { VASTFramework } from './core/VASTFramework';
import ScenarioLoader from './components/ScenarioLoader';
import BeliefCreator from './components/BeliefCreator';
import VastGaugesImproved from './components/VastGaugesImproved';
import DecisionMaker from './components/DecisionMaker';
import AuditTrail from './components/AuditTrail';
import Toast from './components/Toast';
import GuidedTour from './components/GuidedTour';
import PresentationMode from './components/PresentationMode';
import GaugesPrintView from './components/GaugesPrintView';
import FrameworkComparison from './components/FrameworkComparison';
import Rules from './components/Rules';
import EvidenceImport from './components/EvidenceImport';
import BlockchainStatus from './components/BlockchainStatus';
import { scenarios, demoScenarios } from './data/scenarios';
import { usePersistence, exportAuditTrailJSON, exportDecisionsCSV } from './hooks/usePersistence';
import './App.css';

function AppMain() {
  const [vast] = useState(() => new VASTFramework());
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentGauges, setCurrentGauges] = useState(null);
  const [decisionResult, setDecisionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('scenario');
  const [notification, setNotification] = useState(null);
  const [showTour, setShowTour] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [demoMode, setDemoMode] = useState(false);

  // Persistence
  usePersistence(vast, currentScenario, decisionResult);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleScenarioLoad = (scenario) => {
    // Clear previous scenario data
    setDecisionResult(null);
    setCurrentGauges(null);
    vast.beliefs.clear(); // Clear old beliefs from previous scenario
    
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

  const handleDemoMode = () => {
    setDemoMode(true);
    setShowTour(true);
    // Load first demo scenario
    const firstScenarioId = demoScenarios[0];
    const firstScenario = scenarios[firstScenarioId];
    if (firstScenario) {
      handleScenarioLoad(firstScenario);
    }
  };

  const handleJWMCDemo = (scenario) => {
    handleScenarioLoad(scenario);
    
    setTimeout(() => {
      const targetAction = scenario.actions[1];
      try {
        const result = vast.jwmcRevision(targetAction.id, scenario.newEvidence);
        
        showNotification(
          `JWMC Revision applied! Moral weight: ${result.moralWeight.toFixed(3)}`,
          'info'
        );
        
        const gauges = vast.calculateVastGauges(targetAction.id);
        setCurrentGauges(gauges);
        setActiveTab('gauges');
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }, 500);
  };

  const handleJWMCRevision = () => {
    if (!currentScenario || !decisionResult) {
      showNotification('Make a decision first before applying JWMC revision', 'error');
      return;
    }

    try {
      const selectedAction = decisionResult.selectedAction;
      const newEvidence = {
        credence: { effective: 0.85, ineffective: 0.15 },
        confidence: 0.90,
        justification: {
          facts: ['updated_evidence', 'new_research_findings'],
          rules: ['evidence_based_practice'],
          moral_principles: ['utilitarian_principle'],
          context: 'evidence_update'
        }
      };

      const result = vast.jwmcRevision(selectedAction, newEvidence);
      
      // Recalculate decision with updated beliefs
      const actionIds = currentScenario.actions.map(a => a.id);
      const updatedDecision = vast.eeuCcDecision(actionIds, currentScenario.context);
      setDecisionResult(updatedDecision);
      
      // Recalculate gauges
      const updatedGauges = vast.calculateVastGauges(updatedDecision.selectedAction);
      setCurrentGauges(updatedGauges);
      
      showNotification(
        `JWMC revision complete. Moral weight: ${result.moralWeight.toFixed(3)}. Decision updated.`,
        'success'
      );
    } catch (error) {
      showNotification(error.message, 'error');
    }
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
      
      const gauges = vast.calculateVastGauges(result.selectedAction);
      setCurrentGauges(gauges);
      
      setActiveTab('decision');
      showNotification(`Decision made: ${result.selectedAction}`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleExportAuditTrail = () => {
    try {
      exportAuditTrailJSON(vast);
      showNotification('Audit trail exported successfully', 'success');
    } catch (error) {
      showNotification('Failed to export audit trail', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      exportDecisionsCSV(vast.decisionLog);
      showNotification('Decisions exported to CSV', 'success');
    } catch (error) {
      showNotification('Failed to export CSV', 'error');
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

  const handleTourStepChange = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div className="App">
      {/* Toast Notification */}
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type}
          onClose={closeNotification}
          duration={3000}
        />
      )}

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour 
          onClose={() => setShowTour(false)}
          onStepChange={handleTourStepChange}
          activeTab={activeTab}
        />
      )}

      {/* Presentation Mode */}
      {activeTab === 'present' && (
        <PresentationMode 
          vast={vast}
          currentScenario={currentScenario}
          decisionResult={decisionResult}
          gauges={currentGauges}
          onExit={() => setActiveTab('scenarios')}
        />
      )}

      {/* Print View */}
      {activeTab === 'print-gauges' && (
        <GaugesPrintView 
          gauges={currentGauges}
          onBack={() => setActiveTab('gauges')}
        />
      )}

      {/* Main Application */}
      {activeTab !== 'present' && activeTab !== 'print-gauges' && (
        <>
              {/* Header */}
              <header className="app-header">
                <div className="header-content">
                  <h1>
                    <span className="logo">⚖️</span> VAST Framework
                  </h1>
                  <p className="subtitle">Values Alignment & Stability Tracker - AI Moral Alignment System</p>
                </div>
                <div className="header-actions">
                  <button 
                    onClick={handleDemoMode} 
                    className="btn btn-primary btn-sm"
                    title="Start guided demo"
                  >
                    🎯 Demo Mode
                  </button>
                  <button 
                    onClick={() => setShowTour(true)} 
                    className="btn btn-secondary btn-sm"
                    title="Start guided tour"
                  >
                    🧭 Tour
                  </button>
                  <button 
                    onClick={() => setActiveTab('present')} 
                    className="btn btn-secondary btn-sm"
                    title="Presentation mode for committee"
                  >
                    📊 Present
                  </button>
                </div>
              </header>

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
                  className={activeTab === 'blockchain' ? 'active' : ''}
                  onClick={() => setActiveTab('blockchain')}
                >
                  ⛓️ Blockchain
                </button>
                <button 
                  className={activeTab === 'rules' ? 'active' : ''}
                  onClick={() => setActiveTab('rules')}
                >
                  📜 Rules
                </button>
                <button 
                  className={activeTab === 'evidence' ? 'active' : ''}
                  onClick={() => setActiveTab('evidence')}
                >
                  🔍 Evidence
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
                  <div className="card">
                    <ScenarioLoader 
                      onScenarioLoad={handleScenarioLoad}
                      onJWMCDemo={handleJWMCDemo}
                      demoScenarios={demoScenarios}
                    />
                  </div>
                )}

                {activeTab === 'beliefs' && (
                  <div className="beliefs-container">
                    {currentScenario && (
                      <div className="card mb-lg">
                        <div className="card-header">
                          <h2 className="card-title">{currentScenario.title}</h2>
                          <p className="card-description">{currentScenario.description}</p>
                        </div>
                        
                        {/* Current Beliefs Display */}
                        {vast.beliefs.size > 0 && (
                          <div className="current-beliefs-list">
                            <h3>Current Beliefs:</h3>
                            <div className="beliefs-grid">
                              {Array.from(vast.beliefs.entries()).map(([id, belief]) => {
                                const action = currentScenario.actions.find(a => a.id === id);
                                return (
                                  <div key={id} className="belief-card card card-compact">
                                    <div className="belief-header">
                                      <strong>{action?.label || id}</strong>
                                    </div>
                                    <div className="belief-details">
                                      <div className="belief-stat">
                                        <span className="stat-label">π (Credence):</span>
                                        <span className="stat-value">{JSON.stringify(belief.credence)}</span>
                                      </div>
                                      <div className="belief-stat">
                                        <span className="stat-label">κ (Confidence):</span>
                                        <span className="stat-value badge badge-primary">{belief.confidence.toFixed(2)}</span>
                                      </div>
                                      <div className="belief-stat">
                                        <span className="stat-label">J (Justification):</span>
                                        <span className="stat-value text-sm">{belief.justification.moral_principles?.slice(0, 2).join(', ')}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* JWMC Revision Section */}
                        <div className="jwmc-revision-section card card-compact mt-lg">
                          <h3>JWMC Belief Revision</h3>
                          <p className="text-secondary text-sm mb-md">
                            Apply Justified Weighted Moral Compatibility revision to update beliefs with new evidence
                          </p>
                          <button 
                            onClick={handleJWMCRevision}
                            className="btn btn-secondary btn-sm"
                            disabled={!decisionResult}
                            title="JWMC = Justified Weighted Moral Compatibility"
                          >
                            Run JWMC Revision
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <BeliefCreator 
                      onBeliefCreated={handleBeliefCreated}
                      hasExistingBeliefs={vast.beliefs.size > 0}
                    />
                  </div>
                )}

                {activeTab === 'decision' && (
                  <DecisionMaker decisionResult={decisionResult} />
                )}

                {activeTab === 'gauges' && (
                  <div>
                    <VastGaugesImproved gauges={currentGauges} />
                    {currentGauges && (
                      <div className="card mt-lg">
                        <div className="export-actions">
                          <button 
                            onClick={() => setActiveTab('print-gauges')}
                            className="btn btn-secondary"
                          >
                            🖨️ Print View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div>
                    <div className="card mb-lg">
                      <div className="card-header">
                        <h2 className="card-title">Export Options</h2>
                      </div>
                      <div className="export-actions">
                        <button 
                          onClick={handleExportAuditTrail}
                          className="btn btn-primary"
                        >
                          📥 Export Audit Trail (JSON)
                        </button>
                        <button 
                          onClick={handleExportCSV}
                          className="btn btn-success"
                          disabled={vast.decisionLog.length === 0}
                        >
                          📊 Export Decisions (CSV)
                        </button>
                      </div>
                    </div>
                    <AuditTrail auditData={vast.exportAuditTrail()} />
                  </div>
                )}

                {activeTab === 'blockchain' && (
                  <BlockchainStatus />
                )}

                {activeTab === 'rules' && (
                  <Rules />
                )}

                {activeTab === 'evidence' && (
                  <EvidenceImport />
                )}

                {activeTab === 'compare' && (
                  <FrameworkComparison />
                )}
              </main>

              {/* Footer */}
              <footer className="app-footer">
                <p>VAST Framework v1.0.0 | November 2025</p>
              </footer>
        </>
      )}
    </div>
  );
}

export default AppMain;
