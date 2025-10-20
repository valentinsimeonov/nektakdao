# Nektak DAO
The On-chain part of Nektak.

//////////////////////////////////////////////////////////////////////////

Nektak DAO **Governance** Charter - Draft

//////////////////////////////////////////////////////////////////////////

## Disclaimer 

### !!! Until we deploy On-chain, everything is subject to Change.
### !!!!!!! Great Products come from Constantly Tweaking them. Improving them, Changing them, Adding to them and Removing from them.

### !!! Updates will happen in bulk not by commits.

//////////////////////////////////////////////////////////////////////////








### 1. Overview

Nektak DAO is a decentralized, member-owned organization whose mission is to enable the many to lobby, ending wars and advancing global peace by pooling resources and exercising collective influence.

We believe in Freedom and Love, Respect and Helping one Another as a Way of Living.

We calculate towards the last levels of abstraction Harmony, Beauty, Love and Light.

This governance framework defines how power, decision-making, and resources are distributed and maintained in a fair, transparent, and resilient way.



### 2. Core Principles

Decentralization: No individual, group or generation may control the DAO unilaterally.

Fairness: Power is earned by contribution and participation, not just by wealth.

Transparency: All transactions, decisions, and metrics are public and auditable.

Resilience: Systems are designed to resist capture, failure, and manipulation.

Peace and Impact: Every initiative must align with the DAO’s mission to promote peace, equality, and civic empowerment.



### 3. Governance Architecture

The DAO operates through a three-layer structure:

Governor Contract (On-chain Governance):

Based on OpenZeppelin’s Governor + ERC20Votes standard.

Handles proposals, voting, and execution queueing.

Timelock Controller:

Holds execution authority for approved proposals.

Introduces a time delay (e.g., 2 days) before changes or transfers occur.

Treasury (Gnosis Safe Multisig):

Holds assets.

Initially controlled by a small multisig; transitions to DAO control after decentralization milestone.




### 4. Tokenomics

Token Name	Nektak Token
Symbol	    NKT
Standard	ERC20Votes
Decimals	18
Supply	    Dynamic (mintable & burnable by DAO proposals)
Network	    Base (Ethereum Layer 2)

Distribution

Treasury	                    40%	DAO-controlled
Community / Grants / Liquidity	30%	Distributed over time via proposals
Founders & Team	                15%	1-year cliff + 3-year linear vesting
Advisors / Partners	            5%	6-month cliff + 1-year vesting
Ecosystem / Incentives	        10%	Used for rewards, partnerships



### 5. Governance Power Formula

Voting power is based on three dimensions:

EVP = T * (1 + β * W_norm) * D(t)


T = Token balance (or staked balance used in voting).

W_norm = Normalized Work Score (0–1), earned via contribution.

β = Governance weight of contribution (suggested β = 2).

D(t) = Time-based multiplier in the Nektak Cycle (3-year curve).

This model ensures:

Token ownership matters but does not dominate.

Active contribution increases influence.

Time and loyalty are rewarded through cyclical participation.



### 6. Governance Cycle (Nektak DAO Cycle)
D(t): Time Multiplier Dynamics

Phase A (Ascend) – First 540 days: multiplier grows linearly from 1x → 10x

Phase B (Descend) – Next 540 days: decreases linearly from 10x → 1x

Cycle Reset: After 3 years, cycle restarts, preventing indefinite power accumulation.

Purpose

Encourages continuous participation and renewal. Long-term members maintain influence only through active involvement.


### 7. Proposal Lifecycle
1. Proposal Creation

Proposals must include:

Mission and Vision

Problem and Solution

Estimated budget, team and what is the measurable expected outcome


2. Voting Period

Voting duration: 5 days (configurable, TBD).

Voting power snapshot taken at proposal creation.

Quorum: 4% of total delegated votes (initially).  TBD

Voting types: For / Against / Abstain.

3. Timelock Delay

Approved proposals enter a Timelock (2-day delay) to allow review or cancellation in case of emergency.

4. Execution

Once timelock expires, proposal is executed automatically by Governor, transferring funds or calling contracts as specified.


### 8. Emergency & Security Controls
Guardian Multisig (Temporary)

A 2-of-3 multisig can pause DAO execution in case of emergency.

Limited powers: may pause contract actions, cannot change governance parameters.

Sunset clause: Guardian role expires 12 months post-launch.

Upgradeability

Contracts use UUPS proxy pattern.

Only DAO proposals through the Timelock can upgrade logic.

Audits & Bounties

All smart contracts will be audited prior to mainnet deployment.

Bug bounty program on Immunefi (or equivalent) post-launch.




### 9. Treasury Management
Treasury Structure

Initial treasury: Gnosis Safe multisig (2-of-3).

After decentralization: migrate to SafeSnap (DAO-controlled execution).

Funding streams: donations, token sales, grants, and yield from treasury strategies.

Disbursement Rules

All fund movements must be executed via approved DAO proposals.

Periodic “operational budget” votes allocate funding to working groups or Nektak LLC for execution.





### 10. Participation & Work Score
Work Score Definition

Non-transferable contribution score reflecting verified DAO work:

Development, research, outreach, governance facilitation, etc.

Verified via working group attestation or oracle process.

Decays over inactivity (e.g., -5% per month of no contribution).

Impact

Work Score boosts voting power via the EVP formula.
Prevents plutocracy by rewarding labor and participation, not just capital.




### 11. Decentralization Roadmap

0. Genesis (Founding)	
Month 0–3	
Founder-led multisig (2-of-3)
Contracts deployed, DAO seeded


1. Transition
Month 3–12
Hybrid: Guardian multisig + DAO proposals
Governance begins, maybe SafeSnap integrated (TBD)


2. Full DAO
Month 12+
DAO-controlled
All treasury actions on-chain, multisig retired





### 12. Off-chain Tools & Integrations

Snapshot: Off-chain signaling votes and discussions

The Graph: Indexing proposals, votes, holders, Work Scores

IPFS / Arweave: Store metadata, proposal documents

SafeSnap: Connect Snapshot votes with Gnosis Safe for execution

Discourse / Commonwealth / Farcaster: Governance discussion & coordination



### 13. Compliance & Legal Alignment

Nektak LLC acts as the legal interface for off-chain execution (contracts, lobbying activities).

All lobbying and fund disbursement comply with jurisdictional laws.

KYC may be required for grantees and off-chain partners.

DAO remains pseudonymous for voting but legally compliant for treasury actions.



### 14. Amendments

After Deployment On-chain on Actual L2 Base (not Testnet) this document (governance.md) can be amended only via DAO proposal and vote.
Amendments require: TBD

Quorum: 5% of total votes.

Supermajority: ≥ 66% For votes.

Timelock delay: 5 days before enforcement.



### 15. Transparency & Reporting

All treasury transactions visible on BaseScan (Base L2 Explorer).

DAO publishes quarterly reports via IPFS (budget, decisions, outcomes).

Public dashboard (using The Graph + Next.js frontend) will visualize DAO performance metrics.













