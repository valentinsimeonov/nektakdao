//ReviewsProposals.tsx

import './Reviews.css';
import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent, useCallback } from 'react';
import Image from 'next/image';

import {useSelector, useDispatch} from 'react-redux';
import { RootState, ProposalData } from '../../store/types';
import { useQuery, useSubscription, useMutation } from '@apollo/client';
import { } from '../../api/proposalsQuery';
import { QUERY_PROPOSALS_BY_ID_CATEGORY, MUTATION_PROPOSALS_VOTE_UP, MUTATION_PROPOSALS_VOTE_DOWN} from '../../api/proposalsQuery';


import { BrowserProvider, Contract, getAddress, parseUnits } from 'ethers';




/* Minimal ABIs */
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function delegates(address) view returns (address)',
  'function getVotes(address) view returns (uint256)',
  'function getPastVotes(address,uint256) view returns (uint256)',
  'function delegate(address)',
];

const GOVERNOR_ABI_VOTE = [
'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
'function state(uint256) view returns (uint8)',
'function hasVoted(uint256, address) view returns (bool)',
'function proposalSnapshot(uint256) view returns (uint256)',
'function proposalDeadline(uint256) view returns (uint256)',
'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight)'
];



/* Environment (set these in NEXT_PUBLIC_*) */
const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || '';
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '';


/* Helper: attempt to obtain an ethers Signer from window.ethereum using ethers v6 BrowserProvider */
async function getSignerFromWindow() {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as any;
  if (!anyWindow.ethereum) return null;
  try {
    const provider = new BrowserProvider(anyWindow.ethereum);
    const signer = await provider.getSigner();
    return signer;
  } catch (e) {
    console.warn('Could not create signer from window.ethereum:', (e as any)?.message ?? e);
    return null;
  }
}


/* Helper to stringify BigInts in receipt objects for JSON sending */
function stringifyBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map((v) => stringifyBigInts(v));
  if (typeof obj === 'object') {
    const out: any = {};
    for (const k of Object.keys(obj)) {
      try {
        out[k] = stringifyBigInts((obj as any)[k]);
      } catch {
        out[k] = String((obj as any)[k]);
      }
    }
    return out;
  }
  return obj;
}



interface PendingVote {
  txHash: string;
  support: 0 | 1 | 2;
  timestamp: number;
}







  interface PendingVote { txHash: string; support: 0 | 1 | 2; timestamp: number; }



