pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./NFT.sol";
import "./Token.sol";

contract Controller {
    using Counters for Counters.Counter;

    //
    // STATE VARIABLES
    //
    Counters.Counter private _sessionIdCounter;
    GeneNFT public geneNFT;
    PostCovidStrokePrevention public pcspToken;

    struct UploadSession {
        uint256 id;
        address user;
        string proof;
        bool confirmed;
    }

    struct DataDoc {
        string id;
        string hashContent;
    }

    mapping(uint256 => UploadSession) sessions;
    mapping(string => DataDoc) docs;
    mapping(string => bool) docSubmits;
    mapping(uint256 => string) nftDocs;

    //
    // EVENTS
    //
    event UploadData(string docId, uint256 sessionId);

    constructor(address nftAddress, address pcspAddress) {
        geneNFT = GeneNFT(nftAddress);
        pcspToken = PostCovidStrokePrevention(pcspAddress);
    }

    function uploadData(string memory docId) public returns (uint256) {
        require(
            bytes(getDoc(docId).id).length == 0,
            "Doc already been submitted"
        );

        uint256 sessionId = _sessionIdCounter.current();

        sessions[sessionId] = UploadSession(
            sessionId,
            msg.sender,
            "",
            false
        );

        emit UploadData(docId, sessionId);

        _sessionIdCounter.increment();

        return sessionId;
    }

    function confirm(
        string memory docId,
        string memory contentHash,
        string memory proof,
        uint256 sessionId,
        uint256 riskScore
    ) public {
        // TODO: Implement this method: The proof here is used to verify that the result is returned from a valid computation on the gene data. For simplicity, we will skip the proof verification in this implementation. The gene data's owner will receive a NFT as a ownership certicate for his/her gene profile.

        // TODO: Verify proof, we can skip this step

        require(
            bytes(getDoc(docId).id).length == 0,
            "Doc already been submitted"
        );

        require(
            getSession(sessionId).user == msg.sender,
            "Invalid session owner"
        );

        require(
            getSession(sessionId).confirmed == false,
            "Session is ended"
        );

        docs[docId] = DataDoc(docId, contentHash);

        geneNFT.safeMint(msg.sender);

        pcspToken.reward(msg.sender, riskScore);

        sessions[sessionId] = UploadSession(
            sessionId,
            msg.sender,
            "success",
            true
        );
    }

    function getSession(
        uint256 sessionId
    ) public view returns (UploadSession memory) {
        return sessions[sessionId];
    }

    function getDoc(string memory docId) public view returns (DataDoc memory) {
        return docs[docId];
    }
}
