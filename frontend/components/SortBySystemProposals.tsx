// SortBySystemProposals.tsx
import { ProposalData } from "../store/types";

/** A column definition: the key in your data + the label to show */
export type Column<Key extends keyof ProposalData> = {
  key: Key;
  label: string;
};

/** Configure each “view” by which columns it shows */
export const VIEW_CONFIG = {


      /*        Proposals             */
  
      governance: {
        columns: [
          { key: "title", label: "Title" },
          { key: "votesUp", label: "Votes Up" },
          { key: "votesDown", label: "votes Down" },
          { key: "created_at", label: "Created" },



        ] as Column<"title" | "votesUp" | "votesDown" | "created_at" >[],
      },

      projects: {
        columns: [
          { key: "title", label: "Title" },
          { key: "votesUp", label: "Votes Up" },
          { key: "votesDown", label: "votes Down" },
          { key: "created_at", label: "Created" },



        ] as Column<"title" | "votesUp" | "votesDown" | "created_at" >[],
      },
  
      all: {
        columns: [
          { key: "title", label: "Title" },
          { key: "votesUp", label: "Votes Up" },
          { key: "votesDown", label: "votes Down" },
          { key: "created_at", label: "Created" },



        ] as Column<"title" | "votesUp" | "votesDown" | "created_at" >[],
      },
  


} as const;

export type ViewKey = keyof typeof VIEW_CONFIG;

export type ColumnConfig<V extends ViewKey> = typeof VIEW_CONFIG[V]["columns"][number];
