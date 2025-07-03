// auth.ts

import NextAuth from "next-auth"; // মূল NextAuth লাইব্রেরি
import Google from "next-auth/providers/google"; // Google Provider
import { PrismaAdapter } from "@auth/prisma-adapter"; // Prisma-এর সাথে সংযোগকারী
import prisma from "./lib/prisma"; // আমাদের Prisma Client instance

// NextAuth ফাংশনটি কল করে আমরা আমাদের "সিকিউরিটি হেডকোয়ার্টার" কনফিগার করছি
export const { handlers, auth, signIn, signOut } = NextAuth({
  // ১. Prisma Adapter কনফিগারেশন
  // এটি NextAuth.js-কে বলে দেয় যে ব্যবহারকারীর ডেটা (User, Session, ইত্যাদি)
  // আমাদের PostgreSQL ডেটাবেসে Prisma ব্যবহার করে সেভ করতে হবে।
  adapter: PrismaAdapter(prisma),

  // ২. Authentication Provider কনফিগারেশন
  // এখানে আমরা বলে দিচ্ছি যে আমাদের অ্যাপে Google ব্যবহার করে লগইন করা যাবে।
  // আমরা চাইলে এখানে GitHub, Facebook ইত্যাদিও যোগ করতে পারতাম।
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID, // .env ফাইল থেকে আসে
      clientSecret: process.env.AUTH_GOOGLE_SECRET, // .env ফাইল থেকে আসে
    }),
  ],

  // ৩. (ঐচ্ছিক) Callbacks
  // এখানে আমরা authentication প্রক্রিয়ার বিভিন্ন ধাপে নিজের কাস্টম লজিক যোগ করতে পারি।
  callbacks: {
    session({ session, user }) {
      // এই callback-টি session অবজেক্ট তৈরি হওয়ার সময় কল হয়।
      // আমরা session-এর সাথে ব্যবহারকারীর আসল user.id যোগ করে দিচ্ছি।
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
