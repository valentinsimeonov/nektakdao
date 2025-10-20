# Nektak DAO
The On-chain part of Nektak.

//////////////////////////////////////////////////////////////////////////

Nektak DAO **Architecture** - Draft

//////////////////////////////////////////////////////////////////////////

## Disclaimer 

### !!! Until we deploy On-chain, everything is subject to Change.
### !!!!!!! Great Products come from Constantly Tweaking them. Improving them, Changing them, Adding to them and Removing from them.

### !!! Updates will happen in bulk not by commits.

//////////////////////////////////////////////////////////////////////////





### 1. Overview

The Nektak DAO is a hybrid on-chain/off-chain system built on Base (Ethereum Layer 2) that enables decentralized governance, treasury control, and contributor coordination.

It integrates smart contracts (on-chain governance) with off-chain infrastructure (frontend, subgraph, snapshot, and IPFS), achieving a balance between scalability, transparency, and accessibility.


### 2. Architectural Goals

Security: Minimize single points of failure through time-locks, multi-sigs, and audits.

Transparency: On-chain logic for proposals, votes, and treasury control.

Scalability: Off-chain components (Snapshot, The Graph) for data querying and user experience.

Composability: Built using modular, audited open-source standards.

Cost Efficiency: Deployed and operated on Base L2.



### 3. High-Level Architecture


                      ┌────────────────────────────────────────────┐
                      │                 Users                      │
                      │ (Token holders, voters, contributors)      │
                      └────────────────────────────────────────────┘
                                         │
                                         ▼
                     ┌──────────────────────────────────────────────┐
                     │              Frontend (Next.js)              │
                     │ Typescript + Apollo Client + Wagmi + Ethers │
                     └──────────────────────────────────────────────┘
                                         │
                                         ▼
               ┌────────────────────────────────────────────────────────┐
               │                   Off-Chain Layer                      │
               │                                                        │
               │  • Snapshot (signaling votes)                          │
               │  • IPFS/Arweave (proposal metadata)                    │
               │  • The Graph Subgraph (index DAO state)                │
               └────────────────────────────────────────────────────────┘
                                         │
                                         ▼
           ┌────────────────────────────────────────────────────────────┐
           │                     On-Chain Layer (Base)                  │
           │                                                            │
           │  Governor Contract  ←→  Timelock Controller                │
           │          │                           │                     │
           │          ▼                           ▼                     │
           │  ERC20Votes Token         Gnosis Safe Treasury              │
           │          │                           │                     │
           │          └──────────── SafeSnap / Module ───────────────────┘
           │
           └────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
                        ┌────────────────────────────────────┐
                        │        Off-chain Services           │
                        │   (Backend API, Database, Redis)    │
                        │   • Nektak Portal Integration       │
                        └────────────────────────────────────┘









### 4. On-Chain Components


1. Smart Contract Suite

NektakToken.sol	

ERC20Votes	

DAO token with governance extensions, mint/burn via proposals


GovernorNektak.sol

Governor

Manages proposals, votes, quorum, and execution logic


TimelockController.sol

Governance control

Enforces execution delays and proposal scheduling


TreasurySafe (Gnosis Safe)

Multisig wallet

Holds DAO assets; integrated with SafeSnap module




Vesting.sol

Vesting

Manages team and advisor token release schedules




WorkScoreOracle.sol TBD(not at Phase 1, definitely later stage)	

Oracle / Points

Records contributor Work Scores and normalizes for governance weighting


All contracts will be built using OpenZeppelin 5.x templates with minimal customization for auditability and to make it easier for us to build in the beginning.




2. Contract Relationships

┌──────────────────┐
│ NektakToken      │◄── delegates ──┐
│ (ERC20Votes)     │                │
└──────────────────┘                │
                                   ▼
                             ┌───────────────┐
                             │ GovernorNektak│
                             │  (Proposals)  │
                             └───────────────┘
                                   │
                    queue() / execute() │
                                   ▼
                           ┌────────────────┐
                           │ TimelockController │
                           │ (Execution delay)  │
                           └────────────────┘
                                   │
                                   ▼
                           ┌────────────────┐
                           │ Gnosis Safe    │
                           │ (Treasury)     │
                           └────────────────┘





5. Off-Chain Components


1. Snapshot

Used for gasless signaling votes.

Snapshot strategies:

erc20-balance-of (NKT balance)

workscore-subgraph (optional)

Connected to SafeSnap for on-chain execution.



2 IPFS / Arweave

Stores off-chain proposal metadata:

