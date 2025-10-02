import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './VastGauges.css';

Chart.register(...registerables);

const VastGauges = ({ gauges }) => {
  const calibrationRef = useRef(null);
  const normativeRef = useRef(null);
  const coherenceRef = useRef(null);
  const reasoningRef = useRef(null);
  
  const chartsRef = useRef({});

  useEffect(() => {
    // Destroy existing charts
    Object.values(chartsRef.current).forEach(chart => chart?.destroy());

    if (!gauges) return;

    // Calibration Gauge (Doughnut)
    if (calibrationRef.current) {
      chartsRef.current.calibration = new Chart(calibrationRef.current, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [gauges.calibration, 1 - gauges.calibration],
            backgroundColor: [
              getColorForScore(gauges.calibration),
              '#e2e8f0'
            ],
            borderWidth: 0
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
    }

    // Normative Alignment (Bar)
    if (normativeRef.current) {
      chartsRef.current.normative = new Chart(normativeRef.current, {
        type: 'bar',
        data: {
          labels: ['Normative Alignment'],
          datasets: [{
            data: [gauges.normative_alignment],
            backgroundColor: getColorForScore(gauges.normative_alignment),
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            x: { 
              max: 1, 
              grid: { display: false },
              ticks: { display: false }
            },
            y: { 
              grid: { display: false },
              ticks: { display: false }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      });
    }

    // Coherence Gauge (Polar Area)
    if (coherenceRef.current) {
      chartsRef.current.coherence = new Chart(coherenceRef.current, {
        type: 'polarArea',
        data: {
          labels: ['Coherence'],
          datasets: [{
            data: [gauges.coherence],
            backgroundColor: [getColorForScore(gauges.coherence) + '80'],
            borderColor: [getColorForScore(gauges.coherence)],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            r: {
              max: 1,
              ticks: { display: false },
              grid: { color: '#e2e8f0' }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      });
    }

    // Reasoning Gauge (Radar)
    if (reasoningRef.current) {
      chartsRef.current.reasoning = new Chart(reasoningRef.current, {
        type: 'radar',
        data: {
          labels: ['Depth', 'Quality', 'Evidence'],
          datasets: [{
            data: [gauges.reasoning, gauges.reasoning * 0.9, gauges.reasoning * 1.1],
            backgroundColor: getColorForScore(gauges.reasoning) + '40',
            borderColor: getColorForScore(gauges.reasoning),
            borderWidth: 2,
            pointBackgroundColor: getColorForScore(gauges.reasoning),
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            r: {
              max: 1,
              min: 0,
              ticks: { display: false },
              grid: { color: '#e2e8f0' }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      });
    }

    return () => {
      Object.values(chartsRef.current).forEach(chart => chart?.destroy());
    };
  }, [gauges]);

  if (!gauges) {
    return (
      <div className="vast-gauges">
        <div className="no-gauges">
          <p>No gauge data available. Create beliefs and make decisions to see alignment metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vast-gauges">
      <h2>VAST Alignment Gauges</h2>
      
      <div className="overall-score">
        <div className="score-circle" style={{ borderColor: getColorForScore(gauges.overall_vast_score) }}>
          <span className="score-value">{(gauges.overall_vast_score * 100).toFixed(1)}</span>
          <span className="score-label">Overall VAST Score</span>
        </div>
      </div>

      <div className="gauges-grid">
        <div className="gauge-card">
          <h3>Calibration</h3>
          <p className="gauge-description">Confidence vs Accuracy Alignment</p>
          <div className="gauge-chart">
            <canvas ref={calibrationRef}></canvas>
            <div className="gauge-center-text">
              {(gauges.calibration * 100).toFixed(1)}%
            </div>
          </div>
          <div className="gauge-status" style={{ color: getColorForScore(gauges.calibration) }}>
            {getStatusText(gauges.calibration)}
          </div>
        </div>

        <div className="gauge-card">
          <h3>Normative Alignment</h3>
          <p className="gauge-description">Moral Principle Consistency</p>
          <div className="gauge-chart">
            <canvas ref={normativeRef}></canvas>
          </div>
          <div className="gauge-value">{(gauges.normative_alignment * 100).toFixed(1)}%</div>
          <div className="gauge-status" style={{ color: getColorForScore(gauges.normative_alignment) }}>
            {getStatusText(gauges.normative_alignment)}
          </div>
        </div>

        <div className="gauge-card">
          <h3>Coherence</h3>
          <p className="gauge-description">Internal Belief Consistency</p>
          <div className="gauge-chart">
            <canvas ref={coherenceRef}></canvas>
          </div>
          <div className="gauge-value">{(gauges.coherence * 100).toFixed(1)}%</div>
          <div className="gauge-status" style={{ color: getColorForScore(gauges.coherence) }}>
            {getStatusText(gauges.coherence)}
          </div>
        </div>

        <div className="gauge-card">
          <h3>Reasoning</h3>
          <p className="gauge-description">Justification Quality & Depth</p>
          <div className="gauge-chart">
            <canvas ref={reasoningRef}></canvas>
          </div>
          <div className="gauge-value">{(gauges.reasoning * 100).toFixed(1)}%</div>
          <div className="gauge-status" style={{ color: getColorForScore(gauges.reasoning) }}>
            {getStatusText(gauges.reasoning)}
          </div>
        </div>
      </div>
    </div>
  );
};

function getColorForScore(score) {
  if (score >= 0.75) return '#059669'; // Green - Good
  if (score >= 0.6) return '#f59e0b';  // Orange - Fair
  return '#dc2626';                     // Red - Concern
}

function getStatusText(score) {
  if (score >= 0.75) return 'Excellent';
  if (score >= 0.6) return 'Good';
  if (score >= 0.4) return 'Fair';
  return 'Needs Improvement';
}

export default VastGauges;
