// app/page.tsx

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import AuthButtons from './components/AuthButton';
import CreatePollForm from './components/CreatePollForm';
import PollCard from './components/PollCard';
// 1. Import our custom, reliable types instead of using Prisma.PollGetPayload
import { PollWithDetails, PollWithUserVote } from '@/lib/types';

// This ensures the page is always dynamically rendered, fetching fresh data on every visit.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Get the current user's session on the server. This will be null if not logged in.
  const session = await auth();

  // Fetch all polls from the database. We explicitly type the result with our custom type.
  const polls: PollWithDetails[] = await prisma.poll.findMany({
    include: {
      author: {
        select: { name: true },
      },
      options: {
        include: {
          _count: {
            select: { votes: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // For each poll, determine if the current logged-in user has already voted.
  const pollsWithUserVote: PollWithUserVote[] = await Promise.all(
    // We explicitly type the 'poll' parameter here to ensure type safety.
    polls.map(async (poll: PollWithDetails) => {
      let userVote = null;
      if (session?.user?.id) {
        // This query is very efficient as it only looks for one record.
        const vote = await prisma.vote.findFirst({
          where: {
            userId: session.user.id,
            option: {
              pollId: poll.id,
            },
          },
          select: { optionId: true }, // Only select the data we need.
        });
        userVote = vote?.optionId || null;
      }
      // Return a new object that combines the original poll data with the user's vote status.
      return { ...poll, userVote };
    })
  );

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Optimistic Polls</h1>
        <div className="flex items-center gap-4">
          {session?.user && (
            <p className="text-gray-600 hidden sm:block">
              Signed in as <strong>{session.user.name}</strong>
            </p>
          )}
          <AuthButtons />
        </div>
      </header>
      
      {/* Conditionally render the poll creation form only if the user is logged in. */}
      {session && <CreatePollForm />}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Community Polls</h2>
        {pollsWithUserVote.length > 0 ? (
          pollsWithUserVote.map((poll) => (
            // UPDATE: Pass the new 'isLoggedIn' prop to the PollCard component.
            // The '!!session' syntax converts the session object (or null) to a true boolean.
            <PollCard 
              key={poll.id} 
              pollData={poll}
              isLoggedIn={!!session}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center mt-10">No polls yet. Sign in and be the first to create one!</p>
        )}
      </div>
    </main>
  );
}