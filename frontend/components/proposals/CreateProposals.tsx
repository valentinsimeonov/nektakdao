// components/proposals/CreateProposals.tsx
"use client";

import "./CreateProposals.css";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

/* Redux */
import { RootState } from "../../store/types";
import { useSelector, useDispatch } from "react-redux";
import {
  l2extendleftpanel,
  l2selectedsubfunc,
  l2extendrightpanel,
  l2videoon,
  l2resetfunc,
  l2resetcategorybuttons,
  l2cat,
  l2selectedcategory,
  l2selectl1,
  dropdownbutton,
  shortproposalselected,
  createnewproposal,
} from "../../store/ProposalsSlice";


import{ MUTATION_CREATE_PROPOSAL } from '../../api/proposalsQuery';
import { useMutation } from "@apollo/client";





/* Wagmi / ethers */
import { useAccount } from "wagmi";
import { ethers } from "ethers";

/* Minimal ABIs used for on-chain proposal */
const GOVERNOR_ABI = [
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "event ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";








interface Post {
  id: number;
  title: string;
  description: string;
  mission: string;
  budget: string;
  implement: string;
  votesUp: number;
  votesDown: number;
  shareMore: number;
  dateCreated: Date;
  avatar: string;
  avatarUrl?: string;
  category: string[];
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
  const [post, setPost] = useState<Post | null>(null);

  const [categoryType, setCategoryType] = useState("");


  const [Titledata, setTitledata] = useState("");
  const [DescriptionBody, setDescriptionBody] = useState("");
  const [MissionBody, setMissionBody] = useState("");
  const [BudgetBody, setBudgetBody] = useState("");
  const [ImplementBody, setImplementBody] = useState("");

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








/* Wagmi account */
  const { address, isConnected } = useAccount();

  // Read governor address from client env var - set NEXT_PUBLIC_GOVERNOR_ADDRESS in .env
  const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "";
  const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "";







	  const [createProposal, { loading, error }] = useMutation(MUTATION_CREATE_PROPOSAL, {
		onCompleted: (data) => {
		  if (data.createProposal) {  // Check if the response is true

      setTitledata("");
      setDescriptionBody("");
      setMissionBody("");
      setBudgetBody("");
      setImplementBody("");
      setImageUrl(null);
      setAvatarFile(null);

			console.log('Proposal sent successfully.');
      
		  } else {
			console.error('Failed to send proposal.');
		  }
		},
		onError: (err) => {
		  console.error("Error sending proposal:", err);
		}
	  });









  const PostData = async (
    Titledata: string,
    DescriptionBody: string,
    MissionBody: string,
    BudgetBody: string,
    ImplementBody: string,
    currentDate: Date,
    avatarFile: File | null,
    categoryType: string
  ) => {
    try {
      const formData = new FormData();
      formData.append("title", Titledata);
      formData.append("description", DescriptionBody);
      formData.append("mission", MissionBody);
      formData.append("budget", BudgetBody);
      formData.append("implement", ImplementBody);
      formData.append("dateCreated", currentDate.toISOString());
      formData.append("category[]", categoryType);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      console.log(
        "F-Inside CreateProposal.tsx  -- PostData --, avatarFile variable holds:",
        avatarFile
      );

      const response = await axios.post(
        "http://localhost:5000/proposals/create",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("F - CreateProposal -- useEffect -- formData: ", formData);

      setPost(response.data);
      console.log("F-Inside CreateProposal.tsx, response variable:", response);
    } catch (err: any) {
      console.error("Error fetching posts:", err.message || err);
    }
  };

  useEffect(() => {
    console.log("F - CreateProposal -- useEffect -- posts: ", post);
  }, [post]);






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






  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setAvatarFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };




////////////////////////////////////////////////////////////
///////////////////////////    On Chain PROPOSAL CREATION
////////////////////////////////////////////////////////////



 /* Helper: attempt to obtain an ethers Signer from window.ethereum using v6 or v5 API */
  async function getSignerFromWindow(): Promise<any | null> {
    if (typeof window === "undefined") return null;
    const anyWindow = window as any;
    if (!anyWindow.ethereum) return null;
    try {
      // ethers v6: BrowserProvider
      if ((ethers as any).BrowserProvider) {
        const provider = new (ethers as any).BrowserProvider(anyWindow.ethereum);
        const signer = await provider.getSigner();
        return signer;
      }
      // ethers v5: providers.Web3Provider
      if ((ethers as any).providers && (ethers as any).providers.Web3Provider) {
        const provider = new (ethers as any).providers.Web3Provider(anyWindow.ethereum);
        return provider.getSigner();
      }
      // fallback: nil
      return null;
    } catch (e) {
      console.warn("Could not create signer from window.ethereum:", (e as any)?.message ?? e);
      return null;
    }
  }

  /* --- ON-CHAIN PROPOSAL CREATION --- */
  async function createOnChainProposal() {
    if (!GOVERNOR_ADDRESS) {
      console.error("GOVERNOR_ADDRESS not set (NEXT_PUBLIC_GOVERNOR_ADDRESS).");
      alert("Governance contract address not configured in frontend.");
      return;
    }

    // Try to obtain a signer: prefer provider-based signer if available via window
    const signer = await getSignerFromWindow();
    if (!signer) {
      alert("Please connect your wallet (MetaMask) in the browser to create an on-chain proposal.");
      return;
    }

    try {
      // Build a compact JSON description so the on-chain description contains all fields
      const descriptionJson = JSON.stringify({
        title: Titledata,
        description: DescriptionBody,
        mission: MissionBody,
        budget: BudgetBody,
        implement: ImplementBody,
        dateCreated: currentDate.toISOString(),
        category: categoryType,
      });

      // Minimal safety check: require a title or description
      if (!Titledata && !DescriptionBody) {
        alert("Please provide at least a Title or Description for the proposal.");
        return;
      }

      const govContract = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer);

      // For test proposals we send a single no-op call:
      const targets = TOKEN_ADDRESS ? [TOKEN_ADDRESS] : [ZERO_ADDRESS];
      const values: number[] = [0];
      const calldatas = ["0x"];
      console.log("Creating on-chain proposal with:", {
        targets,
        values,
        calldatas,
        descriptionJson,
      });

      // send transaction
      const tx = await govContract.propose(targets, values, calldatas, descriptionJson);
      console.log("Propose tx sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Propose tx mined:", receipt.transactionHash);

      // Parse ProposalCreated event to get proposal id
      let proposalId: string | null = null;
      try {
        for (const log of receipt.logs) {
          try {
            const parsed = govContract.interface.parseLog(log);
            if (parsed && parsed.name === "ProposalCreated") {
              proposalId = parsed.args[0].toString();
              console.log("Decoded ProposalCreated -> id:", proposalId);
              break;
            }
          } catch {
            // ignore non-matching logs
          }
        }
      } catch (e) {
        console.warn("Could not parse logs for ProposalCreated:", (e as any)?.message ?? e);
      }

      alert(
        `Proposal created on-chain!\nTx: ${receipt.transactionHash}\nProposalId: ${proposalId ?? "(not found in logs)"}`
      );
      return { txHash: receipt.transactionHash, proposalId };
    } catch (err: any) {
      console.error("Error creating on-chain proposal:", err);
      alert("On-chain proposal failed: " + (err?.message ?? String(err)));
      return null;
    }
  }







  /* Integrated create handler: submit to backend AND on-chain (if signer) */
  const handleCreateClick = async () => {

    	
		try {
		  await createProposal({
			variables: {

        title: Titledata,
        description: DescriptionBody,
        mission: MissionBody,
        budget: BudgetBody,
        implement: ImplementBody,
        created_at: currentDate,
        // avatarFile,
        category: categoryType
			}
		  });
		} catch (err) {
		  console.error("Error sending message:", err);
		}

    // await createProposal(
    //   Titledata,
    //   DescriptionBody,
    //   MissionBody,
    //   BudgetBody,
    //   ImplementBody,
    //   currentDate,
    //   avatarFile,
    //   categoryType
    // );

    // create on-chain proposal if user connected (attempt via window signer)
    if (isConnected) {
      await createOnChainProposal();
    } else {
      console.log("Wallet not connected; skipping on-chain creation.");
    }

    // optional: reset fields or notify redux
    setTitledata("");
    setDescriptionBody("");
    setMissionBody("");
    setBudgetBody("");
    setImplementBody("");
    setImageUrl(null);
    setAvatarFile(null);
  };




  ////////////////////////////////////////////////////
  //////////////////////////////////////////////////////






  return (
    <div className="CreateProposalsChatChannels2Longcolumn">
      <div className="CreateProposalsChannelCardrow">
        <input type="file" onChange={handleAvatarUpload} accept="image/*" />

        <div className="CreateProposalsChannelCardLogoColumn">
          {post && post.avatar && (
            <img
              src={`http://localhost:5000/proposals/image/${post.avatar}`}
              alt="Avatar"
            />
          )}

          {!post && imageUrl && <img src={imageUrl} alt="Avatar" />}

          {!avatarFile && <img src={"/aks/C12.png"} alt="" />}
        </div>

        <div className="CreateProposalsChannelCardNameandDescriptionColumn">
          <input
            className="MakeProposalTitleField"
            type="text"
            placeholder="Title"
            value={Titledata}
            onChange={handleTitleInput}
            maxLength={42}
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

          <div ref={descriptionContainerRef}>
            <br />
            <span>Description</span>
            <textarea
              className="MakeProposalBodyField"
              placeholder="Please enter a Description"
              value={DescriptionBody}
              onChange={handleDescriptionBody}
            />
          </div>

          <div ref={missionContainerRef}>
            <span>Mission</span>
            <textarea
              className="MakeProposalBodyField"
              placeholder="Please enter your Mission"
              value={MissionBody}
              onChange={handleMissionBody}
              maxLength={300}
            />
          </div>

          <div ref={budgetContainerRef}>
            <span>Budget</span>
            <textarea
              className="MakeProposalBodyField"
              placeholder="Please enter Budget details"
              value={BudgetBody}
              onChange={handleBudgetBody}
              maxLength={300}
            />
          </div>

          <div ref={implementContainerRef}>
            <span>Implementation</span>
            <textarea
              className="MakeProposalBodyField"
              placeholder="Please explain how to Implement"
              value={ImplementBody}
              onChange={handleImplementBody}
              maxLength={300}
            />
          </div>
        </div>
      </div>



      <div className="CreateProposalsChannelCard2VotingButtonsrow">
        <button className="MakeProposalButtonbutton" onClick={handleCreateClick}>
          <span>Create</span>
        </button>
      </div>


    </div>
  );
}




