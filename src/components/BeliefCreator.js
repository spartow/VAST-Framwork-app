import React, { useState } from 'react';
import './BeliefCreator.css';

const BeliefCreator = ({ onBeliefCreated, actionTemplate }) => {
  const [proposition, setProposition] = useState(actionTemplate?.id || '');
  const [credenceInputs, setCredenceInputs] = useState(
    actionTemplate?.credence || { effective: 0.7, ineffective: 0.3 }
  );
  const [confidence, setConfidence] = useState(actionTemplate?.confidence || 0.75);
  const [facts, setFacts] = useState(actionTemplate?.justification?.facts?.join('\n') || '');
  const [rules, setRules] = useState(actionTemplate?.justification?.rules?.join('\n') || '');
  const [moralPrinciples, setMoralPrinciples] = useState(
    actionTemplate?.justification?.moral_principles?.join('\n') || ''
  );
  const [context, setContext] = useState(actionTemplate?.justification?.context || '');
  const [errors, setErrors] = useState({});

  // Calculate credence sum in real-time
  const credenceSum = Object.values(credenceInputs).reduce((sum, val) => sum + val, 0);
  const isCredenceValid = Math.abs(credenceSum - 1.0) < 0.01;
  const hasMinimumOutcomes = Object.keys(credenceInputs).length >= 2;
  const isConfidenceValid = confidence >= 0 && confidence <= 1;
  
  // Validate justification has at least one component
  const hasJustification = facts.trim() || rules.trim() || moralPrinciples.trim();

  const handleCredenceChange = (outcome, value) => {
    setCredenceInputs(prev => ({
      ...prev,
      [outcome]: parseFloat(value) || 0
    }));
  };

  const addCredenceOutcome = () => {
    const newOutcome = prompt('Enter outcome name:');
    if (newOutcome && !credenceInputs[newOutcome]) {
      setCredenceInputs(prev => ({
        ...prev,
        [newOutcome]: 0
      }));
    }
  };

  const removeCredenceOutcome = (outcome) => {
    const newInputs = { ...credenceInputs };
    delete newInputs[outcome];
    setCredenceInputs(newInputs);
  };

  const normalizeCredence = () => {
    const sum = Object.values(credenceInputs).reduce((s, v) => s + v, 0);
    if (sum > 0) {
      const normalized = {};
      for (const [key, val] of Object.entries(credenceInputs)) {
        normalized[key] = val / sum;
      }
      setCredenceInputs(normalized);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!proposition.trim()) {
      newErrors.proposition = 'Proposition is required';
    }

    if (!hasMinimumOutcomes) {
      newErrors.credence = 'At least two outcomes are required';
    } else if (!isCredenceValid) {
      newErrors.credence = `Credences must sum to 1.0 (current: ${credenceSum.toFixed(3)})`;
    }

    if (!isConfidenceValid) {
      newErrors.confidence = 'Confidence must be between 0 and 1';
    }

    if (!hasJustification) {
      newErrors.justification = 'At least one justification component (facts, rules, or moral principles) is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const belief = {
        proposition,
        credence: credenceInputs,
        confidence,
        justification: {
          facts: facts.split('\n').filter(f => f.trim()),
          rules: rules.split('\n').filter(r => r.trim()),
          moral_principles: moralPrinciples.split('\n').filter(m => m.trim()),
          context
        }
      };

      onBeliefCreated(belief);
      setErrors({});
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <div className="belief-creator">
      <h2>Create VAST Belief</h2>
      <form onSubmit={handleSubmit}>
        
        {/* Proposition */}
        <div className="form-group">
          <label htmlFor="proposition">Proposition/Action ID</label>
          <input
            id="proposition"
            type="text"
            value={proposition}
            onChange={(e) => setProposition(e.target.value)}
            placeholder="e.g., allocate_to_younger"
            className={errors.proposition ? 'input-error' : ''}
            required
          />
          {errors.proposition && (
            <span className="error-message">{errors.proposition}</span>
          )}
        </div>

        {/* Credence (π) */}
        <div className="form-section">
          <h3>Credence (π) - Probability Distribution</h3>
          <p className="helper-text">Define probability distribution over outcomes (must sum to 1.0)</p>
          <div className="credence-status">
            Sum: <strong className={isCredenceValid ? 'valid' : 'invalid'}>
              {credenceSum.toFixed(3)}
            </strong>
            {!isCredenceValid && (
              <button type="button" onClick={normalizeCredence} className="btn-normalize">
                Normalize to 1.0
              </button>
            )}
          </div>
          {errors.credence && (
            <span className="error-message">{errors.credence}</span>
          )}
          
          <div className="credence-inputs">
            {Object.entries(credenceInputs).map(([outcome, value]) => (
              <div key={outcome} className="credence-row">
                <label>{outcome}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={value}
                  onChange={(e) => handleCredenceChange(outcome, e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={value.toFixed(2)}
                  onChange={(e) => handleCredenceChange(outcome, e.target.value)}
                  className="credence-number"
                />
                <button
                  type="button"
                  onClick={() => removeCredenceOutcome(outcome)}
                  className="btn-remove"
                  title="Remove outcome"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <button type="button" onClick={addCredenceOutcome} className="btn-add">
            + Add Outcome
          </button>
        </div>

        {/* Confidence (κ) */}
        <div className="form-section">
          <h3>Confidence (κ) - Evidence Strength</h3>
          <p className="helper-text">How confident are you in this belief? (0 = no confidence, 1 = absolute certainty)</p>
          <div className="confidence-input">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
            />
            <span className="confidence-value">{confidence.toFixed(2)}</span>
          </div>
          <div className="confidence-labels">
            <span>No Evidence</span>
            <span>Strong Evidence</span>
          </div>
        </div>

        {/* Justification (J) */}
        <div className="form-section">
          <h3>Justification (J) - Reasoning Chain</h3>
          <p className="helper-text">Provide at least one type of justification (facts, rules, or moral principles)</p>
          {errors.justification && (
            <span className="error-message">{errors.justification}</span>
          )}
          
          <div className="form-group">
            <label htmlFor="facts">Facts (one per line)</label>
            <textarea
              id="facts"
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              placeholder="patient_age_45&#10;severity_score_7.8&#10;comorbidities_1"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="rules">Rules (one per line)</label>
            <textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="maximize_life_years&#10;clinical_protocols&#10;medical_effectiveness"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="moralPrinciples">Moral Principles (one per line)</label>
            <textarea
              id="moralPrinciples"
              value={moralPrinciples}
              onChange={(e) => setMoralPrinciples(e.target.value)}
              placeholder="utilitarian_principle&#10;preserve_life&#10;fairness"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="context">Context</label>
            <input
              id="context"
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="healthcare_crisis"
            />
          </div>
        </div>

        {errors.submit && (
          <div className="error-message error-submit">{errors.submit}</div>
        )}

        <button 
          type="submit" 
          className="btn-create" 
          disabled={!isCredenceValid || !proposition || !hasJustification}
        >
          Create Belief
        </button>
      </form>
    </div>
  );
};

export default BeliefCreator;
