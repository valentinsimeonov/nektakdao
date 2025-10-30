# Nektak DAO
The On-chain part of Nektak.


//////////////////////////////////////////////////////////////////////////

## Disclaimer 

### !!! Until we deploy On-chain, everything is subject to Change.
### !!!!!!! Great Products come from Constantly Tweaking them. Improving them, Changing them, Adding to them and Removing from them.

### !!! Updates will happen in bulk not by commits.

//////////////////////////////////////////////////////////////////////////



## On-chain Stack

Layer 2: Base

Token: ERC20Votes Token, non fixed supply

Contracts: Solidity, OpenZeppelin

Governance: Snapshot

Treasury: Gnosis Safe

Infra: Docker, Hardhat(or Foundry), Alchemy or Quick Node





## Phase 1
First Iteration without: Work Score + Cycles/Time Multiplier + Token 

Instead: Token + Snapshot + Safe + basic on-chain Governor

We will add Work Score + Cycles/Time Multiplier on later iterations for easier bulding

Basically we are simplyging the app in the beginning, then add everything we need


### Artistic Approach :)

Let's compare the DAO with a Building.
The Local environment is the Building, the Blockchain is the City and the road to the City is the Deployment.
Then we need to make the Building(Local Environment) and a small path(Deployment) towards the City(Blockchain).
Once we got the narrow path we will make it bigger into a road and then a Highway.





### Sprint 1 - DEV Version

#### 1. Project Structure
   
    Github Repo

    Github Khan ban

#### 2. Reasearch & Documentation

    Governance 

    Tokenomics

    Architecture

    Deployment Steps



#### 3. Local Environment

    File Structure

    Docker Compose Network



#### 4. Deployment Steps

    Github Actions

    Hardhat Deploy and Verify



Backlog from Sprint 1              
Github Actions  --- Most probably will use existing from Nektak Portal - tailored for Docker Hub and AWS

Github Khan Ban  --- Move to Sprint 2









### Artistic Approach :)

We got the Building(Local Environment) and the Path(Deployment) towards the City(Blokchain).
Now we need to work on how the Building Interacts(Contracts) with the City and how the Building Interacts(Frontend) with the People who are using it.


### Sprint 2 - DEV Version

#### 0. Backlog

    Github Khan Ban

#### 1. Gnosis Safe

    Safe Wallet (Gnosis Safe) MultiSig Wallet

#### 2. Frontend

    Proposals Dashboard UI - Draft

    Connect wallet
    
    Connect to testnet contracts.

    Stored Value Testing End to End Connectivity.
    
    Wallet connected to Frontend, Frontend connectd to Contracts, Contracts deployed on Chain

    Verified and Returned Transaction Hash









### Sprint 3 - DEV Version


#### 0. Contracts Security Course - Patrick Collins

https://updraft.cyfrin.io/courses/security/puppy-raffle/reentrancy-recap


#### 1. Frontend

    Make proposal
    View proposals
    Vote
    Queue/execute.


#### 3. Contracts - Implement more of governance model
    
    OpenZeppelin upgradeable contracts.


    Governor, Timelock, Token, Vesting.
 
    Add events, admin controls, tests (unit & property), and gas profiling.

    Tokenomics: total supply, distribution, delegation rules.

    Voting parameters: voting delay, voting period (blocks/time), proposal threshold, quorum numerator.

    Timelock delay (seconds) and custom roles
        
    Upgradeability strategy: self-upgradeable G2overnor? or immutable + new Governor to migrate?











#### 4. Infra & deployment

    Hardhat deploy scripts, verification automation, CI integration.

    Subgraph + TheGraph setup.

    Multisig / Safe treasury + bridging paths.



#### 5. Security & testing - Minimal for Sprint 2(maybe leave as backend if Contracts take too long), more on later Sprints

    Unit tests (Hardhat + Waffle/Chai).

    Integration tests Propose, Vote, Queue, Execute



















## For Production Version

### Contracts Upgrades

Production deployment workflow & safety checklist

Use this checklist for mainnet-grade deployments:

Key management

Use multisig (Gnosis Safe) or a hardware key for deployer/admin operations.


Contracts & upgrades

Governor & Token definitely upgradeable.

Timelock probably immutable.

OpenZeppelin Upgrades plugin (UUPS) for upgradeability. Test storage layout carefully.

Roles & ownership


Timelock controlled by a secure multisig or governance.


Deployment scripting

Deeterministic script that writes addresses & ABI to a known location.

Nonce getTransactionCount("pending") once and increment in-script for multiple txs.


On-chain upgrade via governance

Deploy new implementation.

Governance proposal calls timelock to execute proxy upgrade (or direct upgrade if governance has authority).

Timelock enforces delay for review.