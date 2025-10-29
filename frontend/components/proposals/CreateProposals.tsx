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

  //////       Handlers
  /////////////////////
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
        <button
          className="MakeProposalButtonbutton"
          onClick={() =>
            PostData(
              Titledata,
              DescriptionBody,
              MissionBody,
              BudgetBody,
              ImplementBody,
              currentDate,
              avatarFile,
              categoryType
            )
          }
        >
          <span>Create</span>
        </button>
      </div>
    </div>
  );
}