const ReviewsProposals: React.FC = () => {


	const proposalsSelectedButton = useSelector((state: RootState) => state.proposals.proposalsSelectedButton);
	const dispatch = useDispatch();
	const [proposalData, setProposalData] = useState<ProposalData[]>([]);
	const proposalsLeftModuleLayer = useSelector((state: RootState) => state.proposals.proposalsLeftModuleLayer);
	const selectedDashboard = useSelector((state: RootState) => state.navbar.selectedDashboard);
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	const [location, setLocation] = useState("");
	

		const queryVariables =
		 selectedDashboard === "proposals" ? proposalsSelectedButton
		: "";





	const { loading: queryLoading, error: queryError, data: queryData } = useQuery(
		QUERY_PROPOSALS_BY_ID_CATEGORY,
		{
		  variables: {
			"id": `${queryVariables}`
		  }
		}
	  );
	
	  useEffect(() => {
		if (queryData) {
		  setProposalData(queryData.proposals);
		}
	  }, [queryData]);
	

	  const proposal = proposalData[0];


    const [proposalState, setProposalState] = useState<number | null>(null);

  // human readable proposals on chain state
  function proposalStateName(n: number | null) {
    if (n === null) return 'unknown';
    switch (n) {
      case 0: return 'Pending';
      case 1: return 'Active';
      case 2: return 'Canceled';
      case 3: return 'Defeated';
      case 4: return 'Succeeded';
      case 5: return 'Queued';
      case 6: return 'Expired';
      case 7: return 'Executed';
      default: return `state:${n}`;
    }
  }


  // GraphQL mutations (existing backend)
  const [voteUpMutation] = useMutation(MUTATION_PROPOSALS_VOTE_UP, {
    onCompleted: (data) => {
      // backend returns updated votes; try to apply if shape matches
      if (data?.voteUp) {
        const payload = data.voteUp;
        // If backend returns the proposal object, update proposalData
        if (Array.isArray(payload)) setProposalData(payload);
        else if (payload && payload.id) setProposalData([payload as any]);
        // fallback: if returns votes, apply local optimistic adjustments handled elsewhere
      }
    },
  });


  const [voteDownMutation] = useMutation(MUTATION_PROPOSALS_VOTE_DOWN, {
    onCompleted: (data) => {
      if (data?.voteDown) {
        const payload = data.voteDown;
        if (Array.isArray(payload)) setProposalData(payload);
        else if (payload && payload.id) setProposalData([payload as any]);
      }
    },
  });





  // Local UI state
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);
  const [hasRequiredBalance, setHasRequiredBalance] = useState<boolean>(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [pendingVotes, setPendingVotes] = useState<Record<string, PendingVote>>({}); // keyed by txHash
  const [optimisticDelta, setOptimisticDelta] = useState<{ up: number; down: number }>({ up: 0, down: 0 });



  // On-chain proposal metadata for UI
// const [proposalState, setProposalState] = useState<number | null>(null);
const [snapshotBlock, setSnapshotBlock] = useState<number | null>(null);
const [deadlineBlock, setDeadlineBlock] = useState<number | null>(null);
const [snapshotTs, setSnapshotTs] = useState<number | null>(null);
const [deadlineTs, setDeadlineTs] = useState<number | null>(null);
const [pastVotesAtSnapshot, setPastVotesAtSnapshot] = useState<bigint | null>(null);
const [delegatedAddress, setDelegatedAddress] = useState<string | null>(null);





// Modal State
const [showDelegateModal, setShowDelegateModal] = useState(false);
const [delegateModalPending, setDelegateModalPending] = useState(false);
const [delegateTxHash, setDelegateTxHash] = useState<string | null>(null);
const [isDelegating, setIsDelegating] = useState(false);



  // Read token balance + decimals using window provider (runs when wallet changes or proposal loads)
  useEffect(() => {
    let mounted = true;
    async function fetchBalance() {
      setIsCheckingBalance(true);
      try {
        const anyWindow = (window as any);
        if (!anyWindow?.ethereum) {
          setTokenDecimals(null);
          setTokenBalance(null);
          setHasRequiredBalance(false);
          setIsCheckingBalance(false);
          return;
        }
        const provider = new BrowserProvider(anyWindow.ethereum);

		const net = await provider.getNetwork();
		console.log("[vote] network", net);


        const signer = await provider.getSigner().catch(() => null);
        const address = signer ? await signer.getAddress().catch(() => null) : null;
        if (!address) {
          setTokenDecimals(null);
          setTokenBalance(null);
          setHasRequiredBalance(false);
          setIsCheckingBalance(false);
          return;
        }
        if (!TOKEN_ADDRESS) {
          console.warn('TOKEN_ADDRESS not configured in frontend env');
          setTokenDecimals(null);
          setTokenBalance(null);
          setHasRequiredBalance(false);
          setIsCheckingBalance(false);
          return;
        }

  const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);


	// decimals may be number or bigint depending on provider; balanceOf should be bigint with ethers v6
	const [decRaw, balRaw] = await Promise.all([
		tokenContract.decimals().catch(() => 18),
		tokenContract.balanceOf(address).catch(() => BigInt(0)),
	]);

	console.log("[balance] decimals, balance raw:", decRaw, balRaw);

	if (!mounted) return;
	const decimalsNum = Number(decRaw ?? 18);
	const balBigInt = typeof balRaw === 'bigint' ? balRaw : BigInt(String(balRaw ?? 0));


	setTokenDecimals(decimalsNum);
	setTokenBalance(balBigInt);


	const required = parseUnits('10', decimalsNum); // returns bigint in ethers v6
	setHasRequiredBalance(balBigInt >= required);

	console.log("[balance] decimalsNum, balBigInt, required", decimalsNum, balBigInt, required);


	} catch (err) {
		console.warn('Failed to read token balance:', err);
		setTokenDecimals(null);
		setTokenBalance(null);
		setHasRequiredBalance(false);
	} finally {
		if (mounted) setIsCheckingBalance(false);
	}
	}
		fetchBalance();



	// const poll = setInterval(fetchBalance, 10000);
  let lastBalStr = '';
  const poll = setInterval(async () => {
    await fetchBalance();
    // optional: log only if changed
    const bStr = tokenBalance ? tokenBalance.toString() : 'null';
    if (bStr !== lastBalStr) {
      console.log("[balance] decimalsNum, balBigInt, required", tokenDecimals, tokenBalance, parseUnits('10', tokenDecimals ?? 18));
      lastBalStr = bStr;
    }
  }, 30000);


	return () => {
	mounted = false;
	clearInterval(poll);
	};
	}, [queryVariables, proposal?.chain_proposal_id]);


	// optimistic UI helpers
	const applyOptimistic = (support: 0 | 1) => {
	if (support === 1) setOptimisticDelta((p) => ({ ...p, up: p.up + 1 }));
	else setOptimisticDelta((p) => ({ ...p, down: p.down + 1 }));
	};
	const revertOptimistic = (support: 0 | 1) => {
	if (support === 1) setOptimisticDelta((p) => ({ ...p, up: Math.max(0, p.up - 1) }));
	else setOptimisticDelta((p) => ({ ...p, down: Math.max(0, p.down - 1) }));
	};


	const displayedVotesUp = (proposal?.votesUp ?? 0) + optimisticDelta.up;
	const displayedVotesDown = (proposal?.votesDown ?? 0) + optimisticDelta.down;











