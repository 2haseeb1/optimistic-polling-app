// app/components/PollCard.tsx

'use client'; // This must be a Client Component because it uses 'useOptimistic'.

import { useOptimistic } from 'react';
import { submitVote } from '@/app/actions';
import { PollWithUserVote } from '@/lib/types'; // Assuming types are in lib/types.ts

// 1. UPDATE: Define the type for the component's props, now including 'isLoggedIn'.
type PollCardProps = {
  pollData: PollWithUserVote;
  isLoggedIn: boolean;
};

// 2. UPDATE: The component now accepts 'isLoggedIn' from its props.
export default function PollCard({ pollData, isLoggedIn }: PollCardProps) {
  const [optimisticPoll, setOptimisticPoll] = useOptimistic(
    pollData,
    (currentState, votedOptionId: string) => {
      const newOption = currentState.options.find(o => o.id === votedOptionId);
      if (newOption) {
        newOption._count.votes++;
      }
      return {
        ...currentState,
        userVote: votedOptionId,
      };
    }
  );

  const totalVotes = optimisticPoll.options.reduce((sum, opt) => sum + opt._count.votes, 0);

  const handleVote = async (optionId: string) => {
    setOptimisticPoll(optionId);
    try {
      await submitVote(optionId);
    } catch (error) {
      console.error("Voting failed:", error);
      // In a real app, you could add a toast notification here to inform the user
      // that their vote failed (e.g., if they lost internet connection).
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
            <form action={() => handleVote(option.id)} key={option.id}>
              <button
                type="submit"
                // 3. UPDATE: The disabled logic now checks for two conditions.
                // It's disabled if:
                //   a) The user has already voted in this poll (optimistically or for real).
                //   b) The user is not logged in.
                disabled={!!optimisticPoll.userVote || !isLoggedIn}
                className={`w-full p-3 border rounded-md text-left relative overflow-hidden transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
                    hasVotedForThis ? 'border-blue-600 border-2 font-bold' : 'border-gray-300'
                }`}
              >
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
      
      {/* 4. UPDATE: Add a conditional message for logged-out users. */}
      {!isLoggedIn && (
        <div className="text-center mt-4 bg-gray-100 p-3 rounded-md">
          <p className="text-sm text-gray-600">Please sign in to cast your vote.</p>
        </div>
      )}

      <p className="text-right text-sm text-gray-500 mt-2">Total Votes: {totalVotes}</p>
    </div>
  );
}