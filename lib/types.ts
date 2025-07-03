// lib/types.ts

// THE FIX: We only import the types that are actually used in this file.
// We have removed 'User' and 'Vote' from this import statement.
import { Poll, Option } from "@prisma/client";

// This is the type for a single poll object after we've included
// its related author, options, and vote counts.
export type PollWithDetails = Poll & {
  author: {
    name: string | null;
  };
  options: (Option & {
    _count: {
      votes: number;
    };
  })[];
};

// This is the final type we will pass to the PollCard component.
// It includes everything from PollWithDetails plus the user's vote status.
export type PollWithUserVote = PollWithDetails & {
  userVote: string | null;
};
