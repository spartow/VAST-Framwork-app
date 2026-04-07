// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RuleRegistry
 * @notice On-chain governance for VAST rule sets
 * @dev Manages rule lifecycle: propose -> approve -> finalize
 */
contract RuleRegistry {
    enum RuleState { Draft, Active, Deprecated }
    enum ProposalState { Pending, Approved, Finalized, Rejected }

    struct RuleVersion {
        bytes32 hash;
        uint256 activatedAt;
        uint256 governanceRecordId;
        RuleState state;
    }

    struct GovernanceRecord {
        uint256 id;
        address proposer;
        address[] approvals;
        uint256 approvalThreshold;
        uint256 timelockUntil;
        ProposalState state;
        bytes32 newRuleHash;
        uint256 createdAt;
    }

    struct RuleEntry {
        string rid;
        RuleVersion currentVersion;
        RuleVersion[] history;
        bool locked;
        bool mutable;
        uint256 defaultThreshold;
        mapping(uint256 => GovernanceRecord) proposals;
        uint256[] proposalIds;
    }

    mapping(string => RuleEntry) public rules;
    mapping(uint256 => string) public proposalToRule;
    uint256 public nextProposalId = 1;
    
    address public owner;
    bool public paused = false;

    event RuleRegistered(string indexed rid, bytes32 hash, address indexed proposer);
    event ProposalCreated(string indexed rid, uint256 indexed proposalId, bytes32 newHash, address proposer);
    event ProposalApproved(string indexed rid, uint256 indexed proposalId, address approver);
    event ProposalFinalized(string indexed rid, uint256 indexed proposalId, bytes32 newHash);
    event RulePaused();
    event RuleUnpaused();
    event FraudReported(string indexed rid, uint256 indexed proposalId, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerRule(
        string calldata rid,
        bytes32 ruleHash,
        bool isLocked,
        bool isMutable,
        uint256 threshold
    ) external onlyOwner whenNotPaused {
        require(bytes(rules[rid].rid).length == 0, "Rule exists");
        
        RuleEntry storage entry = rules[rid];
        entry.rid = rid;
        entry.locked = isLocked;
        entry.mutable = isMutable;
        entry.defaultThreshold = threshold == 0 ? 2 : threshold;
        
        RuleVersion memory version = RuleVersion({
            hash: ruleHash,
            activatedAt: block.timestamp,
            governanceRecordId: 0,
            state: RuleState.Active
        });
        
        entry.currentVersion = version;
        entry.history.push(version);
        
        emit RuleRegistered(rid, ruleHash, msg.sender);
    }

    function proposeUpdate(
        string calldata rid,
        bytes32 newHash,
        uint256 timelockSeconds
    ) external whenNotPaused returns (uint256) {
        RuleEntry storage entry = rules[rid];
        require(bytes(entry.rid).length > 0, "Rule not found");
        require(!(entry.locked && !entry.mutable), "Rule locked");
        require(entry.currentVersion.hash != newHash, "Same hash");
        
        uint256 proposalId = nextProposalId++;
        
        address[] memory initialApprovals = new address[](1);
        initialApprovals[0] = msg.sender;
        
        GovernanceRecord storage proposal = entry.proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.approvals = initialApprovals;
        proposal.approvalThreshold = entry.defaultThreshold;
        proposal.timelockUntil = timelockSeconds > 0 ? block.timestamp + timelockSeconds : 0;
        proposal.state = ProposalState.Pending;
        proposal.newRuleHash = newHash;
        proposal.createdAt = block.timestamp;
        
        entry.proposalIds.push(proposalId);
        proposalToRule[proposalId] = rid;
        
        emit ProposalCreated(rid, proposalId, newHash, msg.sender);
        
        return proposalId;
    }

    function approveUpdate(string calldata rid, uint256 proposalId) external whenNotPaused {
        RuleEntry storage entry = rules[rid];
        require(bytes(entry.rid).length > 0, "Rule not found");
        
        GovernanceRecord storage proposal = entry.proposals[proposalId];
        require(proposal.state == ProposalState.Pending, "Not pending");
        
        for (uint i = 0; i < proposal.approvals.length; i++) {
            require(proposal.approvals[i] != msg.sender, "Already approved");
        }
        
        proposal.approvals.push(msg.sender);
        
        if (proposal.approvals.length >= proposal.approvalThreshold) {
            proposal.state = ProposalState.Approved;
        }
        
        emit ProposalApproved(rid, proposalId, msg.sender);
    }

    function finalizeUpdate(string calldata rid, uint256 proposalId) external whenNotPaused {
        RuleEntry storage entry = rules[rid];
        require(bytes(entry.rid).length > 0, "Rule not found");
        
        GovernanceRecord storage proposal = entry.proposals[proposalId];
        require(proposal.state == ProposalState.Approved, "Not approved");
        require(proposal.timelockUntil == 0 || block.timestamp >= proposal.timelockUntil, "Timelock active");
        
        // Deprecate old version
        entry.currentVersion.state = RuleState.Deprecated;
        if (entry.history.length > 0) {
            entry.history[entry.history.length - 1].state = RuleState.Deprecated;
        }
        
        // Create new version
        RuleVersion memory newVersion = RuleVersion({
            hash: proposal.newRuleHash,
            activatedAt: block.timestamp,
            governanceRecordId: proposalId,
            state: RuleState.Active
        });
        
        entry.currentVersion = newVersion;
        entry.history.push(newVersion);
        proposal.state = ProposalState.Finalized;
        
        emit ProposalFinalized(rid, proposalId, proposal.newRuleHash);
    }

    function getActiveRule(string calldata rid) external view returns (bytes32 hash, RuleState state, uint256 activatedAt) {
        RuleEntry storage entry = rules[rid];
        require(bytes(entry.rid).length > 0, "Rule not found");
        return (entry.currentVersion.hash, entry.currentVersion.state, entry.currentVersion.activatedAt);
    }

    function getRuleHistory(string calldata rid) external view returns (RuleVersion[] memory) {
        return rules[rid].history;
    }

    function getProposal(string calldata rid, uint256 proposalId) external view returns (GovernanceRecord memory) {
        return rules[rid].proposals[proposalId];
    }

    function getPendingProposals(string calldata rid) external view returns (GovernanceRecord[] memory) {
        RuleEntry storage entry = rules[rid];
        uint256 count = 0;
        
        for (uint i = 0; i < entry.proposalIds.length; i++) {
            GovernanceRecord storage p = entry.proposals[entry.proposalIds[i]];
            if (p.state == ProposalState.Pending || p.state == ProposalState.Approved) {
                count++;
            }
        }
        
        GovernanceRecord[] memory result = new GovernanceRecord[](count);
        uint256 idx = 0;
        
        for (uint i = 0; i < entry.proposalIds.length; i++) {
            GovernanceRecord storage p = entry.proposals[entry.proposalIds[i]];
            if (p.state == ProposalState.Pending || p.state == ProposalState.Approved) {
                result[idx++] = p;
            }
        }
        
        return result;
    }

    function pause() external onlyOwner {
        paused = true;
        emit RulePaused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit RuleUnpaused();
    }

    function reportFraud(string calldata rid, uint256 proposalId, string calldata reason) external {
        emit FraudReported(rid, proposalId, reason);
    }
}
