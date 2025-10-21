//contracts/governor.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nektak Governor end-to-end", function () {
  let Token, token;
  let Timelock, timelock;
  let Governor, governor;
  let Box, box;
  let deployer, proposer, voter, other;

  const VOTING_DELAY = 1; // block
  const VOTING_PERIOD = 5; // blocks
  const QUORUM_PERCENT = 4; // 4%

  beforeEach(async function () {
    [deployer, proposer, voter, other] = await ethers.getSigners();

    // Deploy Token
    Token = await ethers.getContractFactory("NektakToken");
    token = await Token.connect(deployer).deploy("Nektak Token", "NKT");
    await token.deployed();

    // Mint tokens to proposer and voter and delegate
    const mintAmount = ethers.utils.parseUnits("1000", 18);
    await token.connect(deployer).mint(proposer.address, mintAmount);
    await token.connect(deployer).mint(voter.address, mintAmount);

    // Delegation to self so votes register
    await token.connect(proposer).delegate(proposer.address);
    await token.connect(voter).delegate(voter.address);

    // Deploy Timelock
    Timelock = await ethers.getContractFactory("TimelockController");
    const minDelay = 1; // small for tests; normally 48*3600
    timelock = await Timelock.connect(deployer).deploy(minDelay, [], []);
    await timelock.deployed();

    // Deploy Governor
    Governor = await ethers.getContractFactory("NektakGovernor");
    governor = await Governor.connect(deployer).deploy(token.address, timelock.address);
    await governor.deployed();

    // Grant proposer role to governor in timelock (so governor can propose executions)
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    await timelock.connect(deployer).grantRole(PROPOSER_ROLE, governor.address);

    // Deploy Box
    Box = await ethers.getContractFactory("Box");
    box = await Box.connect(deployer).deploy();
    await box.deployed();
  });

  it("should go through propose -> vote -> queue -> execute", async function () {
    // 1) Create proposal: call box.store(42)
    const encodedFunction = box.interface.encodeFunctionData("store", [42]);
    const targets = [box.address];
    const values = [0];
    const calldatas = [encodedFunction];
    const description = "Proposal #1: store 42 in Box";

    // submit proposal (using proposer signer)
    const proposeTx = await governor.connect(proposer).propose(targets, values, calldatas, description);
    const proposeRc = await proposeTx.wait();
    const proposalId = proposeRc.events?.filter((x) => x.event === "ProposalCreated")[0].args.proposalId;
    // fetch proposal snapshot block info
    const proposalState1 = await governor.state(proposalId);
    expect(proposalState1).to.be.a('number');

    // Move blocks to start voting (votingDelay = 1)
    await ethers.provider.send("evm_mine", []); // mine 1 block

    // 2) Vote: voter votes FOR
    const voteTx = await governor.connect(voter).castVote(proposalId, 1); // 1 = For
    await voteTx.wait();

    // move a few blocks to finish voting period
    for (let i = 0; i < VOTING_PERIOD + 1; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    // 3) Queue the proposal (requires description hash)
    const descriptionHash = ethers.utils.id(description);
    await governor.connect(proposer).queue(targets, values, calldatas, descriptionHash);

    // Fast-forward time for timelock minDelay (timelock minDelay = 1 block/time for test)
    // If using time-based timelock, increase time; here we can mine a block
    await ethers.provider.send("evm_mine", []);

    // 4) Execute
    await governor.connect(proposer).execute(targets, values, calldatas, descriptionHash);

    // Check box value
    const value = await box.retrieve();
    expect(value).to.equal(42);
  });
});