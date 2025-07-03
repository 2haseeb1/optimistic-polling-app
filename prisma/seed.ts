// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
// The 'bcrypt' import has been removed as it was not being used.

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  // --- Create Users ---
  const user1 = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      image: `https://i.pravatar.cc/150?u=alice`,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob@example.com",
      image: `https://i.pravatar.cc/150?u=bob`,
    },
  });

  console.log(`Created users: ${user1.name}, ${user2.name}`);

  // --- Create Polls ---
  // Poll 1 by Alice
  const poll1 = await prisma.poll.create({
    data: {
      question: "What is the best framework for full-stack development?",
      authorId: user1.id,
      options: {
        create: [
          { text: "Next.js" },
          { text: "SvelteKit" },
          { text: "Nuxt.js" },
          { text: "Remix" },
        ],
      },
    },
    include: {
      options: true,
    },
  });

  // Poll 2 by Alice
  await prisma.poll.create({
    data: {
      question: "Which state management library do you prefer with React?",
      authorId: user1.id,
      options: {
        create: [
          { text: "Zustand" },
          { text: "Redux Toolkit" },
          { text: "Jotai" },
        ],
      },
    },
  });

  // Poll 3 by Bob
  const poll3 = await prisma.poll.create({
    data: {
      question: "What is your favorite programming language?",
      authorId: user2.id,
      options: {
        create: [{ text: "TypeScript" }, { text: "Rust" }, { text: "Go" }],
      },
    },
    include: {
      options: true,
    },
  });

  console.log("Created polls.");

  // --- Create Votes ---
  // Alice votes for 'Next.js' in her own poll.
  await prisma.vote.create({
    data: {
      userId: user1.id,
      optionId: poll1.options[0].id,
    },
  });

  // Bob also votes for 'Next.js' in Alice's poll.
  await prisma.vote.create({
    data: {
      userId: user2.id,
      optionId: poll1.options[0].id,
    },
  });

  // Alice votes for 'TypeScript' in Bob's poll.
  await prisma.vote.create({
    data: {
      userId: user1.id,
      optionId: poll3.options[0].id,
    },
  });

  console.log("Created votes.");

  console.log("Seeding finished.");
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
