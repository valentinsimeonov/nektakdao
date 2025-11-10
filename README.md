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

Infra: Docker, Hardhat





## Phase 1 - DEV Version
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








### Artistic Approach :)

    The Utilities Contracts that we have with the City can now be renegociated depending on the Building People's will.


### Sprint 3 - DEV Version


#### 0. Contracts Security Course - Patrick Collins

    https://updraft.cyfrin.io/courses/security/puppy-raffle/reentrancy-recap


#### 1. Frontend

    Make proposal on Chain.


#### 2. Contracts - Implement more of governance model
    
    Create and Deploy OpenZeppelin upgradeable contracts.

    Timelock, Token, Governor, Proxy.
    

#### 3. End to End functionality:

    1. First we need to deploy the Upgradeable Contracts to Base Sepolia.
    1.a Governor Contract
    1.b Token Contract
    1.c Timelock Contract
    2. Then we will Mint some NKTs
    3. We will send the NKTs to a Wallet Address 
    4. We will Connect with the Wallet to the Frontend and make a Proposal On Chain


Next up: Backend and Database, Frontend Finish Make Proposal(retrieve proposals)















### Artistic Approach :)

Now we are building the Technical Floor(Backend) of the Building(App).



## Sprint 4 - DEV Version

### 1. Backend

    Research and Design On Chain and Off Chain Data Flow between Frontend, Backend, Database and L2


    Implement Flow Stage 1:

    Frontend: 
    1. User connects with Wallet to Frontend 
    2. User builds proposal in UI and makes proposal using their wallet 
    3. Frontend sends the txHash, unique UUID and Wallet Address of Proposal and Proposals fields(metadata) to Backend. 

    Backend: 
    4. Backend accepts metadata (title, body) and stores it Backend also acepts the Transaction Hash and Unique UUID and Wallet Address.
    5. Backend then verifies that txHash and wallet address indeed corresponds to a ProposalCreated for the governor contract and that the on-chain description matches the metadata. If verified, backend persists the metadata + txHash + wallet address 
    6. Backend also verifies in the Database that that txHash and uniqueUUID and wallet address is not recorded already (we prevent clone attacks, Ta ta ta tan ta ta tan ta ta, ta ta ta ta tatan ta ta ta )

    Frontend:
    7. The Frontend does not show the Proposal Creator when the Frontend retrieves the Proposals in order to show users(All Proposals)


    !important: 
    - The Wallet Address will not be linked to any normal Email Account or any other Account. The Wallet Address is the Account.
    - The Wallet Address will be used for the Chat part as well



    Implement Flow Stage 2:


    1. Work-for-DAO and Cycles systems to be on-chain as non-transferable reputation assets(we will use soulbound tokens, badges, on-chain points or on-chain work tokens, TBD)
    
    2. Work-for-DAO and Cycles systems will also be recorded in the Backend for easier access and retrieval, however the main truth source will be on Chain on the blockchain ledger.




#### We are tying to prevent a couple of issues, and also improve some, here are a couple:

    1. Preventing Ethos voting rather than Logos Voting (people voting GO because of who made the proposal, rather than what does the Proposal propose)

    3. We are not tying any Email Accounts to the Wallets, and we are not showing the Wallet Address for the Rpoposal in the UI, if anyone wants to know the Wallet Address they can use the Tx Hash on the Explorer

    4. Creating DAO politicians. There are already enough Politicians in the world, we do not need more of them, and aespecially inventing a new class of politicians(DAO Politicians)

    5. NO Delegate. You vote if you know about the Subject. If not, you educate yourself and then Vote, or you simply do not vote as you don;t know enough about the subject.

    2. IF the Proposal is not in line with the Community Charter(Values, Morals) then we block the respective Wallet Addres(we can tell the Wallet Address becuase it is recorded on chain, by using the Transcation Hash)

    6. We are avoiding adding more complexity by not bringing in SIWE.


We will tweak these issues some more depending on the Executors, either a double stage proposal or Triple Timelock(Proposal, Executor, Feedback).

We will cross that bridge when we come to it.



### 2. Database
    Connect Database to Backend
    Accomodate Proposal Entity

#### 3. Frontend

    GraphQL instead of Axios
    Make proposal Module
    View proposals Module












## TODO


#### 3. Frontend

    Vote
    Queue/execute.



### 2. Contracts

 
    Add events, admin controls, tests (unit & property), and gas profiling.

    Tokenomics: total supply, distribution, delegation rules.

    Voting parameters: voting delay, voting period (blocks/time), proposal threshold, quorum numerator.

    Timelock delay (seconds) and custom roles





#### 4. Infra & deployment

    Hardhat deploy scripts, verification automation, CI integration.

    Subgraph + TheGraph setup.

    Multisig / Safe treasury + bridging paths.



#### 5. Security & testing - Minimal for Sprint 2(maybe leave as backend if Contracts take too long), more on later Sprints

    Unit tests (Hardhat + Waffle/Chai).

    Integration tests Propose, Vote, Queue, Execute



















## Phase 2 - Production Version

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