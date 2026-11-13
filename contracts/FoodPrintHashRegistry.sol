// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Stores a permanent data hash for each FoodPrint record ID.
contract FoodPrintHashRegistry {
    error NotOwner();
    error NotWriter();
    error InvalidRecordId();
    error InvalidHash();
    error InvalidWriter();
    error AlreadyConfirmed(bytes32 recordId);
    error RecordNotFound(bytes32 recordId);

    event WriterUpdated(address indexed writer, bool allowed);
    event HashConfirmed(bytes32 indexed recordId, bytes32 dataHash, address indexed writer);

    address public immutable owner;
    mapping(address => bool) public writers;
    mapping(bytes32 => bytes32) private hashes;

    constructor() {
        owner = msg.sender;
        writers[msg.sender] = true;
        emit WriterUpdated(msg.sender, true);
    }

    function setWriter(address writer, bool allowed) external {
        if (msg.sender != owner) revert NotOwner();
        if (writer == address(0)) revert InvalidWriter();

        writers[writer] = allowed;
        emit WriterUpdated(writer, allowed);
    }

    function confirmHash(bytes32 recordId, bytes32 dataHash) external {
        if (!writers[msg.sender]) revert NotWriter();
        if (recordId == bytes32(0)) revert InvalidRecordId();
        if (dataHash == bytes32(0)) revert InvalidHash();
        if (hashes[recordId] != bytes32(0)) revert AlreadyConfirmed(recordId);

        hashes[recordId] = dataHash;
        emit HashConfirmed(recordId, dataHash, msg.sender);
    }

    function getHash(bytes32 recordId) external view returns (bytes32) {
        bytes32 dataHash = hashes[recordId];
        if (dataHash == bytes32(0)) revert RecordNotFound(recordId);

        return dataHash;
    }
}