// Fetch proposal snapshot/deadline/state and voting info for the connected signer
useEffect(() => {
let mounted = true;
async function fetchProposalMeta() {
if (!proposal?.chain_proposal_id || !GOVERNOR_ADDRESS || !TOKEN_ADDRESS) {
if (mounted) { setProposalState(null); setSnapshotBlock(null); setDeadlineBlock(null); setSnapshotTs(null); setDeadlineTs(null); setPastVotesAtSnapshot(null); setDelegatedAddress(null); }
return;
}

try {
const anyWindow = (window as any);
if (!anyWindow?.ethereum) { if (mounted) setProposalState(null); return; }
const provider = new BrowserProvider(anyWindow.ethereum);
const gov = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI_VOTE, provider);
const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);


const pid = BigInt(proposal.chain_proposal_id);
// read state, snapshot, deadline
const [sRaw, snapshotRaw, deadlineRaw] = await Promise.all([
gov.state(pid).catch(() => null),
gov.proposalSnapshot(pid).catch(() => null),
gov.proposalDeadline(pid).catch(() => null),
]);
if (!mounted) return;
const s = sRaw == null ? null : (typeof sRaw === 'bigint' ? Number(sRaw) : Number(sRaw));
setProposalState(s);
const snap = snapshotRaw == null ? null : Number(snapshotRaw);
const dead = deadlineRaw == null ? null : Number(deadlineRaw);
setSnapshotBlock(snap); setDeadlineBlock(dead);



// try to get timestamp for snapshot/deadline blocks (best-effort)
try {
if (snap != null) {
const b = await provider.getBlock(snap).catch(() => null);
if (mounted) setSnapshotTs(b?.timestamp ?? null);
}
if (dead != null) {
const b2 = await provider.getBlock(dead).catch(() => null);
if (mounted) setDeadlineTs(b2?.timestamp ?? null);
}
} catch (_) {}


// if signer is present, get address and check delegation/pastVotes at snapshot
const signer = await provider.getSigner().catch(() => null);
const voterAddress = signer ? await signer.getAddress().catch(() => null) : null;
if (voterAddress) {
const [deleg, pastVotesRaw] = await Promise.all([
token.delegates(voterAddress).catch(() => null),
// only call getPastVotes if we have a snapshot block
(snap != null ? token.getPastVotes(voterAddress, snap).catch(() => BigInt(0)) : Promise.resolve(BigInt(0))),
]);

if (!mounted) return;
setDelegatedAddress(deleg ?? null);
const pv = typeof pastVotesRaw === 'bigint' ? pastVotesRaw : BigInt(String(pastVotesRaw ?? 0));
setPastVotesAtSnapshot(pv);
} else {
setDelegatedAddress(null); setPastVotesAtSnapshot(null);
}
} catch (e) {
console.warn('[vote] could not read proposal meta:', e);
if (mounted) { setProposalState(null); setSnapshotBlock(null); setDeadlineBlock(null); setSnapshotTs(null); setDeadlineTs(null); setPastVotesAtSnapshot(null); setDelegatedAddress(null); }
}
}
fetchProposalMeta();
const poll = setInterval(fetchProposalMeta, 20000);
return () => { mounted = false; clearInterval(poll); };
}, [proposal?.chain_proposal_id, GOVERNOR_ADDRESS, TOKEN_ADDRESS]);







  // Self-delegate flow
