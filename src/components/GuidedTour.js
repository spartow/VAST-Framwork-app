import React, { useState, useEffect } from 'react';
import './GuidedTour.css';

const tourSteps = [
  {
    id: 'scenario',
    title: 'Step 1: Load a Scenario',
    description: 'Begin by selecting a scenario from the predefined examples or create your own. Each scenario includes moral context and available actions.',
    target: '.scenario-loader',
    action: 'Load a scenario to continue',
    highlight: 'scenario'
  },
  {
    id: 'beliefs',
    title: 'Step 2: Review Beliefs',
    description: 'Examine the belief structures (credence, confidence, justification) for each action. These represent your epistemic state.',
    target: '.beliefs-container',
    action: 'Review the belief data',
    highlight: 'beliefs'
  },
  {
    id: 'jwmc',
    title: 'Step 3: JWMC Revision (Optional)',
    description: 'Apply Justified Weighted Moral Compatibility revision to update beliefs with new evidence while preserving moral alignment.',
    target: '.jwmc-revision-section',
    action: 'Optionally test belief revision',
    highlight: 'beliefs'
  },
  {
    id: 'decision',
    title: 'Step 4: Make Decision (EEU-CC)',
    description: 'Execute the Expected Epistemic Utility with Cascade Constraints algorithm to select the optimal action based on moral alignment.',
    target: '.decision-maker',
    action: 'Click "Make Decision" to proceed',
    highlight: 'decision'
  },
  {
    id: 'gauges',
    title: 'Step 5: View Gauges',
    description: 'Analyze the four VAST gauges: Calibration, Normative Alignment, Coherence, and Reasoning. These metrics evaluate the quality of your decision.',
    target: '.vast-gauges',
    action: 'Review alignment metrics',
    highlight: 'gauges'
  },
  {
    id: 'export',
    title: 'Step 6: Export Results',
    description: 'Export the complete audit trail as JSON or decision log as CSV for further analysis and documentation.',
    target: '.audit-trail',
    action: 'Export your analysis',
    highlight: 'audit'
  }
];

const GuidedTour = ({ onClose, onStepChange, activeTab }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-progress tour based on activeTab
    const stepMap = {
      'scenario': 0,
      'beliefs': 1,
      'decision': 3,
      'gauges': 4,
      'audit': 5
    };
    
    if (stepMap[activeTab] !== undefined && stepMap[activeTab] > currentStep) {
      setCurrentStep(stepMap[activeTab]);
    }
  }, [activeTab, currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(tourSteps[nextStep].highlight);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(tourSteps[prevStep].highlight);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <>
      <div className="tour-overlay" onClick={handleClose} />
      <div className="tour-modal card" role="dialog" aria-labelledby="tour-title" aria-describedby="tour-description">
        <div className="tour-header">
          <div className="tour-step-indicator">
            Step {currentStep + 1} of {tourSteps.length}
          </div>
          <button 
            className="tour-close" 
            onClick={handleClose}
            aria-label="Close guided tour"
          >
            ×
          </button>
        </div>

        <div className="tour-progress">
          <div className="tour-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="tour-content">
          <h2 id="tour-title" className="tour-title">
            {step.title}
          </h2>
          <p id="tour-description" className="tour-description">
            {step.description}
          </p>
          <div className="tour-action">
            <strong>Action:</strong> {step.action}
          </div>
        </div>

        <div className="tour-footer">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            ← Previous
          </button>
          
          <div className="tour-dots">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                className={`tour-dot ${index === currentStep ? 'active' : ''}`}
                onClick={() => {
                  setCurrentStep(index);
                  onStepChange?.(tourSteps[index].highlight);
                }}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleNext}
          >
            {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
};

export default GuidedTour;
