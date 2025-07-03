// lib/prisma.ts

import { PrismaClient } from "@prisma/client";

// এই ফাংশনটি শুধু একটি নতুন PrismaClient instance তৈরি করে।
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// TypeScript-কে জানানোর জন্য যে আমরা global scope-এ 'prisma' নামে একটি ভ্যারিয়েবল রাখব।
// এটি না করলে TypeScript এরর দেবে।
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// এটাই মূল লজিক।
// globalThis.prisma-তে কোনো ভ্যালু আছে কিনা চেক করা হচ্ছে।
// ?? (Nullish Coalescing Operator) অপারেটরটি বলে:
// যদি বাম পাশের (globalThis.prisma) ভ্যালু null বা undefined হয়, তাহলে ডান পাশের ফাংশনটি (prismaClientSingleton()) কল করো।
// অন্যথায়, বাম পাশের ভ্যালুটিই ব্যবহার করো।
const prisma = globalThis.prisma ?? prismaClientSingleton();

// prisma ভ্যারিয়েবলটিকে এক্সপোর্ট করা হচ্ছে, যাতে অন্য ফাইল থেকে import করা যায়।
export default prisma;

// এই চেকটি নিশ্চিত করে যে আমরা শুধুমাত্র ডেভেলপমেন্ট পরিবেশেই globalThis ব্যবহার করছি।
// প্রোডাকশনে এর প্রয়োজন নেই।
if (process.env.NODE_ENV !== "production") {
  // প্রথমবার instance তৈরি হওয়ার পর, সেটিকে globalThis-এ সেভ করে রাখা হচ্ছে
  // যাতে পরবর্তী হট রিলোডে এটি পুনঃব্যবহৃত হতে পারে।
  globalThis.prisma = prisma;
}