const selfDelegate = useCallback(async () => {
  setShowDelegateModal(false);          // hide modal when user confirms
  setDelegateModalPending(true);
  setIsDelegating(true);

  try {
    const signer = await getSignerFromWindow();
    if (!signer) { alert('Connect wallet to delegate'); return; }
    const voter = await signer.getAddress().catch(() => null);
    if (!voter) { alert('Cannot determine your address'); return; }

    // Use token interface with delegate
    const tokenWithSigner = new Contract(TOKEN_ADDRESS, ['function delegate(address)'], signer);

    // Send tx
    const tx = await tokenWithSigner.delegate(voter);
    setDelegateTxHash(tx.hash);
    alert('Delegate tx submitted — please confirm in your wallet. Waiting for confirmation...');
    await tx.wait();

    alert('Delegation confirmed. Your votes will be counted for future snapshots.');
    // refresh delegation/pastVotes (best-effort)
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
      const deleg = await token.delegates(voter).catch(() => null);
      setDelegatedAddress(deleg ?? null);
      // Past votes won't change until next snapshot; keep previous value
      setPastVotesAtSnapshot((pv) => pv);
    } catch (_) { /* best-effort */ }
  } catch (err: any) {
    console.error('Delegation failed', err);
    alert('Delegation failed: ' + (err?.message ?? String(err)));
  } finally {
    setDelegateModalPending(false);
    setIsDelegating(false);
  }
}, [setDelegatedAddress, setPastVotesAtSnapshot]);

  






  
	  


	  /////////// Infinite Scrolling ////////////////
	  const [start, setStart] = useState(0);
	  const [end, setEnd] = useState(100);
	  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  
		// Helper function to scroll to the bottom
		const scrollToBottom = () => {
		  if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
		  }
		};
	  






		


 const handleVote = useCallback(async (support: 0 | 1) => {
    console.log('[vote] triggered', { support, proposalId: proposal?.chain_proposal_id, hasRequiredBalance, isCheckingBalance });
    try {
      if (!proposal) { alert('No proposal selected.'); return; }
      if (!GOVERNOR_ADDRESS || !TOKEN_ADDRESS) { alert('Contracts not configured'); return; }
      const signer = await getSignerFromWindow();
      if (!signer) { alert('Please connect your wallet to vote.'); return; }
      const voter = await signer.getAddress().catch(() => null);
      if (!voter) { alert('Wallet not available'); return; }

      const pid = BigInt(proposal.chain_proposal_id);
      const provider = new BrowserProvider((window as any).ethereum);
      const gov = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI_VOTE, provider);
      const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

      // check proposal state (active)
      const sRaw = await gov.state(pid).catch(() => null);
      const s = sRaw == null ? null : (typeof sRaw === 'bigint' ? Number(sRaw) : Number(sRaw));
      if (s !== 1) { alert(`Proposal not active (state=${s}).`); return; }

      // ensure user had voting power at snapshot
      if (snapshotBlock != null) {
        const pv = await token.getPastVotes(voter, snapshotBlock).catch(() => BigInt(0));
        const pvBig = typeof pv === 'bigint' ? pv : BigInt(String(pv ?? 0));
        if (pvBig === BigInt(0)) {
          alert('You had 0 voting power at the proposal snapshot. Delegate to yourself BEFORE the snapshot to vote on similar future proposals.');
          return;
        }
      }

      // cast vote on-chain
      const govWithSigner = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI_VOTE, signer);
      setIsVoting(true);
      applyOptimistic(support);
      let tx: any = null;
      try {
        tx = await (govWithSigner as any).castVote(pid, support);
      } catch (txErr: any) {
        console.error('[vote] castVote threw', txErr);
        alert('Transaction error: ' + (txErr?.message ?? String(txErr)));
        revertOptimistic(support);
        setIsVoting(false);
        return;
      }
      setPendingVotes(p => ({ ...p, [tx.hash]: { txHash: tx.hash, support, timestamp: Date.now() } }));

      // wait for on-chain confirmation
      const receipt = await tx.wait();
      setPendingVotes(p => { const c = { ...p }; delete c[tx.hash]; return c; });
      if (!receipt || (receipt as any).status === 0) {
        revertOptimistic(support);
        alert('Vote tx failed');
        setIsVoting(false);
        return;
      }

      // Build payload to send to backend (includes tx hash & receipt)
      const net = await provider.getNetwork().catch(() => ({ name: 'unknown', chainId: null }));
      const rawReceiptSafe = JSON.stringify(stringifyBigInts(receipt));
      const mutationVars = {
        id: queryVariables, // internal proposal id (your backend resolves this to the proposal row)
        tx_hash: tx.hash,
        chain_proposal_id: proposal.chain_proposal_id ?? null,
        voter_address: voter,
        support: support === 1 ? 1 : 0,
        governor_address: GOVERNOR_ADDRESS || null,
        chain: net.name ?? null,
        chain_id: typeof net.chainId === 'number' ? net.chainId : null,
        block_number: typeof receipt.blockNumber === 'number' ? receipt.blockNumber : (receipt.blockNumber ? Number(receipt.blockNumber) : null),
        raw_receipt: rawReceiptSafe,
        created_at: new Date().toISOString(),
      };

      // notify backend — choose appropriate mutation based on support
      try {
        if (support === 1) {
          await voteUpMutation({ variables: mutationVars });
        } else {
          await voteDownMutation({ variables: mutationVars });
        }
      } catch (gqlErr) {
        console.warn('Backend update failed', gqlErr);
        // backend failure shouldn't revert on-chain vote; notify user
        alert('Vote confirmed on-chain — backend update failed or is pending. It will be reconciled shortly.');
      }

      setIsVoting(false);
    } catch (err: any) {
      console.error('Voting error', err);
      alert(err?.message ?? String(err));
      setIsVoting(false);
    }
  }, [proposal, hasRequiredBalance, isCheckingBalance, snapshotBlock, queryVariables, voteUpMutation, voteDownMutation]);



  const handleVoteUp = () => handleVote(1);
  const handleVoteDown = () => handleVote(0);


  
  const canVote = () => {
    if (!hasRequiredBalance || isCheckingBalance || isVoting) return false;
    if (proposalState !== 1) return false;
    if (snapshotBlock != null && pastVotesAtSnapshot != null && pastVotesAtSnapshot === BigInt(0)) return false;
    return true;
  };



