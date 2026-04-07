import React from 'react';
import { scenarios } from '../data/scenarios';
import './ScenarioLoader.css';

const ScenarioLoader = ({ onScenarioLoad, onJWMCDemo }) => {
  const handleLoadScenario = (scenarioId) => {
    const scenario = scenarios[scenarioId];
    onScenarioLoad(scenario);
  };

  // Get scenario icon based on domain
  const getScenarioIcon = (domain) => {
    switch (domain) {
      case 'healthcare': return '🏥';
      case 'transportation': return '🚗';
      case 'finance': return '💳';
      case 'social_media': return '📱';
      default: return '⚖️';
    }
  };

  return (
    <div className="scenario-loader">
      <h2>Scenarios</h2>
      
      <div className="scenarios-container">
        <div className="scenarios-grid">
        {Object.entries(scenarios).map(([id, scenario]) => {
          return (
            <div 
              key={id} 
              className="scenario-card"
            >
              <div className="scenario-icon">
                {getScenarioIcon(scenario.domain)}
              </div>
              
              <h3>{scenario.title}</h3>
              
              <div className="scenario-meta">
                <span className={`difficulty difficulty-${scenario.difficulty}`}>
                  {scenario.difficulty.toUpperCase()}
                </span>
              </div>
              
              <p>{scenario.description}</p>
              
              <div className="scenario-stats">
                <div className="stat">
                  <span className="stat-label">Domain:</span>
                  <span className="stat-value">{scenario.domain}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Actions:</span>
                  <span className="stat-value">{scenario.actions.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Moral Stakes:</span>
                  <span className="stat-value">{(scenario.moral_stakes * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="scenario-buttons">
                <button 
                  onClick={() => handleLoadScenario(id)}
                  className="btn-load"
                >
                  Load Scenario
                </button>
              </div>
            </div>
          );
        })}
        </div>
        
        <div className="difficulty-legend">
          <div className="legend-item">
            <span className="difficulty difficulty-medium">MEDIUM</span>
            <span className="legend-text">Moderate uncertainty, manageable time</span>
          </div>
          <div className="legend-item">
            <span className="difficulty difficulty-high">HIGH</span>
            <span className="legend-text">High uncertainty or extreme time pressure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioLoader;
