// components/proposals/LongCreateProposals.tsx
"use client";

import "./LongCreateProposals.css";
import LongCreateProposalsCategoryButtons from "./LongCreateProposalsCategoryButtons";
import LongProposals from "./LongProposals";
import CreateProposals from "./CreateProposals";

import React, { useState, useEffect, useRef } from "react";

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
} from "../../store/ProposalsSlice";








export default function LongCreateProposals(): JSX.Element {
  /*  Ethereum L2 */
  const l2AllCat = useSelector((state: RootState) => state.proposals.l2AllCat);

  const l2VideoOn = useSelector((state: RootState) => state.proposals.l2VideoOn);
  const l2SelectedCategory = useSelector(
    (state: RootState) => state.proposals.l2SelectedCategory
  );

  /* Func Buttons */
  const l2ExtendRightPanel = useSelector(
    (state: RootState) => state.proposals.l2ExtendRightPanel
  );
  const l2ExtendLeftPanel = useSelector(
    (state: RootState) => state.proposals.l2ExtendLeftPanel
  );

  const l2SelectedSubFunc = useSelector(
    (state: RootState) => state.proposals.l2SelectedSubFunc
  );
  const newproposal = useSelector((state: RootState) => state.proposals.newproposal);

  const dispatch = useDispatch();

  if (l2AllCat) {
    dispatch(l2selectedcategory(l2AllCat));
  }

  /////////// Infinite Scrolling ////////////////
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(20);

  // middle container ref (the scrollable container)
  const middleContainerRef = useRef<HTMLDivElement | null>(null);

  // Option 1: use event handler signature for onScroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const containerHeight = container.clientHeight;
    const contentHeight = container.scrollHeight;

    if (scrollPosition + containerHeight >= contentHeight - 200) {
      setEnd((prevEnd) => prevEnd + 5);
    }
  };

  // If you ever need to call the handler manually with the DOM element, you can also use:
  // const handleScrollManual = (container: HTMLElement | null) => { ... };

  // Optional: effect to log end when changed (debug)
  useEffect(() => {
    // console.log("Infinite scroll end:", end);
  }, [end]);

  /////////// Infinite Scrolling ////////////////

  return (
    <div className="LongCreateProposalsMaincolumn">
      <div className="LongCreateProposalsTypes">
        <LongCreateProposalsCategoryButtons />
      </div>

      <div className="LongCreateProposalsMainrow">
        <div className="L2SidePanelandExtendButton">
          <div className="L2SidePanelSubFuncButtons">
            <div className="L2SubCategoryRightColumn">
              <button
                className={`L2FuncButtonSubCategory ${
                  l2SelectedSubFunc === "description"
                    ? "L2FuncButtonSubCategorySelected"
                    : ""
                }`}
                onClick={() => dispatch(l2selectedsubfunc("description"))}
              >
                <span>Description</span>
              </button>

              <button
                className={`L2FuncButtonSubCategory ${
                  l2SelectedSubFunc === "mission"
                    ? "L2FuncButtonSubCategorySelected"
                    : ""
                }`}
                onClick={() => dispatch(l2selectedsubfunc("mission"))}
              >
                <span>Mission</span>
              </button>

              <button
                className={`L2FuncButtonSubCategory ${
                  l2SelectedSubFunc === "budget" ||
                  l2SelectedSubFunc === "l2excstatsmarket"
                    ? "L2FuncButtonSubCategorySelected"
                    : ""
                }`}
                onClick={() => dispatch(l2selectedsubfunc("budget"))}
              >
                <span>Budget</span>
              </button>

              <button
                className={`L2FuncButtonSubCategory ${
                  l2SelectedSubFunc === "implement" ||
                  l2SelectedSubFunc === "l2excstatsmarket"
                    ? "L2FuncButtonSubCategorySelected"
                    : ""
                }`}
                onClick={() => dispatch(l2selectedsubfunc("implement"))}
              >
                <span>Implementation</span>
              </button>
            </div>
          </div>
        </div>

        <div
          className="L2MiddleContainer"
          ref={middleContainerRef}
          onScroll={handleScroll} // attach the typed handler
          style={{ overflowY: "auto", maxHeight: "80vh" }} // ensure it's scrollable; adjust as needed
        >
          {!newproposal && (
            <div>
              <LongProposals start={start} end={end} />
            </div>
          )}

          {newproposal && (
            <div>
              <CreateProposals />
            </div>
          )}
        </div>

        <div className="LongCreateProposalsVideoSidePanelMain"></div>
      </div>
    </div>
  );
}