// UI helpers: readable time
const toDateTime = (ts: number | null) => ts ? new Date(ts * 1000).toLocaleString() : 'n/a';



	return (

		<div className="ProposalsReviewsMaincolumn">
	
			<div className='ProposalsReviewscolumn'>
				<div className='ProposalsReviewsAvatarNameVotesrow'>
					<div className='ProposalsReviewsAvatarrow'>
						<div className="ProposalsReviewsImageContainer">
							<img 
								src={`/64/${queryVariables.toLowerCase()}.png`}
								alt={`${queryVariables}L2`} 
								onError={(e) => {
									// When the image fails to load, set a placeholder with the first letter
									if (e.currentTarget.src !== `/64/${queryVariables.toLowerCase()}.png`) {
										e.currentTarget.style.display = 'none'; // Hide the image
										const container = e.currentTarget.parentElement;
										if (container) {
											const placeholder = container.querySelector('.ProposalsReviewsImageContainerPlaceholder');
											if (placeholder) {
												(placeholder as HTMLElement).style.display = 'flex'; // Show the placeholder
											}
										}
									}
								}} 
							/>
							<div className="ProposalsReviewsImageContainerPlaceholder">{queryVariables.charAt(0)}</div>
						</div>
					</div>

					<div className='ProposalsReviewsNamerow'>
						<div className="ProposalsReviewsTitlerow">
							<span>
								{queryVariables.charAt(0).toUpperCase() + queryVariables.slice(1)}
							</span>
						</div>
					</div>

					<div className='ProposalsReviewsVoteButtonsrow'>

            <button className='ProposalsReviewsVoteUpButton' onClick={handleVoteUp} disabled={!canVote()} title={!hasRequiredBalance ? 'You need at least 10 NKT' : proposalState !== 1 ? `Proposal not active (${proposalState})` : (snapshotBlock && pastVotesAtSnapshot === BigInt(0)) ? 'You had 0 voting power at snapshot' : undefined}>
            <div className='ProposalsReviewsIconColumn'><Image src='/Voting/VoteUp.png' alt='img' width={200} height={360} className='ProposalsReviewsIconColumnimg'/></div>
            <div className='ProposalsReviewsNameColumn'><span className='ProposalsReviewsUpDownTitle'>Vote Up</span></div>
            </button>


            <button className='ProposalsReviewsVoteUpButton' onClick={handleVoteDown} disabled={!canVote()} title={!hasRequiredBalance ? 'You need at least 10 NKT' : proposalState !== 1 ? `Proposal not active (${proposalState})` : (snapshotBlock && pastVotesAtSnapshot === BigInt(0)) ? 'You had 0 voting power at snapshot' : undefined}>
            <div className='ProposalsReviewsIconColumn'><Image src='/Voting/VoteDown.png' alt='img' width={200} height={360} className='ProposalsReviewsIconColumnimg'/></div>
            <div className='ProposalsReviewsNameColumn'><span className='ProposalsReviewsUpDownTitle'>Vote Down</span></div>
            </button>



					</div>



				</div>





				<div className="ProposalsReviewsTrustScoreColumn">
					<div className="ProposalsReviewsTrustScorerow1">
						<span>Votes Up</span>
						<span>Votes Down</span>
					</div>

					<div className="ProposalsReviewsTrustScorerow2">
						<span>{proposal ? displayedVotesUp : 'n/a'}</span>
						<span>{proposal ? displayedVotesDown : 'n/a'}</span>
					</div>

					<div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>
						{isCheckingBalance ? (
						<div>Checking NKT balance…</div>
						) : hasRequiredBalance ? (
						<div>Balance gate: OK (≥ 10 NKT)</div>
						) : (
						<div>Balance gate: You need ≥ 10 NKT to vote</div>
						)}
					</div>





{/* Proposal on-chain metadata */}
<div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
<div>Proposal state: <strong>{proposalState == null ? 'unknown' : proposalStateName(proposalState)}</strong></div>
<div>Snapshot block: {snapshotBlock ?? 'n/a'} {snapshotTs ? `(${toDateTime(snapshotTs)})` : ''}</div>
<div>Deadline block: {deadlineBlock ?? 'n/a'} {deadlineTs ? `(${toDateTime(deadlineTs)})` : ''}</div>
<div>Your delegated to: {delegatedAddress ?? 'n/a'}</div>
<div>Your voting power at snapshot: {pastVotesAtSnapshot == null ? 'n/a' : pastVotesAtSnapshot.toString()}</div>
</div>








{/* Self-delegate UI */}
<div style={{ marginTop: 8 }}>
  <button
    onClick={() => setShowDelegateModal(true)}
    disabled={isDelegating || !TOKEN_ADDRESS}
    style={{ padding: '6px 10px', borderRadius: 6 }}
  >
    {isDelegating || delegateModalPending ? 'Delegating…' :
      (delegatedAddress === (typeof window !== 'undefined' && (window as any).ethereum ? ((window as any).ethereum.selectedAddress ?? null) : null)
        ? 'Delegated to you'
        : 'Self-delegate (delegate to yourself)')}
  </button>

  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
    Note: Delegation is a one-time tx. Delegation only affects proposals whose snapshot occurs <strong>after</strong> the delegation is mined.
  </div>

  {/* Modal overlay */}
  {showDelegateModal && (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        background: 'rgba(2,6,23,0.6)'
      }}
    >
      <div style={{
        width: 420,
        maxWidth: '92%',
        background: '#0f172a',
        borderRadius: 8,
        padding: 18,
        boxShadow: '0 10px 30px rgba(2,6,23,0.6)',
        color: '#e6edf3'
      }}>
        <h3 style={{ marginTop: 0 }}>Confirm self-delegation</h3>
        <p style={{ color: '#cbd5e1', marginBottom: 12 }}>
          Delegation gives your ERC20Votes token voting power to <strong>your own address</strong>. This is required for proposals that take snapshots after delegation.
          Delegation is a single on-chain transaction and does not transfer tokens. You only need to delegate once (before the snapshot) — future proposals will use delegated voting power.
        </p>

        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
          <div><strong>Gas</strong>: you will pay gas to confirm the delegation transaction.</div>
          <div><strong>Effect</strong>: takes effect when the delegation tx is mined; only applies to snapshots that occur after mining.</div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowDelegateModal(false)} style={{ padding: '8px 12px', borderRadius: 6, background: '#111827', color: '#cbd5e1', border: '1px solid #1f2937' }}>
            Cancel
          </button>
          <button
            onClick={async () => {
              await selfDelegate();
            }}
            disabled={delegateModalPending}
            style={{ padding: '8px 12px', borderRadius: 6, background: '#0ea5a4', color: '#042027', fontWeight: 600 }}
          >
            {delegateModalPending ? 'Delegating…' : 'Confirm & Delegate'}
          </button>
        </div>

        {/* Optional: show in-modal pending tx hash */}
        {delegateTxHash && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#a3e3d9' }}>
            Last tx: <a href={`https://block explorer/tx/${delegateTxHash}`} target="_blank" rel="noreferrer" style={{ color: '#bff0e8' }}>{delegateTxHash.slice(0, 8)}…</a>
          </div>
        )}
      </div>
    </div>
  )}
</div>








					{Object.keys(pendingVotes).length > 0 && (
						<div style={{ marginTop: 8, fontSize: 12, color: '#ffd580' }}>
						Pending votes: {Object.keys(pendingVotes).length}
						</div>
					)}
					</div>
				</div>






		</div>

	);
};


export default ReviewsProposals;








