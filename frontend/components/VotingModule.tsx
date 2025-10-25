// components/VotingModule.tsx
"use client";

import "./VotingModule.css";
import React, { useState, useEffect } from "react";
import axios from "axios";

/* Redux */
import { RootState } from "../store/types";
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
} from "../store/ProposalsSlice";

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
  dateCreated: Date | string;
  avatar: string;
  avatarUrl?: string;
  category: string[];
}

export default function VotingModule(): JSX.Element {
  const dispatch = useDispatch();
  const shortProposalSelected = useSelector(
    (state: RootState) => state.proposals.shortProposalSelected
  );

  // This component displays a single proposal, so use Post | null
  const [post, setPost] = useState<Post | null>(null);

  // Fetch the single proposal on mount / when selection changes
  useEffect(() => {
    const getById = async () => {
      if (!shortProposalSelected) {
        setPost(null);
        return;
      }

      try {
        const response = await axios.get<Post>(
          `http://localhost:5000/proposals/${shortProposalSelected}`
        );
        // axios infers response.data as 'any' unless typed, we used <Post> above
        setPost(response.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error("Axios error fetching proposal:", err.message, err.response?.data);
        } else if (err instanceof Error) {
          console.error("Error fetching proposal:", err.message);
        } else {
          console.error("Unknown error fetching proposal:", String(err));
        }
      }
    };

    getById();
  }, [shortProposalSelected]);

  // Vote up: update server and then update local state safely
  const handleVoteUp = async (postId: number) => {
    try {
      const response = await axios.put<{ voteUp: number }>(
        `http://localhost:5000/proposals/voteup/${postId}`
      );

      const updatedVotes = response.data.voteUp;

      setPost((prev) => {
        if (!prev) return prev;
        // return a new object with updated votesUp
        return { ...prev, votesUp: updatedVotes };
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Axios error voting up:", err.message, err.response?.data);
      } else if (err instanceof Error) {
        console.error("Error voting up:", err.message);
      } else {
        console.error("Unknown error voting up:", String(err));
      }
    }
  };

  const handleVoteDown = async (postId: number) => {
    try {
      const response = await axios.put<{ voteDown?: number }>(
        `http://localhost:5000/proposals/votedown/${postId}`
      );

      // If server returns new count, use it; otherwise increment locally
      setPost((prev) => {
        if (!prev) return prev;
        const newDown = response.data.voteDown ?? prev.votesDown + 1;
        return { ...prev, votesDown: newDown };
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Axios error voting down:", err.message, err.response?.data);
      } else if (err instanceof Error) {
        console.error("Error voting down:", err.message);
      } else {
        console.error("Unknown error voting down:", String(err));
      }
    }
  };

  const handleShareMore = async (postId: number) => {
    try {
      const response = await axios.put<{ shareMore?: number }>(
        `http://localhost:5000/proposals/sharemore/${postId}`
      );

      setPost((prev) => {
        if (!prev) return prev;
        const newShare = response.data.shareMore ?? prev.shareMore + 1;
        return { ...prev, shareMore: newShare };
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Axios error share more:", err.message, err.response?.data);
      } else if (err instanceof Error) {
        console.error("Error share more:", err.message);
      } else {
        console.error("Unknown error share more:", String(err));
      }
    }
  };

  // Render: guard for null post with fallback UI
  if (!post) {
    return (
      <div className="VotingModuleChannelCard2VotingButtonsrow">
        <div>Loading votes...</div>
      </div>
    );
  }

  return (
    <div className="VotingModuleChannelCard2VotingButtonsrow">
      <button
        className="VotingModuleChannelCard2VotingButtonsbutton"
        onClick={() => handleVoteUp(post.id)}
      >
        <img src="/VoteUp.png" alt="Vote Up" />
        <span>{post.votesUp}</span>
      </button>

      <button
        className="VotingModuleChannelCard2VotingButtonsbutton"
        onClick={() => handleShareMore(post.id)}
      >
        <img src="/ShareMoreinCircle.png" alt="Share More" />
        <span>{post.shareMore}</span>
      </button>

      <button
        className="VotingModuleChannelCard2VotingButtonsbutton"
        onClick={() => handleVoteDown(post.id)}
      >
        <img src="/VoteDown.png" alt="Vote Down" />
        <span>{post.votesDown}</span>
      </button>
    </div>
  );
}