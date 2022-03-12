// SPDX-License-Identifier: MIT
pragma solidity 0.5.16;

contract Election {

    event NewCandidate(uint16 indexed _id, string name, address candidateAddress);
    event NewVote(address voterAddress, uint16 indexed votedFor);
    event DuplicateVote(address voterAddress);

    address public admin;
    mapping(address => bool) public voters;
    mapping(address => string) public votedForRecord;
    uint16 public candidatesCount = 0;
    Candidate[] public candidates;

    struct Candidate {
        uint16 id;
        uint16 voteCount;
        string name;
        address candidateAddress;
    }
    modifier adminOnly {
        require(msg.sender == admin);
        _;
    }
    constructor() public {
        admin = msg.sender;
    }

    function registerAsCandidate(string calldata _name) external {
        candidatesCount++;
        Candidate memory newCandidate = Candidate(candidatesCount, 0, _name, msg.sender);
        candidates.push(newCandidate);
        emit NewCandidate(candidatesCount, _name, msg.sender);
    }

    function vote(uint16 _id) external {
        if (voters[msg.sender]) {
            emit DuplicateVote(msg.sender);
        } else {
            voters[msg.sender] = true;
            candidates[_id - 1].voteCount++;
            votedForRecord[msg.sender] = candidates[_id -1].name;
            emit NewVote(msg.sender, _id);
        }
    }

    function getResultsByCandidate(uint16 _id) external view returns (uint16){
        return candidates[_id - 1].voteCount;
    }

    function getAnArray() external view returns (uint[] memory){
        uint[] memory myarr = new uint[](4);
        myarr[0] = 1;
        myarr[1] = 2;
        myarr[2] = 3;
        myarr[3] = 4;

        return myarr;
    }

    function isCandidate(address _toCheck) external view returns(bool, string memory, uint16){
        bool found = false;
        uint foundIndex = 0;
        for (uint i=0;i<candidates.length;i++){
            if (_toCheck == candidates[i].candidateAddress){
                found = true;
                foundIndex = i;
            }
        }
        if (found){
            return (found, candidates[foundIndex].name, candidates[foundIndex].id);
        }

        return (found, "Not Found.", 0);
    }

}

