// app/components/PollCard.tsx

'use client'; // This must be a Client Component because it uses 'useOptimistic'.

import { useOptimistic } from 'react';
import { submitVote } from '@/app/actions';

// Define the TypeScript type for the data this component expects to receive as a prop.
// This ensures type safety and autocompletion in your editor.
type PollWithOptionsAndVotes = {
  id: string;
  question: string;
  author: { name: string | null };
  options: {
    id: string;
    text: string;
    _count: { votes: number };
  }[];
  userVote: string | null; // The ID of the option the current user voted for, or null.
};

export default function PollCard({ pollData }: { pollData: PollWithOptionsAndVotes }) {
  // The useOptimistic hook takes the initial "real" state and an update function.
  const [optimisticPoll, setOptimisticPoll] = useOptimistic(
    pollData,
    // This function describes how to create the "optimistic" state.
    // It receives the current state and the new data (the ID of the option being voted for).
    (currentState, votedOptionId: string) => {
      // Find the option the user just clicked on.
      const newOption = currentState.options.find(o => o.id === votedOptionId);
      if (newOption) {
        // Increment its vote count immediately.
        newOption._count.votes++;
      }
      
      // Return a new state object reflecting this optimistic update.
      return {
        ...currentState,
        userVote: votedOptionId, // Mark that the user has now voted for this option.
      };
    }
  );

  const totalVotes = optimisticPoll.options.reduce((sum, opt) => sum + opt._count.votes, 0);

  // This function is called when a vote form is submitted.
  const handleVote = async (optionId: string) => {
    // 1. Instantly update the UI by calling the optimistic state updater.
    setOptimisticPoll(optionId);
    
    // 2. Then, call the actual Server Action to update the database.
    // If this action throws an error, React will automatically revert the optimistic update.
    try {
      await submitVote(optionId);
    } catch (error) {
      console.error("Voting failed:", error);
      // Here you could show a toast notification to the user.
    }
  };

  return (
    <div className="border p-4 md:p-6 rounded-lg shadow-md mb-4 bg-white">
      <p className="font-semibold text-gray-500 text-sm">Posted by {optimisticPoll.author.name}</p>
      <h3 className="text-xl font-bold my-2">{optimisticPoll.question}</h3>
      
      <div className="space-y-2 mt-4">
        {optimisticPoll.options.map(option => {
          const percentage = totalVotes === 0 ? 0 : (option._count.votes / totalVotes) * 100;
          const hasVotedForThis = optimisticPoll.userVote === option.id;

          return (
            // Each option is its own form for progressive enhancement.
            <form action={() => handleVote(option.id)} key={option.id}>
              <button
                type="submit"
                disabled={!!optimisticPoll.userVote} // Disable all buttons if user has voted.
                className={`w-full p-3 border rounded-md text-left relative overflow-hidden transition-all disabled:cursor-not-allowed ${
                    hasVotedForThis ? 'border-blue-600 border-2 font-bold' : 'border-gray-300'
                }`}
              >
                {/* The background div acts as the progress bar. */}
                <div
                  className="absolute top-0 left-0 h-full bg-blue-100 -z-10 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
                
                <div className="flex justify-between items-center relative z-10">
                  <span>{option.text}</span>
                  <span className="text-gray-700">{option._count.votes}</span>
                </div>
              </button>
            </form>
          );
        })}
      </div>
      <p className="text-right text-sm text-gray-500 mt-2">Total Votes: {totalVotes}</p>
    </div>
  );
}