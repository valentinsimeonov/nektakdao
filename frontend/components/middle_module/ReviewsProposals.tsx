//ReviewsProposals.tsx


// - Uses ethers BrowserProvider to obtain signer (compatible with the existing CreateProposals approach).
// - Checks ERC20 balance >= 10 tokens (reads decimals at runtime).
// - Sends castVote(proposalId, support) on governor contract and uses optimistic UI while waiting.
// - After on-chain confirmation, calls existing GraphQL mutation (voteUp / voteDown) to notify backend.




/**
 *
 * on-chain Governor reported states for proposals. OpenZeppelin Governor state mapping is:

0 = Pending

1 = Active ← only here can users vote

2 = Canceled

3 = Defeated

4 = Succeeded

5 = Queued

6 = Expired

7 = Executed

 * 
 * 
**/


import './Reviews.css';
// import Loading from "../loading";
import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import Image from 'next/image';
// import Link from 'next/link'; 

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
  'function getVotes(address) view returns (uint256)',   // returns bigint
  'function delegate(address)',
];

const GOVERNOR_ABI_VOTE = [
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
  'function state(uint256) view returns (uint8)',        // OZ: Pending=0, Active=1, Canceled=2, Defeated=3, Succeeded=4, Queued=5, Expired=6, Executed=7
  'function hasVoted(uint256, address) view returns (bool)',
  'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight)',
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

interface PendingVote {
  txHash: string;
  support: 0 | 1 | 2;
  timestamp: number;
}







interface ReviewsProposalsProps {

  }


const ReviewsProposals: React.FC<ReviewsProposalsProps> = () => {


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





  // GraphQL mutations (existing backend)
  const [voteUpMutation] = useMutation(MUTATION_PROPOSALS_VOTE_UP, {
    onCompleted: (data) => {
      // backend returns updated votes; try to apply if shape matches
      if (data?.voteUp) {
        // `voteUp` maybe the updated proposal object
        setProposalData(Array.isArray(data.voteUp) ? data.voteUp : [data.voteUp]);
      }
    },
  });
  const [voteDownMutation] = useMutation(MUTATION_PROPOSALS_VOTE_DOWN, {
    onCompleted: (data) => {
      if (data?.voteDown) {
        setProposalData(Array.isArray(data.voteDown) ? data.voteDown : [data.voteDown]);
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



	const poll = setInterval(fetchBalance, 10000);
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
	  






		

  // support: 1 => For (Vote Up), 0 => Against (Vote Down)


const handleVote = async (support: 0 | 1) => {
  console.log("[vote] triggered", { support, proposalId: proposal?.chain_proposal_id, hasRequiredBalance, isCheckingBalance });

  try {
    if (!proposal) { alert('No proposal selected.'); return; }
    if (!GOVERNOR_ADDRESS) { alert('Governance contract not configured in frontend.'); return; }
    if (!TOKEN_ADDRESS) { alert('Token contract not configured in frontend.'); return; }

    const signer = await getSignerFromWindow();
    if (!signer) { alert('Please connect your wallet in the browser to vote.'); return; }
    const voterAddress = await signer.getAddress().catch(() => null);
    if (!voterAddress) { alert('Wallet not available.'); return; }

    // Ensure chain_proposal_id present and convert to bigint
    const chainProposalIdRaw = proposal.chain_proposal_id ?? null;
    if (!chainProposalIdRaw) { alert('This proposal does not have an on-chain proposal id yet.'); return; }

    let proposalIdBn: bigint;
    try {
      proposalIdBn = BigInt(chainProposalIdRaw);
    } catch (e) {
      try { proposalIdBn = BigInt(String(chainProposalIdRaw)); }
      catch { alert('Invalid on-chain proposal id.'); return; }
    }

    // Prepare provider/contract objects (read-only first)
    const provider = (signer as any).provider ?? new BrowserProvider((window as any).ethereum);
    const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
    const govContract = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI_VOTE, provider);

    // --- Pre-check 1: proposal state ---
    let stateNum: number | null = null;
    try {
      const s = await govContract.state(proposalIdBn);
      stateNum = typeof s === 'bigint' ? Number(s) : Number(s ?? -1);
      console.log('[vote] proposal state', stateNum);
    } catch (e) {
      console.warn('[vote] failed to read proposal state:', e);
    }
    if (stateNum !== null && stateNum !== 1) {
      alert(`Proposal not active (state=${stateNum}). You can only vote while the proposal is Active.`);
      return;
    }

    // --- Pre-check 2: has user already voted? ---
    try {
      const hv = await govContract.hasVoted(proposalIdBn, voterAddress);
      console.log('[vote] hasVoted', hv);
      if (hv === true) {
        alert('You have already voted on this proposal (on-chain).');
        return;
      }
    } catch (e) {
      console.warn('[vote] hasVoted check failed:', e);
    }

    // --- Pre-check 3: voting power / delegation (ERC20Votes) ---
    try {
      const delegated = await tokenContract.delegates(voterAddress).catch(() => null);
      const votesRaw = await tokenContract.getVotes(voterAddress).catch(() => BigInt(0));
      // normalize to bigint
      const votes = typeof votesRaw === 'bigint' ? votesRaw : BigInt(String(votesRaw ?? 0));
      console.log('[vote] delegates, votes', delegated, votes);
      if (votes === BigInt(0)) {
        alert('You have no delegated voting power. If you hold tokens, delegate to yourself first (token.delegate(yourAddress)).');
        return;
      }
    } catch (e) {
      console.warn('[vote] getVotes/delegates failed:', e);
    }

    // Use signer for the Tx
    const govWithSigner = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI_VOTE, signer);

    setIsVoting(true);
    applyOptimistic(support);

    // Send transaction (this will open MetaMask)
    let tx: any = null;
    try {
      // castVote typing sometimes fights TS; cast to any to call (safe at runtime).
      tx = await (govWithSigner as any).castVote(proposalIdBn, support);
      console.log('[vote] tx submitted', tx.hash);
    } catch (txErr: any) {
      console.error('[vote] castVote threw', txErr);
      // try to extract revert data
      const hex = txErr?.data ?? txErr?.error?.data ?? txErr?.transaction?.data ?? null;
      if (hex && (govWithSigner as any).interface) {
        try {
          const parsed = (govWithSigner as any).interface.parseError(hex);
          const msg = parsed?.name ? `${parsed.name}(${JSON.stringify(parsed.args)})` : String(parsed);
          alert('Transaction reverted: ' + msg);
        } catch (_) {
          alert('Transaction failed: ' + (txErr?.message ?? String(txErr)));
        }
      } else {
        alert('Transaction failed: ' + (txErr?.message ?? String(txErr)));
      }
      revertOptimistic(support);
      setIsVoting(false);
      return;
    }

    // record pending vote
    setPendingVotes((p) => ({ ...p, [tx.hash]: { txHash: tx.hash, support, timestamp: Date.now() } }));

    // wait for confirmation
    const receipt = await tx.wait();
    setPendingVotes((p) => {
      const copy = { ...p }; delete copy[tx.hash]; return copy;
    });

    if (!receipt || (receipt as any).status === 0) {
      revertOptimistic(support);
      alert('Vote transaction failed or reverted on-chain.');
      setIsVoting(false);
      return;
    }

    // notify backend
    try {
      if (support === 1) await voteUpMutation({ variables: { id: queryVariables } });
      else await voteDownMutation({ variables: { id: queryVariables } });
    } catch (gqlErr) {
      console.warn('Backend vote mutation failed: ', gqlErr);
      alert('Vote confirmed on-chain — backend update failed or is pending. It will be reconciled shortly.');
    } finally {
      setIsVoting(false);
    }

  } catch (err: any) {
    console.error('Voting error:', err);
    alert(err?.message ?? String(err));
    setIsVoting(false);
  }
};









	const handleVoteUp = async () => handleVote(1);
	const handleVoteDown = async () => handleVote(0);



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

							<button
							className="ProposalsReviewsVoteUpButton"
							onClick={handleVoteUp}
							disabled={isVoting || isCheckingBalance || !hasRequiredBalance}
							title={
								!hasRequiredBalance
								? 'You need at least 10 NKT to vote.'
								: isVoting
								? 'Vote transaction in progress'
								: undefined
							}
							>



							<div className='ProposalsReviewsIconColumn'>
								<Image src='/Voting/VoteUp.png' alt='img' width={200} height={360} className='ProposalsReviewsIconColumnimg'/>
							</div>
							
							<div className='ProposalsReviewsNameColumn'>
								<span className='ProposalsReviewsUpDownTitle'>
									Vote Up
								</span>
							</div>
						</button>

						<button
						className="ProposalsReviewsVoteUpButton"
						onClick={handleVoteDown}
						disabled={isVoting || isCheckingBalance || !hasRequiredBalance}
						title={
							!hasRequiredBalance
							? 'You need at least 10 NKT to vote.'
							: isVoting
							? 'Vote transaction in progress'
							: undefined
						}
						>
							<div className='ProposalsReviewsIconColumn'>
								<Image src='/Voting/VoteDown.png' alt='img' width={200} height={360} className='ProposalsReviewsIconColumnimg'/>
							</div>
							
							<div className='ProposalsReviewsNameColumn'>
								<span className='ProposalsReviewsUpDownTitle'>
									Vote Down
								</span>
							</div>
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








