// components/proposals/CreateProposals.tsx
"use client";

import "./CreateProposals.css";
import React, { useState, useEffect, useRef } from "react";
import { RootState } from "../../store/types";
import { useSelector, useDispatch } from "react-redux";
import { MUTATION_CREATE_PROPOSAL } from '../../api/proposalsQuery';
import { useMutation } from "@apollo/client";
import { useAccount } from "wagmi";
import { BrowserProvider, Contract, type JsonRpcSigner, keccak256, toUtf8Bytes, getAddress } from "ethers";



const TEXTAREA_MAX = 2000;

// shared helper to clamp and set textarea value + keep autosize behaviour
function setTextareaValueAndAutosize(
  setter: (v: string) => void,
  ta: HTMLTextAreaElement,
  newValue: string
) {
  const clamped = newValue.slice(0, TEXTAREA_MAX);
  setter(clamped);
  // autosize:
  ta.style.height = "auto";
  ta.style.height = `${ta.scrollHeight}px`;
}

// keydown handler that prevents typing when at limit (but allows navigation, deletion, ctrl/meta combos,
// and also allows replacement of selected text when the result won't exceed the limit)
function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  const ta = e.currentTarget;
  const currentLen = ta.value.length;
  const selStart = ta.selectionStart ?? 0;
  const selEnd = ta.selectionEnd ?? 0;
  const selLen = Math.max(0, selEnd - selStart);

  // allow control/meta combos (copy/paste/undo), navigation keys, and deletion:
  const allowedKeys = new Set([
    "Backspace", "Delete",
    "ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
    "Home","End","PageUp","PageDown",
    "Tab", // allow tab if you want
  ]);

  if (e.ctrlKey || e.metaKey) {
    // allow common shortcuts (Ctrl/Cmd + X/C/V/A/Z/Y)
    return;
  }
  if (allowedKeys.has(e.key)) return;

  // If the user types a normal character and we are already at the limit
  // but there is a selected range that will be replaced, allow it if the
  // result would be <= TEXTAREA_MAX.
  const resultingLength = currentLen - selLen + 1; // +1 for the new typed char
  if (resultingLength > TEXTAREA_MAX) {
    e.preventDefault();
  }
}

// paste handler to trim incoming paste to available room, preserving selection replacement
function handleTextareaPaste(
  e: React.ClipboardEvent<HTMLTextAreaElement>,
  setter: (v: string) => void
) {
  const ta = e.currentTarget;
  const paste = e.clipboardData.getData("text");
  if (!paste) return; // nothing to do

  const current = ta.value;
  const selStart = ta.selectionStart ?? 0;
  const selEnd = ta.selectionEnd ?? 0;
  const selLen = Math.max(0, selEnd - selStart);

  const available = TEXTAREA_MAX - (current.length - selLen);
  if (available <= 0) {
    // no room at all
    e.preventDefault();
    return;
  }

  // if paste length exceeds available, trim it
  const toInsert = paste.slice(0, available);

  // build new value
  const newValue = current.slice(0, selStart) + toInsert + current.slice(selEnd);
  e.preventDefault(); // we've handled insertion
  // set value and autosize
  setTextareaValueAndAutosize(setter, ta, newValue);
}







/* Minimal ABIs used for on-chain proposal */
 const GOVERNOR_ABI = [
   "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
   "function votingDelay() view returns (uint256)",
   "function votingPeriod() view returns (uint256)",
   "event ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
 ];


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";





/* Helper: short fallback UUIDv4 generator if crypto.randomUUID unavailable */
function fallbackUUIDv4() {
  // simple RFC4122 v4-like generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* Helper: attempt to obtain an ethers Signer from window.ethereum using ethers v6 BrowserProvider */
async function getSignerFromWindow(): Promise<JsonRpcSigner | null> {
  if (typeof window === "undefined") return null;
  const anyWindow = window as any;
  if (!anyWindow.ethereum) return null;
  try {
    // ethers v6: BrowserProvider
    const provider = new BrowserProvider(anyWindow.ethereum);
    // getSigner returns a JsonRpcSigner (v6)
    const signer = await provider.getSigner();
    return signer;
  } catch (e) {
    console.warn("Could not create signer from window.ethereum:", (e as any)?.message ?? e);
    return null;
  }
}



// ---------- Small Modal component ----------
function ResultModal({ open, onClose, payload }: { open: boolean; onClose: () => void; payload: { ok: boolean; status?: string | null; id?: string | null; message?: string | null } | null }) {
  if (!open) return null;
  const title = payload?.ok ? 'Proposal saved' : 'Proposal result';
  return (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
  <div style={{ background: '#0f172a', color: 'white', padding: 20, width: 420, borderRadius: 8, boxShadow: '0 8px 40px rgba(2,6,23,0.7)' }}>
  <h3 style={{ marginTop: 0 }}>{title}</h3>
  <div style={{ marginBottom: 12, fontSize: 14 }}>
  <div><strong>Status:</strong> {payload?.status ?? 'UNKNOWN'}</div>
  {payload?.id && <div style={{ marginTop: 6 }}><strong>ID:</strong> {payload.id}</div>}
  {payload?.message && <div style={{ marginTop: 6, color: '#ffd6b3' }}>{payload.message}</div>}
  </div>
  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
  <button onClick={onClose} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 6 }}>Close</button>
  </div>
  </div>
</div>
);
}









