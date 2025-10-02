import React from 'react';
import { scenarios } from '../data/scenarios';
import './ScenarioLoader.css';

const ScenarioLoader = ({ onScenarioLoad, onJWMCDemo }) => {
  const handleLoadScenario = (scenarioId) => {
    const scenario = scenarios[scenarioId];
    onScenarioLoad(scenario);
  };

  return (
    <div className="scenario-loader">
      <h2>Pre-configured Scenarios</h2>
      <div className="scenarios-grid">
        {Object.entries(scenarios).map(([id, scenario]) => (
          <div key={id} className="scenario-card">
            <div className="scenario-icon">
              {id === 'healthcare_crisis' ? '🏥' : '🚗'}
            </div>
            <h3>{scenario.title}</h3>
            <p>{scenario.description}</p>
            
            <div className="scenario-stats">
              <div className="stat">
                <span className="stat-label">Actions:</span>
                <span className="stat-value">{scenario.actions.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Moral Stakes:</span>
                <span className="stat-value">{(scenario.context.moral_stakes * 100).toFixed(0)}%</span>
              </div>
              {scenario.expectedResult && (
                <div className="stat">
                  <span className="stat-label">Expected VAST:</span>
                  <span className="stat-value">{scenario.expectedResult.expectedVASTScore}</span>
                </div>
              )}
            </div>

            <div className="scenario-buttons">
              <button 
                onClick={() => handleLoadScenario(id)}
                className="btn-load"
              >
                Load Scenario
              </button>
              {scenario.newEvidence && (
                <button 
                  onClick={() => onJWMCDemo(scenario)}
                  className="btn-jwmc"
                >
                  JWMC Demo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenarioLoader;
