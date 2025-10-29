

# Research



## Security

### Contracts Security Course - Patrick Collins

https://updraft.cyfrin.io/courses/security/puppy-raffle/reentrancy-recap




## Architecture


### 🧭 Visual Architecture Diagram


                          ┌──────────────────────────────┐
                          │        Your Browser          │
                          │ ──────────────────────────── │
                          │  🌐 Frontend (Next.js / React)
                          │  📦 wagmi / viem / ethers.js
                          └──────────────┬───────────────┘
                                         │
                                         │ API Calls
                                         ▼

                          ┌──────────────────────────────┐
                          │      │
                          │   Backend (Nest.js)
                          │  
                          └──────────────┬───────────────┘
                                         │
                                         │ JSON-RPC Calls
                                         ▼

                   ┌────────────────────────────────────────────┐
                   │          RPC Provider (API Gateway)        │
                   │────────────────────────────────────────────│
                   │ e.g. https://sepolia.base.org              │
                   │ or via Infura / Alchemy / Chainstack       │
                   └──────────────┬─────────────────────────────┘
                                  │
                                  │ Broadcasts Transactions /
                                  │ Retrieves Blockchain State
                                  ▼
              ┌────────────────────────────────────────────────────────┐
              │                 Base Sepolia Network                   │
              │────────────────────────────────────────────────────────│
              │  ⛓️  Validators (real blockchain nodes)                 │
              │  📜  Smart Contracts Deployed:                          │
              │      • NKT Token (ERC20Votes)                           │
              │      • Governor (DAO logic)                             │
              │      • TimelockController (delay + security)            │
              │      • Box (target contract to be changed)              │
              └──────────────┬─────────────────────────────────────────┘
                             │
                             │ Emits Events / Updates State
                             ▼
                     ┌──────────────────────────────┐
                     │         Your Wallet           │
                     │ ───────────────────────────── │
                     │ 🦊 MetaMask / Safe / Ledger    │
                     │ 🔑 Holds private key           │
                     │ 🪙 Holds NKT tokens (votes)    │
                     └───────────────────────────────┘







🪄 How It All Flows During a Proposal
Step	Action	Who does it	What happens under the hood
1️⃣ Propose	Create a proposal	You (via frontend)	wagmi → RPC → Governor.propose()
2️⃣ Vote	Vote For / Against	Token holders	wagmi → RPC → Governor.castVote()
3️⃣ Queue	Queue successful proposal	Anyone	wagmi → RPC → Governor.queue() (calls Timelock)
4️⃣ Execute	Execute after delay	Anyone	wagmi → RPC → Governor.execute() → Box updated
5️⃣ UI updates	Fetch latest proposal state	Frontend polls via eth_call	wagmi reads contract state through RPC









### 🧭 DAO Proposal Lifecycle (Governor + Timelock + Token + Target Contract)



                 ┌───────────────────────────────────────┐
                 │         Proposer (User or Safe)       │
                 │  🧑‍💻 Has NKT voting power             │
                 └───────────────────────────────────────┘
                                  │
                                  │ 1️⃣  Propose change
                                  │
                                  ▼
             ┌──────────────────────────────────────────────┐
             │                Governor Contract             │
             │  📜 NektakGovernor                           │
             │----------------------------------------------│
             │ - Stores proposal details                    │
             │ - Sets voting start/end blocks               │
             │ - Emits `ProposalCreated` event              │
             └──────────────────────────────────────────────┘
                                  │
                                  │ (proposal enters Voting Delay)
                                  ▼
           ┌──────────────────────────────────────────────────┐
           │ 🗳️  Voting Period                                │
           │ Token holders cast votes via `castVote()`        │
           │ Each vote = voting power from NKT balance        │
           └──────────────────────────────────────────────────┘
                                  │
                                  │ (after voting period)
                                  ▼
        ┌────────────────────────────────────────────────────────┐
        │ ⏱️  Queue proposal if passed                           │
        │ Anyone can call `queue(proposalId)`                    │
        │ Governor sends operation → Timelock                    │
        └────────────────────────────────────────────────────────┘
                                  │
                                  │
                                  ▼
        ┌────────────────────────────────────────────────────────┐
        │ 🧩  TimelockController Contract                         │
        │ - Holds queued proposals with a delay (e.g. 1 day)     │
        │ - Prevents instant execution (adds transparency)       │
        │ - Emits `Queued` + `Ready` events                      │
        └────────────────────────────────────────────────────────┘
                                  │
                                  │ (after delay expires)
                                  ▼
         ┌────────────────────────────────────────────────────────┐
         │ 🚀  Execute proposal                                   │
         │ Anyone calls `execute(proposalId)`                     │
         │ Timelock performs call on target contract              │
         └────────────────────────────────────────────────────────┘
                                  │
                                  │
                                  ▼
         ┌────────────────────────────────────────────────────────┐
         │ 🎯  Target Contract (e.g., Box.sol)                    │
         │ Function called, e.g. `store(42)`                     │
         │ Emits `ValueChanged` event                             │
         └────────────────────────────────────────────────────────┘
                                  │
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────────────┐
        │ 🖥️  Frontend (Next.js + wagmi)                          │
        │ - Reads proposal states via RPC                         │
        │ - Updates UI: “Pending → Active → Queued → Executed”    │
        │ - Displays events and history                           │
        └─────────────────────────────────────────────────────────┘