Title, description, documents, links, budgets.

IPFS CID referenced in on-chain proposals.

Ensures censorship-resistant data storage.



3 The Graph Subgraph

Indexes:

Token holders, delegates, proposals, votes, and Work Scores.

Serves as the data source for the DAO frontend.

Technologies:

GraphQL schema + AssemblyScript mappings.




Entity

type Proposal @entity {
  id: ID!
  proposer: Bytes!
  startBlock: BigInt!
  endBlock: BigInt!
  votesFor: BigInt!
  votesAgainst: BigInt!
  status: String!
  metadataURI: String!
}





### 6. Frontend Layer


Nektak DAO Frontend

Next.js + TypeScript

User interface for proposals, votes, treasury & profiles



State Management

Redux Toolkit - We loooooove Redux :)

Global DAO and user state


GraphQL

Apollo Client

Fetch data from Subgraph


Wallet Integration

Wagmi + RainbowKit

Wallet connection and Base L2 compatibility


Contract Interaction

Ethers.js

Execute DAO proposals, view votes, query balances



UI Toolkit

Custom Made CSS, yo!

Modular, accessible component system





Frontend Modules

Dashboard: Overview of proposals, treasury, and participation.

Governance: Create, vote, delegate, and view proposals.

Contributors: View Work Scores and DAO cycles.

Treasury: View Safe balances and transactions.

Docs: Read on-chain governance documents directly.






### 7. Backend Layer

We will need to figure out how much of the "Score" we keep in the Backend and ho much will be On-chain, TBD


The backend should support additional functionality like:

Work Score verification

Off-chain data caching (PostgreSQL + Redis)

Contributor reputation management

Integration with Nektak Portal

Tech Stack:

Language: TypeScript

Framework: Nest.js API routes

ORM: TypeORM + PostgreSQL

Cache: Redis

Infra: Docker containers (frontend, backend, db, redis, nginx)

Host: AWS EC2 (existing infrastructure)






### 8. Infrastructure & DevOps

1 Local Development Environment

Docker Compose network:

frontend (Next.js)

backend (API + GraphQL)

postgres (data)

redis (cache)

nginx (reverse proxy)



Makefile Command entrypoint:

**make fast**


Still Going! 

      :love:



2. Staging & Production

Deployed on AWS EC2 free-tier-friendly.

Fun Fact, Nektak Portal is currently costing us 0.60euro cents per month(Hosting, APIs all free, Own CI/CD). Rime with me :).
All Open source tech, all done by us.


Smart contracts deployed via Hardhat (local, Base testnet, Base mainnet).

CI/CD via GitHub Actions:

Lint, test, build contracts.

Deploy verified contracts to Base testnet.

Run Subgraph deploy via graph deploy.



### 9. Deployment Phases


0. Local

Hardhat local

Token, Governor, Timelock

Local testing


1. Testnet

Base Goerli

All contracts + Subgraph + Frontend

Full integration test


2. Audit

N/A	Source review + test coverage

Pre-launch checks


3. Mainnet Launch

Base Mainnet

Contracts + SafeSnap + Snapshot

Public deployment


4. Portal Integration

Nektak Portal

DAO <-> Web2 Bridge

In Phase 2 milestone (gonna take a while to reach this)




### 10. Security Model


Timelock

Ensures delay before execution of any DAO decision.



Guardian Multisig

Temporary emergency stop (2-of-3, sunsets after 12 months).



DAO-Controlled Upgradeability

Only DAO can upgrade via Timelock proposal.



Audits

Contracts audited before mainnet deployment.



Bug Bounty

Post-launch bounty via Immunefi (or equivalent).





### 11. Data Flows



1. Proposal Flow

User creates proposal via frontend.

Proposal metadata uploaded to IPFS.

Proposal transaction sent to GovernorNektak contract.

Event indexed by Subgraph.

Voters vote. Haters Hate. Lovers Love. Some Meditate.

Proposal passes then is queued in Timelock.

After delay, executed.  TBD: Safe transfers funds or calls contracts.


2. Work Score Flow

Contributor performs verified action (off-chain).

Backend verifies and logs WorkScore entry.

Oracle (optional) pushes normalized score on-chain.

Score affects voting power formula (via frontend/Subgraph calculation).







### 12. Monitoring & Analytics


TBD




### 13. Integration with Nektak Portal

TBD











Navigating mental tides while the full moon rides :)


https://www.youtube.com/watch?v=wdObsqXLKfg&list=RDwdObsqXLKfg&start_radio=1



