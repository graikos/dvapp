const Election = artifacts.require("Election");

contract("Election", (accounts) => {

  let electionInstance;
  before(async function () {
    electionInstance = await Election.new();
  });

  describe("Candidate registering functionality", function () {
    it("should register the correct admin", async () => {
      let admin = await electionInstance.admin();
      assert.equal(admin, accounts[0]);
    });

    it("should register a new candidate", async () => {
      await electionInstance.registerAsCandidate("pipas1", {from: accounts[1]});
      let candidate = await electionInstance.candidates(0);
      assert.equal(candidate.name, "pipas1");
      assert.equal(candidate.id, 1);
      assert.equal(candidate.candidateAddress, accounts[1]);
      assert.equal(candidate.voteCount, 0);
    });

    it("should listen to NewCandidate event", async () => {
      electionInstance.registerAsCandidate("pipas2", {from: accounts[2]}).then(receipt => {
        assert.equal(receipt.logs[0].event, "NewCandidate");
      });

    });

    it("should emit the correct info when registering", async () => {
      let receipt = await electionInstance.registerAsCandidate("pipas3", {from: accounts[3]});
      assert.equal(receipt.logs[0].args.name, "pipas3");
      assert.equal(receipt.logs[0].args._id, 3);
    });

    it("should return an array", async () => {
      let returned = await electionInstance.getAnArray();
      assert.deepEqual(returned.map((bn) => bn.toNumber()), [1, 2, 3, 4]);
    });

    it("should return the number of candidates", async () => {
      let count = await electionInstance.candidatesCount();
      assert.equal(count, 3);
    });

    it("should check if candidate exists", async () => {
      const result = await electionInstance.isCandidate(accounts[3]);
      assert.equal(result[0], true);
      assert.equal(result[1], "pipas3");
      assert.equal(result[2], 3);
    });
  });


  describe("Voter functionality", function () {
    it("should emit a NewVote event", async () => {
      let receipt = await electionInstance.vote(1, {from: accounts[6]});
      assert.equal(receipt.logs[0].event, "NewVote");
      assert.equal(receipt.logs[0].args.voterAddress, accounts[6]);
    });


    it("should cast the vote to the candidate", async () => {
      let votedCandidate = await electionInstance.candidates(0);
      assert.equal(votedCandidate.voteCount, 1);
    });

    it("should return the vote count using getResultsByCandidate", async () => {
      let result = await electionInstance.getResultsByCandidate(1);
      assert.equal(result, 1);
    });

    it("should blacklist voters you have voted already", async () => {
      let bannedVoter = await electionInstance.voters(accounts[6]);
      assert.equal(bannedVoter, true);
    });

    it("should prevent duplicate votes", async () => {
      let receipt = await electionInstance.vote(1, {from: accounts[6]});
      assert.equal(receipt.logs[0].event, "DuplicateVote");
      assert.equal(receipt.logs[0].args.voterAddress, accounts[6]);

      let result = await electionInstance.getResultsByCandidate(1);
      assert.equal(result, 1);

    });


  });


});




