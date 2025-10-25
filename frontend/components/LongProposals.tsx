// components/LongProposals.tsx
"use client";

import "./LongProposals.css";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import VotingModule from "./VotingModule";

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

interface LongProposalsProps {
  start: number;
  end: number;
}

export default function LongProposals({ start, end }: LongProposalsProps) {
  const l2DopdownButton = useSelector(
    (state: RootState) => state.proposals.l2DopdownButton
  );
  const dispatch = useDispatch();
  const l2SelectedSubFunc = useSelector(
    (state: RootState) => state.proposals.l2SelectedSubFunc
  );
  const shortProposalSelected = useSelector(
    (state: RootState) => state.proposals.shortProposalSelected
  );

  // posts is an array (we fetch a single post by id and store it in array form)
  const [post, setPost] = useState<Post[]>([]);

  useEffect(() => {
    const getById = async () => {
      console.log(
        "F - LongProposals - shortProposalSelected: ",
        shortProposalSelected
      );

      try {
        const response = await axios.get<Post>(
          `http://localhost:5000/proposals/${shortProposalSelected}`
        );
        console.log(
          "F - LongProposals - getById -- response data:",
          response.data
        );
        setPost([response.data]);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error fetching posts:", err.message);
        } else {
          console.error("Error fetching posts:", String(err));
        }
      }
    };
    getById();
  }, [shortProposalSelected]);

  useEffect(() => {
    console.log("F - LongProposals - posts: ", post);
  }, [post]);

  // ===== Voting handlers =====
  const handleVoteUp = async (postId: number) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/proposals/voteup/${postId}`
      );

      // ensure we update the array of posts
      setPost((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, votesUp: response.data.voteUp } : p
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error voting up:", err.message);
      } else {
        console.error("Error voting up:", String(err));
      }
    }
  };

  const handleVoteDown = async (postId: number) => {
    try {
      await axios.put(`http://localhost:5000/proposals/votedown/${postId}`);
      setPost((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, votesDown: p.votesDown + 1 } : p
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error voting down:", err.message);
      } else {
        console.error("Error voting down:", String(err));
      }
    }
  };

  const handleShareMore = async (postId: number) => {
    try {
      await axios.put(`http://localhost:5000/proposals/sharemore/${postId}`);
      setPost((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, shareMore: p.shareMore + 1 } : p
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error sharing more:", err.message);
      } else {
        console.error("Error sharing more:", String(err));
      }
    }
  };

  // ===== refs and safe scrolling =====
  const missionContainerRef = useRef<HTMLSpanElement | null>(null);
  const budgetContainerRef = useRef<HTMLSpanElement | null>(null);
  const implementContainerRef = useRef<HTMLSpanElement | null>(null);
  const descriptionContainerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // scroll only when l2SelectedSubFunc changes
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

  return (
    <div className="LongProposalsMain">
      <div className="LongProposalsPostsscroll">
        {Array.isArray(post) &&
          post.map((p) => (
            <div className="LongProposalsChatChannels" key={p.id}>
              <div className="LongProposalsChatChannels2Long">
                <button className="LongProposalsChannelCardrow">
                  <div className="LongProposalsChannelCardLogoColumn">
                    {p && (
                      <img
                        src={`http://localhost:5000/proposals/image/${p.avatar}`}
                        alt="Avatar"
                      />
                    )}
                  </div>

                  <div className="LongProposalsChannelCardNameandDescriptionColumn">
                    <span className="LongProposalsChatChannelsTitle">
                      {p.title}
                    </span>
                    <span className="LongProposalsChatChannelsShortBody">
                      {new Date(p.dateCreated).toLocaleString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                        hour12: true,
                      })}
                    </span>
                  </div>
                </button>

                <div className="LongProposalsChannelCard2rowLong">
                  <div className="LongProposalsChannelCard2NameandDescriptionColumnLong">
                    <div className="LongProposalsCategoryButtonsrow">
                      {p.category.map((category, index) => (
                        <div className="LongProposalsCategorybuttons" key={index}>
                          <span>{category}</span>
                        </div>
                      ))}
                    </div>

                    <span ref={descriptionContainerRef}>
                      <br />
                      Description
                      <br />
                      {p.description}
                      <br />
                    </span>
                    <br />

                    <span ref={missionContainerRef}>
                      Mission
                      <br />
                      {p.mission}
                      <br />
                    </span>
                    <br />

                    <span ref={budgetContainerRef}>
                      Budget
                      <br />
                      {p.budget}
                      <br />
                    </span>
                    <br />

                    <span ref={implementContainerRef}>
                      Implementation
                      <br />
                      {p.implement}
                    </span>
                    <br />
                  </div>
                </div>

                <div className="LongProposalsChannelCard2VotingButtonsrow">
                  <button
                    className="LongProposalsChannelCard2VotingButtonsbutton"
                    onClick={() => handleVoteUp(p.id)}
                  >
                    <img src="/voting/VoteUp.png" />
                    <span>{p.votesUp}</span>
                  </button>

                  <button
                    className="LongProposalsChannelCard2VotingButtonsbutton"
                    onClick={() => handleShareMore(p.id)}
                  >
                    <img src="/voting/ShareMoreinCircle.png" />
                    <span>{p.shareMore}</span>
                  </button>

                  <button
                    className="LongProposalsChannelCard2VotingButtonsbutton"
                    onClick={() => handleVoteDown(p.id)}
                  >
                    <img src="/voting/VoteDown.png" />
                    <span>{p.votesDown}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}