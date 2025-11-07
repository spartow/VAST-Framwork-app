import { useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting VAST state to localStorage
 * Syncs beliefs, decision log, and current scenario
 */
export const usePersistence = (vast, currentScenario, decisionResult) => {
  const STORAGE_KEY = 'vast_framework_state';

  // Load state from localStorage on mount
  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
    return null;
  }, []);

  // Save state to localStorage
  const saveState = useCallback(() => {
    try {
      const state = {
        beliefs: Array.from(vast.beliefs.entries()).map(([prop, belief]) => ({
          proposition: prop,
          credence: belief.credence,
          confidence: belief.confidence,
          justification: belief.justification
        })),
        decisionLog: vast.decisionLog,
        currentScenario: currentScenario ? {
          id: currentScenario.id,
          title: currentScenario.title
        } : null,
        lastDecision: decisionResult,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [vast, currentScenario, decisionResult]);

  // Auto-save on state changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      saveState();
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [saveState]);

  // Clear persisted state
  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear state:', error);
    }
  }, []);

  return {
    loadState,
    saveState,
    clearState
  };
};

/**
 * Export audit trail as JSON file
 */
export const exportAuditTrailJSON = (vast) => {
  const auditTrail = vast.exportAuditTrail();
  const blob = new Blob([JSON.stringify(auditTrail, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vast_audit_trail_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export decisions as CSV file
 */
export const exportDecisionsCSV = (decisionLog) => {
  const headers = [
    'Timestamp',
    'Action',
    'Expected Utility',
    'Base Utility',
    'Moral Weight',
    'Cascade Penalty',
    'Confidence',
    'Moral Principles'
  ];

  const rows = decisionLog.map(entry => [
    entry.timestamp,
    entry.action,
    entry.expectedUtility.toFixed(4),
    entry.components.baseUtility.toFixed(4),
    entry.components.moralWeight.toFixed(4),
    entry.components.cascadePenalty.toFixed(4),
    entry.beliefConfidence.toFixed(2),
    entry.moralPrinciples.join('; ')
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vast_decisions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
