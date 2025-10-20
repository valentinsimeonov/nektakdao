# Nektak DAO
The On-chain part of Nektak.

//////////////////////////////////////////////////////////////////////////

Nektak DAO **Tokenomics** - Draft

//////////////////////////////////////////////////////////////////////////

## Disclaimer 

### !!! Until we deploy On-chain, everything is subject to Change.
### !!!!!!! Great Products come from Constantly Tweaking them. Improving them, Changing them, Adding to them and Removing from them.

### !!! Updates will happen in bulk not by commits.

//////////////////////////////////////////////////////////////////////////





### 1. Overview

Token Name: Nektak Token
Symbol: NKT
Standard: ERC20Votes (OpenZeppelin)
Decimals: 18
Supply: Dynamic (DAO-governed minting & burning)
Network: Base (Ethereum Layer 2)

The Nektak Token (NKT) powers Nektak DAO governance, treasury participation, and contributor incentives.
It is a governance-enabled ERC20 that integrates with Governor, Timelock, and Treasury contracts, allowing on-chain voting and proposal execution.



### 2. Token Purpose


Governance: 
grants voting power in DAO decisions.

Reputation & Influence: 
weighted by contribution (Work Score) and time (Nektak Cycle).

Utility: 
used for staking, proposal deposits, and DAO service payments.

Incentive & Coordination:
distributed to reward contributors, fund aligned projects, and bootstrap ecosystem liquidity.



NKT is not designed as a speculative asset but as a coordination and governance mechanism empowering collective action toward peace and global lobbying transparency.







### 3. Token Supply & Minting Policy

1. Initial Supply


Treasury (DAO)	                40%	    Fully DAO-controlled
Community / Grants / Liquidity	30%	    Released via proposals
Founders & Core Team	        15%	    1-year cliff + 3-year linear vesting
Advisors & Partners	            5%	    6-month cliff + 1-year vesting
Ecosystem Incentives	        10%	    Ongoing contributor rewards



Supply is not fixed. NKT can be minted or burned by DAO vote (via Governor → Timelock → Token control flow).



Total Genesis Supply (T₀): 100,000,000 NKT (as a starting point for us to be able to build, will be adjusted before launch)




2. Minting Rules

Only executable DAO proposals may call mint(address to, uint256 amount).

Minting is subject to:

Timelock delay: Minimum 2 days.

Cap per period: Max 5% of circulating supply per 90 days (can be amended by DAO).

Purpose tagging: Each mint must specify purpose (grants, contributors, liquidity, etc.) for transparency.




3. Burning Rules - TBD

DAO may vote to burn tokens from:

Treasury reserves (deflationary control).

Seized or inactive wallets (subject to on-chain policy).

Buyback & burn events (funded by treasury).

However maybe it will be best that instead of burning tokens we just give them to the members, we will need to determine, TBD






### 4. Vesting & Distribution Mechanics


1. Vesting Smart Contracts

Founders & Team:
Implemented via OpenZeppelin’s TokenVesting contract.

Cliff: 12 months

Duration: 48 months total (36 months linear after cliff)



Advisors:

Cliff: 12 months, also depends on how long the contract

Duration: 18 months total

DAO-controlled release schedule.

Ecosystem Rewards:
Streamed via Sablier or Superfluid for real-time payments (optional enhancement).



2. Grant & Liquidity Distribution

All emissions beyond the genesis allocations occur through approved DAO proposals, verified by the Timelock contract.
Examples:

Contributor compensation

Community liquidity rewards

Partner or ecosystem incentives

Each emission must be transparently logged in the DAO’s quarterly on-chain report.




### 5. Inflation & Monetary Policy

Nektak DAO embraces a dynamic inflation model managed by community proposals and transparent reporting.


Target annual inflation	        0–5% (configurable by DAO)
Burn mechanism	                10–50% of treasury profits or transaction fees can be burned
Treasury yield allocation	    Yield from DAO investments reinvested or distributed per proposal
Work Score reward pool	        A percentage (e.g., 1–2%) of new tokens minted per cycle fund active contributors




Guiding Principles

Keep inflation low and predictable.

Reward active contributors over passive holders.

Adjust supply only via DAO consensus and public transparency.




### 6. Governance Integration (ERC20Votes)


NKT integrates OpenZeppelin’s ERC20Votes, providing:

Delegation: No, users can;t delegate their voting power


Ceckpoints: Historic vote balances are recorded for each block.

Compatibility: Fully compatible with Governor contract for on-chain proposals and votes.

Snapshot sync: Off-chain Snapshot voting mirrors ERC20Votes balances at block height.

This ensures fair, auditable, and decentralized voting power at all times.




### 7. Utility Functions

Proposal Staking
Members may need to stake NKT to create proposals, reducing spam. Refunded after vote ends.

Bounty Payment
Contributors paid in NKT for completed tasks.

Service Settlement
Nektak LLC and other partners may receive NKT as payment for DAO-approved lobbying or technical services.

Reputation Boost
Locked or staked NKT may yield higher Work Score multipliers.

Access Gating
Certain features (voting, chat, working groups) require holding or staking NKT.



### 8. Token Economics Model

1. Effective Voting Power

EVP = T * (1 + β * W_norm) * D(t)


Where:

T = NKT token balance

W_norm = Normalized Work Score (0–1)

β = Work Score coefficient (initially 2)

D(t) = Time multiplier (Nektak Cycle: 3 years)



2 Impact

This hybrid model ensures that:

Pure token holding ≠ absolute power.

Work and time create earned influence.

DAO resists plutocracy by rewarding active, loyal contributors.




### 9. Treasury Composition & Flow

Treasury Assets (initial):

NKT tokens (DAO reserves)

ETH or USDC (liquidity / grants)

Future: Real-world assets or governance tokens from partnerships

Revenue Sources:

Token sales (public rounds or OTC to partners)

Donations (Gitcoin, Giveth, etc.)

Returns from staking, yield, or partnerships

Service revenue from Nektak LLC contracts

Spending Categories:

DAO contributor compensation

Grant funding for aligned causes

Treasury growth strategies

Infrastructure maintenance (dev, audits, ops)

All fund movements pass through the Governor → Timelock → Gnosis Safe execution pipeline.




### 10. Transparency & Reporting

Real-time dashboard: Subgraph + Next.js frontend visualizes token supply, vesting, and DAO holdings.

Quarterly reports: Include inflation rate, emissions, treasury value, and Work Score pool usage.

Open-source data: All token and vesting contracts published and verified on BaseScan.

DAO members can always verify:

Total circulating supply

Tokens vested/unvested

Treasury transactions

Mint/burn history





### 11. Economic Safeguards


Minting Cap per Period Prevents runaway inflation.

Timelock Governance All supply changes delayed and public.

Work Score Verification Prevents reward gaming.

DAO-Audited Treasury Third-party reviews of spending & token flows.

Emergency Pause (Guardian) Temporary circuit breaker for minting during anomalies (sunsets after 12 months).





### 12. Long-Term Sustainability


1. Token Utility Expansion (Future)

Staking → Yield: Staked NKT earns part of treasury yield.

Quadratic Funding Matching: Use NKT as matching weight in Nektak-sponsored public goods rounds.

Governance NFTs: Possible non-fungible “identity badges” bound to NKT holders with Work Score integration.

Treasury Diversification: Gradual allocation into ETH, USDC, and aligned DAO tokens.




2. DAO Treasury Policy

Maintain at least 12 months of operating runway.

Cap NKT emissions to sustain long-term value.

Allocate >50% of treasury assets to mission-aligned initiatives (peace, civic coordination, lobbying for global equity).







