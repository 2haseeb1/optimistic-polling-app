// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

// Prisma Client চালু করা হচ্ছে
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- ইউজার তৈরি করা ---
  // upsert ব্যবহার করা একটি ভালো অভ্যাস, যা ডুপ্লিকেট ইউজার তৈরি হওয়া প্রতিরোধ করে।
  const user1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice",
      email: "alice@example.com",
      image: `https://i.pravatar.cc/150?u=alice`,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob",
      email: "bob@example.com",
      image: `https://i.pravatar.cc/150?u=bob`,
    },
  });

  console.log(`ইউজার তৈরি বা খুঁজে পাওয়া গেছে: ${user1.name}, ${user2.name}`);

  // --- পোল তৈরি করা ---
  // এখানে আমরা প্রতিবারই নতুন পোল তৈরি করছি।
  const poll1 = await prisma.poll.create({
    data: {
      question: "What is the best framework for full-stack development?",
      authorId: user1.id,
      options: {
        create: [{ text: "Next.js" }, { text: "SvelteKit" }],
      },
    },
    include: { options: true },
  });

  // ... (অন্যান্য পোল তৈরির কোড)

  console.log(`মোট ${await prisma.poll.count()} টি পোল তৈরি হয়েছে।`);

  // --- ভোট তৈরি করা ---
  await prisma.vote.create({
    data: {
      userId: user1.id,
      optionId: poll1.options[0].id, // অ্যালিস Next.js-এ ভোট দিচ্ছে
    },
  });

  console.log("প্রাথমিক ভোট তৈরি হয়েছে।");
  console.log("Seeding finished.");
}

// main ফাংশনটি চালানো হচ্ছে এবং যেকোনো এরর হ্যান্ডেল করা হচ্ছে
main()
  .catch(async (e) => {
    // সমাধান: এরর অবজেক্ট 'e' কনসোলে প্রিন্ট করা হচ্ছে
    console.error("Seeding করার সময় একটি এরর ঘটেছে:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
