// app/page.tsx

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import AuthButtons from './components/AuthButton';
import CreatePollForm from './components/CreatePollForm';
import PollCard from './components/PollCard';
import { Prisma } from '@prisma/client'; // 1. Import Prisma types

// We can define a more specific type for our poll data using Prisma's generated types.
// This makes our code much more readable and safe.
type PollWithDetails = Prisma.PollGetPayload<{
  include: {
    author: { select: { name: true } };
    options: {
      include: {
        _count: { select: { votes: true } };
      };
    };
  };
}>;

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();

  // The 'polls' variable will have the type 'PollWithDetails[]'
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

  const pollsWithUserVote = await Promise.all(
    // 2. THE FIX: Explicitly type the 'poll' parameter
    polls.map(async (poll: PollWithDetails) => {
      let userVote = null;
      if (session?.user?.id) {
        const vote = await prisma.vote.findFirst({
          where: {
            userId: session.user.id,
            option: {
              pollId: poll.id,
            },
          },
          select: { optionId: true },
        });
        userVote = vote?.optionId || null;
      }
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
      
      {session && <CreatePollForm />}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Community Polls</h2>
        {pollsWithUserVote.length > 0 ? (
          pollsWithUserVote.map(poll => (
            <PollCard key={poll.id} pollData={poll} />
          ))
        ) : (
          <p className="text-gray-500">No polls yet. Be the first to create one!</p>
        )}
      </div>
    </main>
  );
}