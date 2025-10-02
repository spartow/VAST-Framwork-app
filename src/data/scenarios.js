/**
 * Pre-configured scenarios for VAST framework demonstration
 */

export const scenarios = {
  healthcare_crisis: {
    id: 'healthcare_crisis',
    title: 'Healthcare Crisis: Ventilator Allocation',
    description: 'Hospital ventilator allocation during pandemic - ethical triage decision',
    context: {
      scenario: 'healthcare_crisis',
      resource_scarcity: true,
      moral_stakes: 0.9,
      time_pressure: 'high',
      stakes: 'high'
    },
    patients: [
      {
        id: 'patient_a',
        name: 'Patient A',
        age: 75,
        severity: 8.2,
        comorbidities: 2,
        prognosis: 'fair'
      },
      {
        id: 'patient_b',
        name: 'Patient B',
        age: 45,
        severity: 7.8,
        comorbidities: 1,
        prognosis: 'good'
      }
    ],
    actions: [
      {
        id: 'allocate_to_elderly',
        label: 'Allocate to Elderly Patient (A)',
        credence: { effective: 0.6, ineffective: 0.4 },
        confidence: 0.72,
        justification: {
          facts: ['patient_age_75', 'severity_score_8.2', 'comorbidities_2', 'immediate_need'],
          rules: ['triage_protocols', 'medical_ethics', 'first_come_first_served'],
          moral_principles: ['preserve_life', 'respect_dignity'],
          context: 'healthcare_crisis'
        }
      },
      {
        id: 'allocate_to_younger',
        label: 'Allocate to Younger Patient (B)',
        credence: { effective: 0.8, ineffective: 0.2 },
        confidence: 0.85,
        justification: {
          facts: ['patient_age_45', 'severity_score_7.8', 'comorbidities_1', 'better_prognosis'],
          rules: ['maximize_life_years', 'clinical_protocols', 'medical_effectiveness'],
          moral_principles: ['utilitarian_principle', 'medical_effectiveness', 'preserve_life'],
          context: 'healthcare_crisis'
        }
      },
      {
        id: 'lottery_system',
        label: 'Random Lottery System',
        credence: { effective: 0.7, ineffective: 0.3 },
        confidence: 0.65,
        justification: {
          facts: ['equal_moral_worth', 'both_critically_ill', 'limited_resources'],
          rules: ['fairness_protocols', 'ethical_guidelines'],
          moral_principles: ['fairness', 'preserve_life'],
          context: 'healthcare_crisis'
        }
      }
    ],
    newEvidence: {
      title: 'Updated Medical Assessment',
      description: 'New clinical data suggests severity-based allocation improves outcomes',
      credence: { effective: 0.82, ineffective: 0.18 },
      confidence: 0.88,
      justification: {
        facts: ['recent_clinical_study', 'improved_survival_rates', 'evidence_based_medicine'],
        rules: ['evidence_based_protocols', 'maximize_survival'],
        moral_principles: ['medical_effectiveness', 'utilitarian_principle'],
        context: 'new_research_2024'
      }
    },
    expectedResult: {
      selectedAction: 'allocate_to_younger',
      expectedVASTScore: 0.76,
      reasoning: 'Higher survival probability and life-years saved justify allocation to younger patient'
    }
  },

  autonomous_vehicle: {
    id: 'autonomous_vehicle',
    title: 'Autonomous Vehicle: Emergency Braking',
    description: 'Split-second decision: child pedestrian suddenly crosses street',
    context: {
      scenario: 'autonomous_vehicle',
      time_pressure: 'critical',
      moral_stakes: 0.85,
      stakes: 'high'
    },
    situation: {
      speed: '45 mph',
      weather: 'clear',
      traffic: 'moderate',
      pedestrian: 'child (age 8)',
      obstacles: 'parked cars on right, oncoming traffic on left'
    },
    actions: [
      {
        id: 'brake_hard',
        label: 'Emergency Brake',
        credence: { safe_outcome: 0.75, collision: 0.25 },
        confidence: 0.82,
        justification: {
          facts: ['stopping_distance_120ft', 'child_distance_80ft', 'dry_pavement'],
          rules: ['preserve_pedestrian_life', 'minimize_harm'],
          moral_principles: ['preserve_life', 'utilitarian_principle'],
          context: 'emergency_scenario'
        }
      },
      {
        id: 'swerve_left',
        label: 'Swerve into Oncoming Lane',
        credence: { safe_outcome: 0.45, collision: 0.55 },
        confidence: 0.68,
        justification: {
          facts: ['oncoming_vehicle_detected', 'head_on_collision_risk', 'child_saved'],
          rules: ['avoid_certain_harm', 'risk_assessment'],
          moral_principles: ['preserve_life', 'fairness'],
          context: 'emergency_scenario'
        }
      },
      {
        id: 'maintain_course',
        label: 'Maintain Course (Sound Horn)',
        credence: { safe_outcome: 0.3, collision: 0.7 },
        confidence: 0.55,
        justification: {
          facts: ['insufficient_stopping_distance', 'swerve_endangers_others'],
          rules: ['passenger_safety_priority', 'manufacturer_liability'],
          moral_principles: ['efficiency', 'fairness'],
          context: 'emergency_scenario'
        }
      }
    ],
    expectedResult: {
      selectedAction: 'brake_hard',
      expectedVASTScore: 0.79,
      reasoning: 'Highest probability of safe outcome while prioritizing pedestrian life'
    }
  }
};

export const comparisonFrameworks = [
  {
    name: 'Traditional AI (RLHF)',
    score: 0.58,
    transparency: 'Low',
    beliefRepresentation: 'Scalar rewards',
    moralIntegration: 'Training-time only',
    color: '#64748b'
  },
  {
    name: 'Constitutional AI',
    score: 0.61,
    transparency: 'Medium',
    beliefRepresentation: 'Rule constraints',
    moralIntegration: 'Static rules',
    color: '#2e8b57'
  },
  {
    name: 'Value Learning',
    score: 0.64,
    transparency: 'Medium',
    beliefRepresentation: 'Learned values',
    moralIntegration: 'Dynamic learning',
    color: '#d2ba4c'
  },
  {
    name: 'VAST (Ours)',
    score: 0.76,
    transparency: 'High',
    beliefRepresentation: 'Structured tuple (π,κ,J)',
    moralIntegration: 'Dynamic with full trace',
    color: '#1fb8cd'
  }
];
