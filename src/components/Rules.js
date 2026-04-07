import React, { useState, useEffect } from 'react';
import './Rules.css';
import { mockLedger } from '../core/blockchain/ledger.mock';
import { RuleEntry, GovernanceRecord, canFinalize, formatTimelock } from '../core/blockchain/rules';
import { canonicalJson, sha256 } from '../core/blockchain/crypto';

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [newRuleForm, setNewRuleForm] = useState({
    rid: '',
    name: '',
    description: '',
    locked: false,
    mutable: true,
  });
  const [proposeForm, setProposeForm] = useState({
    newHash: '',
    timelockHours: 0,
  });
  const [currentUser] = useState('demo-user');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    const allRules = mockLedger.rules.getAllRules();
    setRules(allRules.map(ruleToDisplay));
    
    if (selectedRule) {
      const updated = allRules.find(r => r.rid === selectedRule.rid);
      if (updated) {
        setSelectedRule(ruleToDisplay(updated));
        setProposals(getProposalsForRule(updated));
      }
    }
  };

  const ruleToDisplay = (rule) => ({
    rid: rule.rid,
    currentHash: rule.currentVersion.hash,
    state: rule.currentVersion.state,
    isLocked: rule.flags.locked,
    isMutable: rule.flags.mutable,
    activatedAt: new Date(rule.currentVersion.activatedAt).toLocaleString(),
    versionCount: rule.history.length,
    pendingProposals: Array.from(rule.proposals.values()).filter(
      p => p.state === 'Pending' || p.state === 'Approved'
    ).length,
  });

  const getProposalsForRule = (rule) => {
    return Array.from(rule.proposals.values()).map(p => ({
      proposalId: p.proposalId,
      rid: rule.rid,
      proposer: p.proposer,
      newHash: p.newHash,
      approvals: p.approvals.length,
      threshold: p.approvalThreshold,
      state: p.state,
      timelockUntil: p.timelockUntil,
      createdAt: new Date(p.createdAt).toLocaleString(),
      canFinalize: canFinalize(p),
    }));
  };

  const handleCreateRule = async () => {
    try {
      const ruleData = {
        name: newRuleForm.name,
        description: newRuleForm.description,
        createdAt: Date.now(),
      };
      const ruleHash = await sha256(canonicalJson(ruleData));
      
      await mockLedger.rules.registerRule(
        newRuleForm.rid,
        ruleHash,
        { locked: newRuleForm.locked, mutable: newRuleForm.mutable },
        currentUser
      );
      
      setShowCreateModal(false);
      setNewRuleForm({ rid: '', name: '', description: '', locked: false, mutable: true });
      loadRules();
    } catch (error) {
      alert(`Failed to create rule: ${error.message}`);
    }
  };

  const handlePropose = async () => {
    if (!selectedRule) return;
    
    try {
      const timelockMs = proposeForm.timelockHours > 0 
        ? Date.now() + (proposeForm.timelockHours * 60 * 60 * 1000)
        : 0;
      
      const proposal = await mockLedger.rules.proposeUpdate(
        selectedRule.rid,
        proposeForm.newHash,
        currentUser
      );
      
      // Set timelock if specified
      if (timelockMs > 0) {
        proposal.timelockUntil = timelockMs;
      }
      
      setShowProposeModal(false);
      setProposeForm({ newHash: '', timelockHours: 0 });
      loadRules();
    } catch (error) {
      alert(`Failed to propose update: ${error.message}`);
    }
  };

  const handleApprove = async (proposalId) => {
    if (!selectedRule) return;
    
    try {
      mockLedger.rules.approveUpdate(selectedRule.rid, proposalId, currentUser);
      loadRules();
    } catch (error) {
      alert(`Failed to approve: ${error.message}`);
    }
  };

  const handleFinalize = async (proposalId) => {
    if (!selectedRule) return;
    
    try {
      await mockLedger.rules.finalizeUpdate(selectedRule.rid, proposalId);
      loadRules();
    } catch (error) {
      alert(`Failed to finalize: ${error.message}`);
    }
  };

  const handleRuleClick = (rule) => {
    const fullRule = mockLedger.rules.getRule(rule.rid);
    if (fullRule) {
      setSelectedRule(rule);
      setProposals(getProposalsForRule(fullRule));
    }
  };

  const generateNewHash = async () => {
    const data = {
      rule: selectedRule.rid,
      updatedAt: Date.now(),
      updater: currentUser,
    };
    const hash = await sha256(canonicalJson(data));
    setProposeForm({ ...proposeForm, newHash: hash });
  };

  return (
    <div className="rules-view">
      <div className="rules-header">
        <h2>Rule Governance</h2>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          + Create Rule
        </button>
      </div>

      <div className="rules-content">
        <div className="rules-list">
          <h3>Active Rules</h3>
          {rules.length === 0 ? (
            <p className="no-rules">No rules registered yet.</p>
          ) : (
            rules.map(rule => (
              <div
                key={rule.rid}
                className={`rule-card ${selectedRule?.rid === rule.rid ? 'selected' : ''}`}
                onClick={() => handleRuleClick(rule)}
              >
                <div className="rule-header">
                  <span className="rule-rid">{rule.rid}</span>
                  <span className={`rule-state ${rule.state.toLowerCase()}`}>
                    {rule.state}
                  </span>
                </div>
                <div className="rule-hash">
                  Hash: {rule.currentHash.substring(0, 16)}...
                </div>
                <div className="rule-meta">
                  <span>{rule.isLocked ? '🔒 Locked' : '🔓 Unlocked'}</span>
                  <span>{rule.versionCount} version(s)</span>
                  {rule.pendingProposals > 0 && (
                    <span className="pending-badge">{rule.pendingProposals} pending</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rule-detail">
          {selectedRule ? (
            <>
              <div className="detail-header">
                <h3>{selectedRule.rid}</h3>
                <div className="detail-actions">
                  <button
                    className="btn-propose"
                    onClick={() => setShowProposeModal(true)}
                    disabled={selectedRule.isLocked && !selectedRule.isMutable}
                  >
                    Propose Update
                  </button>
                </div>
              </div>

              <div className="detail-info">
                <div className="info-row">
                  <label>Current Hash:</label>
                  <code>{selectedRule.currentHash}</code>
                </div>
                <div className="info-row">
                  <label>State:</label>
                  <span className={`state-badge ${selectedRule.state.toLowerCase()}`}>
                    {selectedRule.state}
                  </span>
                </div>
                <div className="info-row">
                  <label>Activated:</label>
                  <span>{selectedRule.activatedAt}</span>
                </div>
                <div className="info-row">
                  <label>Governance:</label>
                  <span>
                    {selectedRule.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                    {selectedRule.isMutable && ' (Mutable)'}
                  </span>
                </div>
                <div className="info-row">
                  <label>Versions:</label>
                  <span>{selectedRule.versionCount}</span>
                </div>
              </div>

              <div className="proposals-section">
                <h4>Proposals</h4>
                {proposals.length === 0 ? (
                  <p className="no-proposals">No active proposals.</p>
                ) : (
                  proposals.map(proposal => (
                    <div key={proposal.proposalId} className={`proposal-card ${proposal.state.toLowerCase()}`}>
                      <div className="proposal-header">
                        <code className="proposal-id">{proposal.proposalId}</code>
                        <span className={`proposal-state ${proposal.state.toLowerCase()}`}>
                          {proposal.state}
                        </span>
                      </div>
                      <div className="proposal-hash">
                        New Hash: {proposal.newHash.substring(0, 16)}...
                      </div>
                      <div className="proposal-meta">
                        <span>Proposed by: {proposal.proposer}</span>
                        <span>Created: {proposal.createdAt}</span>
                      </div>
                      <div className="proposal-approvals">
                        Approvals: {proposal.approvals}/{proposal.threshold}
                        <div className="approval-bar">
                          <div
                            className="approval-fill"
                            style={{ width: `${(proposal.approvals / proposal.threshold) * 100}%` }}
                          />
                        </div>
                      </div>
                      {proposal.timelockUntil > 0 && (
                        <div className="timelock-info">
                          ⏱️ {formatTimelock(proposal.timelockUntil)}
                        </div>
                      )}
                      <div className="proposal-actions">
                        {proposal.state === 'Pending' && (
                          <button
                            className="btn-approve"
                            onClick={() => handleApprove(proposal.proposalId)}
                          >
                            Approve
                          </button>
                        )}
                        {proposal.canFinalize && (
                          <button
                            className="btn-finalize"
                            onClick={() => handleFinalize(proposal.proposalId)}
                          >
                            Finalize
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a rule to view details and proposals.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Rule</h3>
            <div className="form-group">
              <label>Rule ID (RID):</label>
              <input
                type="text"
                value={newRuleForm.rid}
                onChange={e => setNewRuleForm({ ...newRuleForm, rid: e.target.value })}
                placeholder="e.g., vast-medical-rules-v1"
              />
            </div>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={newRuleForm.name}
                onChange={e => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                placeholder="Rule set name"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={newRuleForm.description}
                onChange={e => setNewRuleForm({ ...newRuleForm, description: e.target.value })}
                placeholder="Describe the rule set"
                rows={3}
              />
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={newRuleForm.locked}
                  onChange={e => setNewRuleForm({ ...newRuleForm, locked: e.target.checked })}
                />
                Locked (requires governance to update)
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={newRuleForm.mutable}
                  onChange={e => setNewRuleForm({ ...newRuleForm, mutable: e.target.checked })}
                />
                Mutable (can be updated via governance)
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleCreateRule}>
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Update Modal */}
      {showProposeModal && selectedRule && (
        <div className="modal-overlay" onClick={() => setShowProposeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Propose Update for {selectedRule.rid}</h3>
            <div className="form-group">
              <label>New Rule Hash:</label>
              <div className="hash-input">
                <input
                  type="text"
                  value={proposeForm.newHash}
                  onChange={e => setProposeForm({ ...proposeForm, newHash: e.target.value })}
                  placeholder="Enter new rule hash"
                />
                <button className="btn-generate" onClick={generateNewHash}>
                  Generate
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Timelock (hours, 0 = none):</label>
              <input
                type="number"
                min="0"
                value={proposeForm.timelockHours}
                onChange={e => setProposeForm({ ...proposeForm, timelockHours: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowProposeModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handlePropose}>
                Submit Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rules;
