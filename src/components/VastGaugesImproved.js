import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './VastGauges.css';

Chart.register(...registerables);

const VastGaugesImproved = ({ gauges }) => {
  const calibrationRef = useRef(null);
  const normativeRef = useRef(null);
  const coherenceRef = useRef(null);
  const reasoningRef = useRef(null);
  
  const chartsRef = useRef({});

  // Shared configuration for semi-donut gauges
  const getGaugeConfig = (score, title, description, thresholds = { excellent: 0.75, good: 0.6, fair: 0.4 }) => ({
    type: 'doughnut',
    data: {
      datasets: [{
        data: [score, 1 - score],
        backgroundColor: [
          getColorForScore(score, thresholds),
          'rgba(226, 232, 240, 0.3)'
        ],
        borderWidth: 0,
        circumference: 180,
        rotation: 270
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });

  useEffect(() => {
    // Destroy existing charts
    const charts = chartsRef.current;
    Object.values(charts).forEach(chart => chart?.destroy());

    if (!gauges) return;

    // Create all four gauges with consistent semi-donut style
    if (calibrationRef.current) {
      charts.calibration = new Chart(
        calibrationRef.current,
        getGaugeConfig(gauges.calibration, 'Calibration', 'Confidence vs Accuracy Alignment')
      );
    }

    if (normativeRef.current) {
      charts.normative = new Chart(
        normativeRef.current,
        getGaugeConfig(gauges.normative_alignment, 'Normative Alignment', 'Moral Principle Consistency')
      );
    }

    if (coherenceRef.current) {
      charts.coherence = new Chart(
        coherenceRef.current,
        getGaugeConfig(gauges.coherence, 'Coherence', 'Internal Belief Consistency')
      );
    }

    if (reasoningRef.current) {
      charts.reasoning = new Chart(
        reasoningRef.current,
        getGaugeConfig(gauges.reasoning, 'Reasoning', 'Justification Quality & Depth')
      );
    }

    return () => {
      Object.values(charts).forEach(chart => chart?.destroy());
    };
  }, [gauges]);

  if (!gauges) {
    return (
      <div className="vast-gauges card">
        <div className="no-gauges">
          <p>No gauge data available. Create beliefs and make decisions to see alignment metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vast-gauges">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">VAST Alignment Gauges</h2>
          <p className="card-description">
            Comprehensive alignment metrics for ethical AI decision-making
          </p>
        </div>
        
        <div className="overall-score">
          <div className="score-circle" style={{ borderColor: getColorForScore(gauges.overall_vast_score) }}>
            <span className="score-value">{(gauges.overall_vast_score * 100).toFixed(1)}</span>
            <span className="score-label">Overall VAST Score</span>
          </div>
          <div className="score-interpretation">
            <span className="badge badge-primary">{getQualitativeLabel(gauges.overall_vast_score)}</span>
          </div>
        </div>

        <div className="gauges-grid grid grid-cols-2">
          <div className="gauge-card card card-compact">
            <h3>Calibration</h3>
            <p className="gauge-description text-secondary">Confidence vs Accuracy Alignment</p>
            <div className="gauge-chart-container">
              <canvas ref={calibrationRef}></canvas>
              <div className="gauge-center-text">
                {(gauges.calibration * 100).toFixed(1)}%
              </div>
            </div>
            <div className="gauge-status" style={{ color: getColorForScore(gauges.calibration) }}>
              <strong>{getQualitativeLabel(gauges.calibration)}</strong>
            </div>
          </div>

          <div className="gauge-card card card-compact">
            <h3>Normative Alignment</h3>
            <p className="gauge-description text-secondary">Moral Principle Consistency</p>
            <div className="gauge-chart-container">
              <canvas ref={normativeRef}></canvas>
              <div className="gauge-center-text">
                {(gauges.normative_alignment * 100).toFixed(1)}%
              </div>
            </div>
            <div className="gauge-status" style={{ color: getColorForScore(gauges.normative_alignment) }}>
              <strong>{getQualitativeLabel(gauges.normative_alignment)}</strong>
            </div>
          </div>

          <div className="gauge-card card card-compact">
            <h3>Coherence</h3>
            <p className="gauge-description text-secondary">Internal Belief Consistency</p>
            <div className="gauge-chart-container">
              <canvas ref={coherenceRef}></canvas>
              <div className="gauge-center-text">
                {(gauges.coherence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="gauge-status" style={{ color: getColorForScore(gauges.coherence) }}>
              <strong>{getQualitativeLabel(gauges.coherence)}</strong>
            </div>
          </div>

          <div className="gauge-card card card-compact">
            <h3>Reasoning</h3>
            <p className="gauge-description text-secondary">Justification Quality & Depth</p>
            <div className="gauge-chart-container">
              <canvas ref={reasoningRef}></canvas>
              <div className="gauge-center-text">
                {(gauges.reasoning * 100).toFixed(1)}%
              </div>
            </div>
            <div className="gauge-status" style={{ color: getColorForScore(gauges.reasoning) }}>
              <strong>{getQualitativeLabel(gauges.reasoning)}</strong>
            </div>
          </div>
        </div>

        <div className="gauge-legend card card-compact mt-lg">
          <h4 className="font-semibold mb-sm">Quality Indicators</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#059669' }}></span>
              <span><strong>Excellent</strong> (≥ 75%): Strong alignment</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
              <span><strong>Good</strong> (60-74%): Acceptable alignment</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#f97316' }}></span>
              <span><strong>Fair</strong> (40-59%): Moderate concerns</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#dc2626' }}></span>
              <span><strong>Needs Improvement</strong> (&lt; 40%): Significant concerns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getColorForScore(score, thresholds = {}) {
  const { excellent = 0.75, good = 0.6, fair = 0.4 } = thresholds;
  if (score >= excellent) return '#059669'; // Green - Excellent
  if (score >= good) return '#f59e0b';      // Amber - Good
  if (score >= fair) return '#f97316';      // Orange - Fair
  return '#dc2626';                          // Red - Needs Improvement
}

function getQualitativeLabel(score) {
  if (score >= 0.75) return 'Excellent';
  if (score >= 0.6) return 'Good';
  if (score >= 0.4) return 'Fair';
  return 'Needs Improvement';
}

export default VastGaugesImproved;