export default function CreateProposals(): JSX.Element {



  const dispatch = useDispatch();

  const l2DopdownButton = useSelector(
    (state: RootState) => state.proposals.l2DopdownButton
  );
  const l2SelectedSubFunc = useSelector(
    (state: RootState) => state.proposals.l2SelectedSubFunc
  );

  const [currentDate, setCurrentDate] = useState<Date>(new Date());



  const [Titledata, setTitledata] = useState("");
  const [DescriptionBody, setDescriptionBody] = useState("");
  const [MissionBody, setMissionBody] = useState("");
  const [BudgetBody, setBudgetBody] = useState("");
  const [ImplementBody, setImplementBody] = useState("");
  const [categoryType, setCategoryType] = useState("");




  // New state: UX / verification lifecycle
  const [flowStatus, setFlowStatus] = useState<
    | "IDLE"
    | "PENDING_TX"
    | "AWAITING_CONFIRMATIONS"
    | "CONFIRMED"
    | "FAILED_TX"
    | "MISMATCH"
    | "MANUAL_REVIEW"
  >("IDLE");

  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [lastChainProposalId, setLastChainProposalId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


const [modalOpen, setModalOpen] = useState(false);
const [modalPayload, setModalPayload] = useState<any>(null);


  const handleTitleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitledata(event.target.value);
  };

  // Typed textarea handlers
  const handleDescriptionBody = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescriptionBody(event.target.value);
    // event.target is a HTMLTextAreaElement, so style access is safe
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  const handleMissionBody = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMissionBody(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  const handleBudgetBody = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBudgetBody(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  const handleImplementBody = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setImplementBody(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  const handleCategoryButton = (category: string) => {
    setCategoryType(category);
    console.log(
      "F-Inside CreateProposal.tsx  -- handleCategoryButton --, category variable holds:",
      category
    );
  };

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);



// Build the description JSON (must include proposal_uuid)
  function buildOnChainDescription(proposal_uuid: string) {
    return {
      proposal_uuid,
      title: Titledata,
      description: DescriptionBody,
      mission: MissionBody,
      budget: BudgetBody,
      implement: ImplementBody,
      dateCreated: currentDate.toISOString(),
      category: categoryType,
    };
  }





/* Wagmi account */
  const { address, isConnected } = useAccount();

  // Read governor address from client env var - set NEXT_PUBLIC_GOVERNOR_ADDRESS in .env
  const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "";
  const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "";




  // GraphQL mutation hook
  type CreateResp = {
    createProposal: {
    ok: boolean;
    status?: string | null;
    id?: string | null;
    message?: string | null;
    } | null;
  };


	  const [createProposal, { loading, error }] = useMutation(MUTATION_CREATE_PROPOSAL, {
		onCompleted: (data) => {
		  if (data.createProposal) {  // Check if the response is true

      setTitledata("");
      setDescriptionBody("");
      setMissionBody("");
      setBudgetBody("");
      setImplementBody("");
      // setImageUrl(null);
      // setAvatarFile(null);
      setCategoryType("");
      
			console.log('Proposal sent successfully: ', data);
      
		  } else {
			console.error('Failed to send proposal.');
		  }
		},
		onError: (err) => {
		  console.error("Error sending proposal:", err);
		}
	  });











  /*/// Scroll Into View //*/
  //////////////////////////

  const descriptionContainerRef = useRef<HTMLDivElement | null>(null);
  const missionContainerRef = useRef<HTMLDivElement | null>(null);
  const budgetContainerRef = useRef<HTMLDivElement | null>(null);
  const implementContainerRef = useRef<HTMLDivElement | null>(null);


  // safe scrolling when l2SelectedSubFunc changes
  useEffect(() => {
    if (l2SelectedSubFunc === "description") {
      descriptionContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (l2SelectedSubFunc === "mission") {
      missionContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (l2SelectedSubFunc === "budget") {
      budgetContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (l2SelectedSubFunc === "implement") {
      implementContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [l2SelectedSubFunc]);

  //////////////////////////



  ////////////////////////////////////////////////////////////
  /////// Form validation (pre-sign)
  ////////////////////////////////////////////////////////////
  const isNonEmpty = (s?: string) => !!s && s.trim().length > 0;
  const isFormValid = React.useMemo(() => {
    return (
      isNonEmpty(Titledata) &&
      isNonEmpty(categoryType) &&
      isNonEmpty(DescriptionBody) &&
      isNonEmpty(MissionBody) &&
      isNonEmpty(BudgetBody) &&
      isNonEmpty(ImplementBody)
    );
  }, [Titledata, categoryType, DescriptionBody, MissionBody, BudgetBody, ImplementBody]);

  // compute missing fields for UX feedback
  const missingFields = React.useMemo(() => {
    const arr: string[] = [];
    if (!isNonEmpty(Titledata)) arr.push("Title");
    if (!isNonEmpty(categoryType)) arr.push("Category");
    if (!isNonEmpty(DescriptionBody)) arr.push("Description");
    if (!isNonEmpty(MissionBody)) arr.push("Mission");
    if (!isNonEmpty(BudgetBody)) arr.push("Budget");
    if (!isNonEmpty(ImplementBody)) arr.push("Implementation");
    return arr;
  }, [Titledata, categoryType, DescriptionBody, MissionBody, BudgetBody, ImplementBody]);






////////////////////////////////////////////////////////////
///////////////////////////    On Chain PROPOSAL CREATION
////////////////////////////////////////////////////////////





  /* --- ON-CHAIN PROPOSAL CREATION + LOCAL VERIFICATION --- */
async function createOnChainProposalAndVerify(proposal_uuid: string) {
  if (!GOVERNOR_ADDRESS) {
    alert("Governance contract address not configured in frontend.");
    return null;
  }
  const signer = await getSignerFromWindow();
  if (!signer) {
    alert("Please connect your wallet (MetaMask) in the browser to create an on-chain proposal.");
    return null;
  }

  try {
    const descriptionObj = buildOnChainDescription(proposal_uuid);
    const descriptionJsonStr = JSON.stringify(descriptionObj);

    const govContract = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer);
    
    // Declare chainProposalId early so we can set it from simulation (callStatic)
    let chainProposalId: string | null = null;


    const signature = "ProposalCreated(uint256,address,address[],uint256[],bytes[],uint256,uint256,string)";
    const proposalCreatedTopic = keccak256(toUtf8Bytes(signature));
    console.log("Computed ProposalCreated topic:", proposalCreatedTopic);




    const targets = TOKEN_ADDRESS ? [TOKEN_ADDRESS] : [ZERO_ADDRESS];
    const values: number[] = [0];
    const calldatas = ["0x"];

    // Predict chain proposal id with callStatic.propose (reliable, works behind proxies).
    // Also predict start/end blocks using votingDelay() and votingPeriod() as a fallback
    // in case the ProposalCreated event is not parsed from logs.
    let predictedStartBlock: number | null = null;
    let predictedEndBlock: number | null = null;

 try {
   // callStatic may not exist depending on ethers/provider shape (v5 vs v6 or how the contract was instantiated).
   // Guard its use: if callStatic.propose exists, simulate; otherwise skip simulation and rely on log parsing.
   const callStaticAny = (govContract as any).callStatic;
   if (callStaticAny && typeof callStaticAny.propose === "function") {
     const simulatedId: any = await callStaticAny.propose(targets, values, calldatas, descriptionJsonStr);
     if (simulatedId !== undefined && simulatedId !== null) {
       chainProposalId = simulatedId?.toString?.() ?? String(simulatedId);
       console.log("Simulated proposal id via callStatic.propose():", chainProposalId);
       setLastChainProposalId(chainProposalId); // UX hint only
     }
   } else {
     console.debug("callStatic.propose not available on this provider/ethers version; skipping simulation.");
   }
 } catch (e) {
   console.warn("callStatic.propose simulation failed (continuing, will parse logs):", (e as any)?.message ?? e);
 }




    // Try to predict start/end block using votingDelay and votingPeriod (best-effort).
    try {
      const providerForCalls = (signer as any).provider ?? (govContract as any).runner?.provider;
      if (providerForCalls && typeof providerForCalls.getBlockNumber === "function") {
        const currentBlock = await providerForCalls.getBlockNumber();
        try {
          const vDelay: any = await govContract.votingDelay();
          const vPeriod: any = await govContract.votingPeriod();
          const delayNum = Number(vDelay?.toString?.() ?? vDelay ?? 0);
          const periodNum = Number(vPeriod?.toString?.() ?? vPeriod ?? 0);
          predictedStartBlock = Number(currentBlock) + delayNum;
          predictedEndBlock = predictedStartBlock + periodNum;
          console.log("Predicted start/end blocks:", predictedStartBlock, predictedEndBlock, "(currentBlock:", currentBlock, ")");
        } catch (inner) {
          console.warn("Could not read votingDelay/votingPeriod from governor:", inner);
        }
      }
    } catch (e) {
      console.warn("Predicting start/end blocks failed:", e);
    }

    setFlowStatus("PENDING_TX");
    setIsSubmitting(true);

     const tx = await (govContract as any).propose(targets, values, calldatas, descriptionJsonStr);
     console.log("Propose tx sent:", tx.hash);
     setLastTxHash(tx.hash);






    const receipt = await tx.wait();
    console.log("Receipt:", receipt);


    console.log("Receipt:", receipt);

    // compact safe-log summarizer
    const summarizeLog = (log: any) => ({
      address: log?.address,
      topics: Array.isArray(log?.topics) ? log.topics.map((t: any) => String(t)) : [],
      data: typeof log?.data === "string" ? log.data : String(log?.data),
    });

    try {
      console.log("=== receipt.logs summary ===");
      console.log((receipt.logs || []).map((l: any) => summarizeLog(l)));
    } catch (e) {
      console.warn("Could not stringify receipt.logs:", e);
    }

    // 1) Try govContract.interface.parseLog for each log (your existing attempt)
    let parsedEvent: any = null;
    let parsedDescriptionString: string | null = null;
    let parsedDescriptionJson: any = null;
    let parsedEventPayload: any = null;

    for (const log of receipt.logs || []) {
      try {
        const decoded = govContract.interface.parseLog(log);
        console.log("parseLog SUCCESS for log:", summarizeLog(log), "decoded.name:", decoded?.name);
        if (decoded && decoded.name === "ProposalCreated") {
          parsedEvent = decoded;
          const args = decoded.args;
          parsedDescriptionString =
            args?.description ??
            args?.[args.length - 1] ??
            args?.[args.length - 2] ??
            null;
          const idArg = args?.id ?? args?.[0] ?? null;
          chainProposalId = idArg ? idArg.toString() : null;
          parsedEventPayload = { name: decoded.name, args: decoded.args };
          break;
        }
      } catch (e) {
        // ignore non-matching logs
      }
    }

    // 2) FALLBACK: decode the transaction input (the description is the 4th arg of propose)
    // this is the quickest reliable fallback — it recovers exactly what the signer sent.
    if (!parsedDescriptionString) {
      try {
        // tx.data should exist on the ContractTransaction returned by ethers Contract method
        const txData = (tx as any).data ?? (tx as any).raw?.data ?? (tx as any).data;
        if (txData) {
          const parsedTx = govContract.interface.parseTransaction({ data: txData, value: (tx as any).value ?? 0 });
          console.log("parseTransaction succeeded. fn:", parsedTx?.name, "args:", parsedTx?.args);
          // propose(targets, values, calldatas, description) -> description is index 3
          const descriptionFromInput = parsedTx?.args?.[3] ?? parsedTx?.args?.description ?? null;
          if (descriptionFromInput) {
            parsedDescriptionString = descriptionFromInput;
            try {
              parsedDescriptionJson = typeof parsedDescriptionString === "string"
                ? JSON.parse(parsedDescriptionString)
                : parsedDescriptionString;
              console.log("Recovered description JSON from tx input:", parsedDescriptionJson);
            } catch (e) {
              console.log("Recovered description string (not JSON):", parsedDescriptionString);
            }
          }
        } else {
          console.warn("No tx.data found to parseTransaction fallback.");
        }
      } catch (txParseErr) {
        console.warn("parseTransaction fallback failed:", txParseErr);
      }
    }

    // 3) If parseLog failed above, show which topics were emitted and check the ERC1967 implementation slot
    if (!parsedEvent) {
      console.log("No parsed ProposalCreated found by parseLog. Listing logs and first topics:");
      for (const log of receipt.logs || []) {
        try {
          const firstTopic = (log.topics && log.topics[0]) ? String(log.topics[0]) : null;
          console.log("Log address:", log.address, "firstTopic:", firstTopic);
        } catch (e) {
          console.warn("Error reading log topics:", e);
        }
      }

    // Read ERC1967 implementation slot to discover the real implementation address:
    try {
      const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      
      // ethers v6: provider lives under .runner
      const runner = govContract.runner as any;
      const providerAny = runner?.provider ?? runner;

      if (providerAny && providerAny.getStorageAt) {
        const implRaw = await providerAny.getStorageAt(GOVERNOR_ADDRESS, implSlot);
        const implAddr = "0x" + implRaw.slice(-40);
        console.log("ERC1967 implementation address (from proxy storage):", implAddr);
      } else {
        console.warn("Provider.getStorageAt not available to read implementation slot.");
      }
    } catch (e) {
      console.warn("Failed to read proxy implementation slot:", e);
    }
    }















//////////////////////////////////////////////////////////////////////
////////// Extract proposer_wallet with fallbacks and normalize
//////////////////////////////////////////////////////////////////////


      let proposer_wallet: string | null = null;
      let proposer_source: "event" | "tx" | "provider" | null = null;

      // Provider helper (try to pick a provider object we can call)
      const runnerAny = (govContract as any).runner as any;
      const providerFromSigner = (signer as any).provider as any;
      const providerAny = providerFromSigner ?? runnerAny?.provider ?? new BrowserProvider((window as any).ethereum);

      // 1) Prefer the event argument if we decoded it
      if (parsedEvent) {
        try {
          // many ABIs place proposer as the 2nd arg, but we'll check by name first
          const evArgs: any = parsedEvent.args ?? {};
          const maybeProposer = evArgs?.proposer ?? evArgs?.[1] ?? null;
          if (maybeProposer) {
            try {
              proposer_wallet = getAddress(String(maybeProposer));
              proposer_source = "event";
            } catch (normErr) {
              // if getAddress fails, just keep raw string
              proposer_wallet = String(maybeProposer);
              proposer_source = "event";
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // 2) fall back to tx.from or receipt.from
      if (!proposer_wallet) {
        try {
          const txFrom = (tx as any).from ?? receipt?.from ?? null;
          if (txFrom) {
            try {
              proposer_wallet = getAddress(String(txFrom));
              proposer_source = "tx";
            } catch (normErr) {
              proposer_wallet = String(txFrom);
              proposer_source = "tx";
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // 3) provider lookup fallback (authoritative)
      if (!proposer_wallet) {
        try {
          if (providerAny && typeof providerAny.getTransaction === "function") {
            const fetchedTx = await providerAny.getTransaction(tx.hash);
            const fetchedFrom = fetchedTx?.from ?? null;
            if (fetchedFrom) {
              try {
                proposer_wallet = getAddress(String(fetchedFrom));
                proposer_source = "provider";
              } catch (normErr) {
                proposer_wallet = String(fetchedFrom);
                proposer_source = "provider";
              }
            }
          }
        } catch (e) {
          console.warn("Provider.getTransaction fallback failed:", e);
        }
      }

      // chain id (best-effort)
      let chainId: number | null = null;
      try {
        if (providerAny && typeof providerAny.getNetwork === "function") {
          const net = await providerAny.getNetwork();
          chainId = Number(net?.chainId ?? null);
        } else if ((signer as any).provider && typeof (signer as any).provider.getNetwork === "function") {
          const net = await (signer as any).provider.getNetwork();
          chainId = Number(net?.chainId ?? null);
        }
      } catch (e) {
        console.warn("Failed to read chainId from provider:", e);
      }




























    // If we recovered descriptionJson, you can extract proposal_uuid now:
    if (parsedDescriptionJson) {
      const onChainUuid = parsedDescriptionJson?.proposal_uuid ?? null;
      console.log("Recovered onChainUuid from descriptionJson:", onChainUuid);
    } else if (parsedDescriptionString) {
      console.log("Recovered description string but not JSON:", parsedDescriptionString);
    } else {
      console.log("No description recovered from logs or tx input fallback.");
    }

    // === end of patch ===





    if (receipt.status === 0) {
      setFlowStatus("FAILED_TX");
      setIsSubmitting(false);
      alert("Transaction failed on-chain (status 0).");
      return { txHash: tx.hash, receipt, success: false, reason: "RECEIPT_STATUS_0" };
    }

    setFlowStatus("AWAITING_CONFIRMATIONS");

















    const onChainUuid = parsedDescriptionJson?.proposal_uuid ?? null;
    if (!onChainUuid || onChainUuid !== proposal_uuid) {
      setFlowStatus("MISMATCH");
      setLastChainProposalId(chainProposalId);
      setIsSubmitting(false);
      alert("On-chain description missing or proposal_uuid mismatch.");
      return {
        txHash: tx.hash,
        receipt,
        success: false,
        reason: "UUID_MISMATCH",
        chainProposalId,
        parsedDescriptionString,
        parsedDescriptionJson,
        parsedEventPayload,
        proposer_wallet,
        proposer_source,
        chainId,
      };
    }


    setFlowStatus("AWAITING_CONFIRMATIONS");
    setLastChainProposalId(chainProposalId);

    return {
      txHash: tx.hash,
      receipt,
      success: true,
      chainProposalId,
      parsedDescriptionString,
      parsedDescriptionJson,
      parsedEventPayload,
      proposer_wallet,
      proposer_source,
      chainId,
    };



  } catch (err: any) {
    console.error("Error creating on-chain proposal:", err);
    setFlowStatus("FAILED_TX");
    setIsSubmitting(false);
    if (err?.code === 4001) alert("Signature rejected by user.");
    else alert("On-chain proposal failed: " + (err?.message ?? String(err)));
    return { success: false, reason: "EXCEPTION", error: err };
  }
}










  /* Integrated create handler: build UUID, create on-chain proposal, then POST verification payload to backend */
  const handleCreateClick = async () => {
 
 
    // Strict pre-sign validation
    if (!isFormValid) {
      // show helpful list of missing fields
      alert("Please fill the required fields before creating the proposal:\n" + missingFields.join(", "));
      return;
    }

    // Ensure wallet connected before attempting sign
    if (!isConnected) {
      alert("Please connect your wallet before creating the proposal.");
      return;
    }

    // Generate UUID early
    const proposal_uuid = typeof (globalThis as any).crypto?.randomUUID === "function"
      ? (globalThis as any).crypto.randomUUID()
      : fallbackUUIDv4();
    console.log("Generated proposal_uuid:", proposal_uuid);

    // create on-chain and verify locally
    setFlowStatus("PENDING_TX");
    setIsSubmitting(true);

    const onChainResult = await createOnChainProposalAndVerify(proposal_uuid);

    // If onChainResult === null -> signer missing or early abort
if (!onChainResult || !onChainResult.success) {
  // either signer missing or on-chain verification failed — leave for manual review
  setIsSubmitting(false);
  setFlowStatus(onChainResult && onChainResult.reason === "UUID_MISMATCH" ? "MISMATCH" : "MANUAL_REVIEW");
  console.warn("On-chain creation didn't complete successfully:", onChainResult);
  setModalPayload({ ok: false, status: onChainResult?.reason ?? 'ONCHAIN_FAILED', message: 'On-chain proposal failed or needs review' });
  setModalOpen(true);
  return;
  }

    // Build payload to send to backend always (include status, raw receipt, event payload)
    const {
      txHash,
      receipt,
      success,
      chainProposalId,
      parsedDescriptionString,
      parsedDescriptionJson,
      parsedEventPayload,
      reason,
      proposer_wallet,
      proposer_source,
      chainId,
    } = onChainResult as any;



    const providerChainString = await (async () => {
      try {
        const signer = await getSignerFromWindow();
        if (signer?.provider && typeof signer.provider.getNetwork === "function") {
          const net = await signer.provider.getNetwork();
          return `${net?.name ?? "unknown"} (${net?.chainId ?? "?"})`;
        }
      } catch { /* ignore */ }
      return "unknown";
    })();




    const payload = {
      proposal_uuid,
      tx_hash: txHash ?? receipt?.transactionHash ?? null,
      chain_proposal_id: chainProposalId ?? null,
      proposer_wallet: proposer_wallet ?? parsedEventPayload?.args?.proposer ?? null,
      proposer_source: proposer_source ?? null,
      description_raw: parsedDescriptionString ?? JSON.stringify(buildOnChainDescription(proposal_uuid)),
      description_json: parsedDescriptionJson ?? null,
      title: Titledata,
      description: DescriptionBody,
      mission: MissionBody,
      budget: BudgetBody,
      implement: ImplementBody,
      governor_address: GOVERNOR_ADDRESS,
      chain: providerChainString,
      chain_id: chainId ?? null,
      voting_start_block: parsedEventPayload?.args?.startBlock ? Number(parsedEventPayload.args.startBlock.toString()) : null,
      voting_end_block: parsedEventPayload?.args?.endBlock ? Number(parsedEventPayload.args.endBlock.toString()) : null,
      block_number: receipt?.blockNumber ?? null,
      created_at: currentDate.toISOString(),
      raw_receipt: receipt ?? null,
      event_payload: parsedEventPayload ?? null,
      status: success ? "AWAITING_CONFIRMATIONS" : (reason === "UUID_MISMATCH" ? "MISMATCH" : "FAILED_TX"),
      category: categoryType,
    };

    try {
      const variables = {
        proposal_uuid: payload.proposal_uuid,
        tx_hash: payload.tx_hash,
        chain_proposal_id: payload.chain_proposal_id,
        proposer_wallet: payload.proposer_wallet ?? null,
        proposer_source: payload.proposer_source ?? null,
        description_raw: payload.description_raw ?? null,
        description_json: payload.description_json ? JSON.stringify(payload.description_json) : null,
        title: payload.title ?? null,
        description: payload.description ?? null,
        mission: payload.mission ?? null,
        budget: payload.budget ?? null,
        implement: payload.implement ?? null,
        governor_address: payload.governor_address ?? null,
        chain: payload.chain ?? null,
        chain_id: payload.chain_id ?? null,
        voting_start_block: payload.voting_start_block ?? null,
        voting_end_block: payload.voting_end_block ?? null,
        block_number: payload.block_number ?? null,
        created_at: payload.created_at ?? null,
        raw_receipt: payload.raw_receipt ? JSON.stringify(payload.raw_receipt) : null,
        event_payload: payload.event_payload ? JSON.stringify(payload.event_payload) : null,
        status: payload.status ?? null,
        category: payload.category ?? null,
      };
      console.log("Variables to send to Backend", variables);


      const resp = await createProposal({ variables });
     console.log('GraphQL mutation response:', resp);
     const result = resp?.data?.createProposal ?? null;

      if (result && result.ok) {
        // Success path: backend persisted / accepted the proposal
        setFlowStatus(result.status === 'CONFIRMED' ? 'CONFIRMED' : 'AWAITING_CONFIRMATIONS');
        setModalPayload({ ok: true, status: result.status ?? null, id: result.id ?? null, message: result.message ?? null });
      } else if (result) {
        // Backend returned an object but ok === false (staged, mismatch, rejected, etc)
        setFlowStatus(result.status === 'AWAITING_CONFIRMATIONS' ? 'AWAITING_CONFIRMATIONS' : 'MANUAL_REVIEW');
        setModalPayload({
          ok: result.ok ?? false,
          status: result.status ?? null,
          id: result.id ?? null,
          message: result.message ?? 'Staged or requires manual review',
        });
      } else {
        // Unexpected / older backend shape (maybe returned boolean or nothing)
        setModalPayload({ ok: false, status: 'UNKNOWN', id: null, message: 'Unexpected response from server' });
        setFlowStatus('MANUAL_REVIEW');
      }
    } catch (err: any) {
      setModalPayload({ ok: false, status: 'ERROR', id: null, message: err?.message ?? String(err) });
      setFlowStatus('MANUAL_REVIEW');
       console.error("Failed to call GraphQL verification payload to backend:", err);
      alert("Failed to send verification to backend. Record may still exist on-chain");
    } finally {
      // show the modal to the user with the result and re-enable UI
      setModalOpen(true);
      setIsSubmitting(false);
      // Optionally clear form
      setTitledata(''); setDescriptionBody(''); setMissionBody(''); setBudgetBody(''); setImplementBody(''); setCategoryType('');
    }


  }



  ////////////////////////////////////////////////////
  //////////////////////////////////////////////////////



  // small helper to render status text
  function statusText() {
    switch (flowStatus) {
      case "IDLE": return "Idle";
      case "PENDING_TX": return "Waiting for wallet signature / broadcasting transaction...";
      case "AWAITING_CONFIRMATIONS": return "Transaction mined — verifying on-chain data...";
      case "CONFIRMED": return "Proposal confirmed and saved.";
      case "FAILED_TX": return "Transaction failed on chain.";
      case "MISMATCH": return "On-chain data mismatch — manual review required.";
      case "MANUAL_REVIEW": return "Saved for manual review.";
      default: return "";
    }
  }




  return (
    <div className="CreateProposalsChatChannels2Longcolumn">
      <div className="CreateProposalsChannelCardrow">



        <div className="CreateProposalsChannelCardNameandDescriptionColumn">
          <input
            className="MakeProposalTitleField"
            type="text"
            placeholder="Title/Short Description (200 chars)"
            value={Titledata}
            onChange={handleTitleInput}
            maxLength={200}
          />

          <span className="CreateProposalsChatChannelsShortBody">
            {currentDate.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="CreateProposalsChannelCard2rowLong">
        <div className="CreateProposalsChannelCard2NameandDescriptionColumnLong">
          
          <div className="CreateProposalsCategoryButtonsrow">
            <button
              className={`CreateProposalsCategorybuttons ${
                categoryType === "governance"
                  ? "CreateProposalsCategorybuttonsSelected"
                  : ""
              }`}
              onClick={() => handleCategoryButton("governance")}
            >
              <span>Governance</span>
            </button>

            <button
              className={`CreateProposalsCategorybuttons ${
                categoryType === "projects"
                  ? "CreateProposalsCategorybuttonsSelected"
                  : ""
              }`}
              onClick={() => handleCategoryButton("projects")}
            >
              <span>Projects</span>
            </button>
          </div>



          <div ref={descriptionContainerRef} className="CreateProposalsTextarea">
            <br />
            <span>Description</span>
            <textarea
              className="MakeProposalBodyField"
              placeholder="Please enter a Description"
              value={DescriptionBody}
              // remove the old handler and use the new inline handler
              onChange={(e) => {
                // simple clamp in case some edge got through
                const ta = e.currentTarget;
                setTextareaValueAndAutosize(setDescriptionBody, ta, e.target.value);
              }}
              onKeyDown={handleTextareaKeyDown}
              onPaste={(e) => handleTextareaPaste(e, setDescriptionBody)}
              maxLength={TEXTAREA_MAX} // defensive: still useful for some browsers
              aria-describedby="description-counter"
            />
            <div id="description-counter" className="CreateProposalsCharCounter" aria-live="polite">
              {DescriptionBody.length} / {TEXTAREA_MAX}
            </div>
          </div>







          <div ref={missionContainerRef} className="CreateProposalsTextarea">
            <br />
            <span>Mission</span>
            <textarea
              className="MakeProposalBodyField"
              placeholder="Please enter your Mission"
              value={MissionBody}
              // remove the old handler and use the new inline handler
              onChange={(e) => {
                // simple clamp in case some edge got through
                const ta = e.currentTarget;
                setTextareaValueAndAutosize(setMissionBody, ta, e.target.value);
              }}
              onKeyDown={handleTextareaKeyDown}
              onPaste={(e) => handleTextareaPaste(e, setMissionBody)}
              maxLength={TEXTAREA_MAX} // defensive: still useful for some browsers
              aria-describedby="mission-counter"
            />
            <div id="mission-counter" className="CreateProposalsCharCounter" aria-live="polite">
              {MissionBody.length} / {TEXTAREA_MAX}
            </div>
          </div>








          <div ref={budgetContainerRef} className="CreateProposalsTextarea">
            <br />
            <span>Budget</span>
            <textarea
              className="MakeProposalBodyField"
              placeholder="Please enter Budget details"
              value={BudgetBody}
              // remove the old handler and use the new inline handler
              onChange={(e) => {
                // simple clamp in case some edge got through
                const ta = e.currentTarget;
                setTextareaValueAndAutosize(setBudgetBody, ta, e.target.value);
              }}
              onKeyDown={handleTextareaKeyDown}
              onPaste={(e) => handleTextareaPaste(e, setBudgetBody)}
              maxLength={TEXTAREA_MAX} // defensive: still useful for some browsers
              aria-describedby="budget-counter"
            />
            <div id="budget-counter" className="CreateProposalsCharCounter" aria-live="polite">
              {BudgetBody.length} / {TEXTAREA_MAX}
            </div>
          </div>






          <div ref={implementContainerRef} className="CreateProposalsTextarea">
            <br />
            <span>Implementation</span>
            <textarea
              className="MakeProposalBodyField"
              placeholder="Please explain how to Implement"
              value={ImplementBody}
              // remove the old handler and use the new inline handler
              onChange={(e) => {
                // simple clamp in case some edge got through
                const ta = e.currentTarget;
                setTextareaValueAndAutosize(setImplementBody, ta, e.target.value);
              }}
              onKeyDown={handleTextareaKeyDown}
              onPaste={(e) => handleTextareaPaste(e, setImplementBody)}
              maxLength={TEXTAREA_MAX} // defensive: still useful for some browsers
              aria-describedby="implement-counter"
            />
            <div id="implement-counter" className="CreateProposalsCharCounter" aria-live="polite">
              {ImplementBody.length} / {TEXTAREA_MAX}
            </div>
          </div>






        </div>
      </div>



      <div style={{ marginTop: 12, color: "white", fontSize: 13 }}>
        <div>Status: {statusText()}</div>
        {lastTxHash && (
          <div>
            Tx: <a href={`https://explorer.base-sepolia.example/tx/${lastTxHash}`} target="_blank" rel="noreferrer">{lastTxHash}</a>
          </div>
        )}
        {lastChainProposalId && <div>On-chain proposal id: {lastChainProposalId}</div>}
      </div>



      {/* Required-fields hint */}
      {!isFormValid && (
        <div style={{ marginTop: 12, color: "#ffb3b3", fontSize: 13 }}>
          <strong>Required:</strong> please fill {missingFields.join(", ")} to enable Create.
        </div>
      )}

      <ResultModal open={modalOpen} onClose={()=>setModalOpen(false)} payload={modalPayload} />



      <div className="CreateProposalsChannelCard2VotingButtonsrow" style={{ marginTop: 12 }}>
        <button
          className="MakeProposalButtonbutton"
          onClick={handleCreateClick}
          disabled={!isFormValid || isSubmitting}
          title={!isFormValid ? `Fill required fields: ${missingFields.join(", ")}` : undefined}
        >
          <span>{isSubmitting ? "Processing..." : "Create"}</span>
        </button>
      </div>
    </div>
  );
}



