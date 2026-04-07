// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AnchorRegistry
 * @notice On-chain anchoring for VAST Signed Tree Heads (STHs)
 * @dev Stores Merkle tree roots with timestamps for verification
 */
contract AnchorRegistry {
    struct AnchorEntry {
        bytes32 root;
        uint256 size;
        uint256 timestamp;
        address hub;
        bytes signature;
        uint256 anchoredAt;
        bool verified;
    }

    mapping(bytes32 => AnchorEntry) public anchors;
    bytes32[] public anchorList;
    
    address public owner;
    bool public paused = false;
    
    uint256 public anchorCount = 0;

    event STHAnchored(
        bytes32 indexed root,
        uint256 size,
        uint256 timestamp,
        address indexed hub,
        uint256 anchorIndex
    );
    event AnchorVerified(bytes32 indexed root, bool valid);
    event ContractPaused();
    event ContractUnpaused();
    event FraudReported(bytes32 indexed root, string reason);

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

    /**
     * @notice Anchor a new Signed Tree Head
     * @param root Merkle root hash
     * @param size Number of leaves in tree
     * @param timestamp When the tree was created
     * @param hubPubKey Hub's public key or address reference
     * @param signature Hub's signature over (root + size + timestamp)
     */
    function anchorSTH(
        bytes32 root,
        uint256 size,
        uint256 timestamp,
        address hubPubKey,
        bytes calldata signature
    ) external whenNotPaused returns (uint256) {
        require(anchors[root].anchoredAt == 0, "Root already anchored");
        require(size > 0, "Size must be > 0");
        
        AnchorEntry storage entry = anchors[root];
        entry.root = root;
        entry.size = size;
        entry.timestamp = timestamp;
        entry.hub = hubPubKey;
        entry.signature = signature;
        entry.anchoredAt = block.timestamp;
        entry.verified = true; // Assume valid on submission, can be challenged
        
        anchorList.push(root);
        anchorCount++;
        
        emit STHAnchored(root, size, timestamp, hubPubKey, anchorCount - 1);
        
        return anchorCount - 1;
    }

    /**
     * @notice Check if a root is anchored
     */
    function isAnchored(bytes32 root) external view returns (bool) {
        return anchors[root].anchoredAt > 0;
    }

    /**
     * @notice Get anchor by root
     */
    function getAnchor(bytes32 root) external view returns (AnchorEntry memory) {
        return anchors[root];
    }

    /**
     * @notice Get anchor by index
     */
    function getAnchorByIndex(uint256 index) external view returns (AnchorEntry memory) {
        require(index < anchorList.length, "Index out of bounds");
        return anchors[anchorList[index]];
    }

    /**
     * @notice List all anchors (paginated)
     */
    function listAnchors(uint256 offset, uint256 limit) external view returns (AnchorEntry[] memory) {
        uint256 end = offset + limit;
        if (end > anchorList.length) {
            end = anchorList.length;
        }
        
        AnchorEntry[] memory result = new AnchorEntry[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = anchors[anchorList[i]];
        }
        
        return result;
    }

    /**
     * @notice Get total anchor count
     */
    function getAnchorCount() external view returns (uint256) {
        return anchorCount;
    }

    /**
     * @notice Verify an anchor entry (can be called by anyone)
     * @dev In a full implementation, this would verify the ECDSA signature
     */
    function verifyAnchor(bytes32 root) external returns (bool) {
        AnchorEntry storage entry = anchors[root];
        require(entry.anchoredAt > 0, "Root not anchored");
        
        // Placeholder for signature verification
        // In production, this would verify ECDSA signature
        bool valid = entry.signature.length > 0;
        entry.verified = valid;
        
        emit AnchorVerified(root, valid);
        
        return valid;
    }

    /**
     * @notice Report potential fraud
     */
    function reportFraud(bytes32 root, string calldata reason) external {
        emit FraudReported(root, reason);
    }

    /**
     * @notice Get the most recent anchor
     */
    function getLatestAnchor() external view returns (AnchorEntry memory) {
        require(anchorList.length > 0, "No anchors");
        return anchors[anchorList[anchorList.length - 1]];
    }

    /**
     * @notice Batch anchor multiple STHs (gas optimization)
     */
    function batchAnchorSTH(
        bytes32[] calldata roots,
        uint256[] calldata sizes,
        uint256[] calldata timestamps,
        address[] calldata hubs,
        bytes[] calldata signatures
    ) external onlyOwner whenNotPaused returns (uint256[] memory) {
        require(
            roots.length == sizes.length && 
            sizes.length == timestamps.length &&
            timestamps.length == hubs.length &&
            hubs.length == signatures.length,
            "Array length mismatch"
        );
        
        uint256[] memory indices = new uint256[](roots.length);
        
        for (uint256 i = 0; i < roots.length; i++) {
            if (anchors[roots[i]].anchoredAt == 0) {
                AnchorEntry storage entry = anchors[roots[i]];
                entry.root = roots[i];
                entry.size = sizes[i];
                entry.timestamp = timestamps[i];
                entry.hub = hubs[i];
                entry.signature = signatures[i];
                entry.anchoredAt = block.timestamp;
                entry.verified = true;
                
                anchorList.push(roots[i]);
                indices[i] = anchorCount;
                anchorCount++;
                
                emit STHAnchored(roots[i], sizes[i], timestamps[i], hubs[i], indices[i]);
            }
        }
        
        return indices;
    }

    function pause() external onlyOwner {
        paused = true;
        emit ContractPaused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit ContractUnpaused();
    }
}
