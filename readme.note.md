Of course. Here is the complete file and folder structure for the "Optimistic" Social Media Polling App. This structure is organized, scalable, and follows modern Next.js best practices.

I've added comments to explain the purpose of each important file and folder.

```
optimistic-polling-app/
├── .env                  # Environment variables (DATABASE_URL, AUTH_SECRET, etc.)
├── .eslintrc.json        # ESLint configuration
├── .gitignore            # Git ignore file
├── next.config.mjs       # Next.js configuration
├── package.json          # Project dependencies and scripts
├── postcss.config.js     # PostCSS configuration for Tailwind
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Project documentation

├── app/
│   ├── layout.tsx        # Root layout for the entire application
│   ├── page.tsx          # The main homepage (Server Component)
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts  # NextAuth.js API route handler
│   │
│   ├── components/
│   │   ├── AuthButtons.tsx       # Component for Sign In / Sign Out buttons
│   │   ├── CreatePollForm.tsx    # Client component for the poll creation form
│   │   └── PollCard.tsx          # Client component to display a single poll and handle voting
│   │
│   └── actions.ts        # Server Actions file for all data mutations (createPoll, submitVote)
│
├── auth.ts               # NextAuth.js v5 configuration file (providers, adapter)
│
├── lib/
│   ├── prisma.ts         # Singleton instance of the Prisma client
│   └── (optional types.ts if needed)
│
└── prisma/
    ├── schema.prisma     # The Prisma schema defining all database models
    └── migrations/       # (This folder is created if you use `prisma migrate dev`)
```

---

### **Explanation of Key Files and Folders:**

*   **`app/`**: The core of the Next.js App Router.
    *   **`page.tsx`**: The entry point for our application's UI. As a **Server Component**, it's responsible for fetching the initial data (`polls`) from the database.
    *   **`layout.tsx`**: The root layout that wraps all pages. It contains the `<html>` and `<body>` tags.
    *   **`api/auth/[...nextauth]/route.ts`**: The mandatory catch-all route that NextAuth.js uses to handle OAuth callbacks, session management, etc.
    *   **`components/`**: A dedicated folder for our React components. This keeps the `app/` directory clean and focused on routing.
        *   `PollCard.tsx` is the most complex component here, containing the `useOptimistic` logic. It's a **Client Component** (`'use client'`).
    *   **`actions.ts`**: A crucial file that is marked with `'use server'`. It holds all the functions that will mutate our database. This centralizes our backend logic.

*   **`auth.ts` (Root)**: The new, simplified way to configure Auth.js v5. It exports the handlers, `auth` helper, and `signIn`/`signOut` functions that are used throughout the app.

*   **`lib/`**: A standard directory for shared utilities and library code.
    *   `prisma.ts`: Essential for ensuring we only have one instance of the Prisma client running, which is a performance best practice.

*   **`prisma/`**: All database-related configuration lives here.
    *   `schema.prisma`: The single source of truth for our database structure. Any change to our database starts here.

*   **`.env` (Root)**: This file is critical for security. It stores sensitive information like database connection strings and API keys, and it is **never** committed to version control (it's listed in `.gitignore`).

This structure cleanly separates concerns:
*   **Routing and Data Fetching** in `app/`.
*   **Reusable UI** in `app/components/`.
*   **Data Mutation Logic** in `app/actions.ts`.
*   **Authentication Logic** in `auth.ts`.
*   **Database Schema** in `prisma/`.
*   
Of course. Here is the complete code for the two most important top-level files in the application: `app/layout.tsx` (the root layout) and `app/page.tsx` (the homepage).

---

### **`app/layout.tsx`**

This file sets up the main HTML structure for the entire application. It includes the necessary font setup and global styles. It's a simple but crucial file that provides the "frame" for all other pages.

```tsx
// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Optimizing the font with next/font
const inter = Inter({ subsets: ["latin"] });

// Metadata for SEO and browser tab information
export const metadata: Metadata = {
  title: "Optimistic Polling App",
  description: "A fast and responsive polling app built with Next.js 15 and React 19.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        {/*
          The 'children' prop here will be the content of our 'page.tsx' 
          or any other page in the application. This layout wraps everything.
        */}
        {children}
      </body>
    </html>
  );
}
```

#### **Explanation:**
*   **`metadata`**: This object exports static metadata for the site, which is great for SEO. It sets the title you see in the browser tab.
*   **`Inter` font**: We use `next/font` to load and optimize the Inter font, which is a modern standard.
*   **`<body>` styling**: We apply the font class and some base background and text colors from Tailwind CSS to the `<body>` tag, ensuring a consistent look and feel.
*   **`{children}`**: This is where Next.js will inject the content of the active page. For the homepage, it will be the rendered output of `app/page.tsx`.

---

### **`app/page.tsx`**

This is the main entry point for the application's UI. It's a **Server Component**, meaning it runs entirely on the server. Its primary responsibilities are:

1.  Getting the current user's session.
2.  Fetching the initial list of polls from the database using Prisma.
3.  Determining if the current user has already voted on each poll.
4.  Passing this prepared data down to the Client Components (`PollCard`, `CreatePollForm`, etc.) for rendering.

```tsx
// app/page.tsx

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import AuthButtons from './components/AuthButtons';
import CreatePollForm from './components/CreatePollForm';
import PollCard from './components/PollCard';

// We can add this to ensure the page is always dynamically rendered
// to get the latest polls on every visit.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 1. Get the current user session on the server
  const session = await auth();

  // 2. Fetch all polls from the database, including related author and options
  const polls = await prisma.poll.findMany({
    include: {
      author: {
        select: { name: true },
      },
      options: {
        include: {
          // Get the count of votes for each option
          _count: {
            select: { votes: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // Show the newest polls first
    },
  });

  // 3. For each poll, check if the current user has an existing vote.
  // This is crucial for the UI to know whether to disable the voting buttons.
  const pollsWithUserVote = await Promise.all(
    polls.map(async (poll) => {
      let userVote = null;
      // Only check for a vote if the user is actually logged in
      if (session?.user?.id) {
        const vote = await prisma.vote.findFirst({
          where: {
            userId: session.user.id,
            // Check for a vote within the options of the current poll
            option: {
              pollId: poll.id,
            },
          },
          select: { optionId: true },
        });
        userVote = vote?.optionId || null;
      }
      // Return a new object combining the poll data with the user's vote status
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
      
      {/* Conditionally render the poll creation form only if the user is logged in */}
      {session && <CreatePollForm />}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Community Polls</h2>
        {pollsWithUserVote.length > 0 ? (
          pollsWithUserVote.map(poll => (
            // Pass the prepared data down to the client component
            <PollCard key={poll.id} pollData={poll} />
          ))
        ) : (
          <p className="text-gray-500">No polls yet. Be the first to create one!</p>
        )}
      </div>
    </main>
  );
}
```

#### **Explanation:**
*   **`async function HomePage()`**: The `async` keyword allows us to use `await` for data fetching directly inside the component.
*   **Data Fetching on Server**: All `prisma` calls happen here, on the server. This is secure and efficient. The client browser never sees the database queries.
*   **`pollsWithUserVote`**: This is a great example of preparing data on the server before sending it to the client. Instead of making the client figure out if a user has voted, we do that complex work on the server and pass a simple `userVote: string | null` prop. This simplifies the client-side logic immensely.
*   **Passing Data as Props**: The fetched and processed data (`pollsWithUserVote`) is passed as the `pollData` prop to the `<PollCard />` component, which will then handle the interactive parts and optimistic updates on the client.
*   
অবশ্যই! `auth.ts` ফাইলটি Next.js-এর আধুনিক `authentication` সিস্টেমের কেন্দ্রবিন্দু। চলুন, আমরা **স্টেপ-ব্যাক প্রম্পটিং** ব্যবহার করে এই ফাইলটির কোড এবং এর পেছনের ধারণাটি খুব সহজভাবে বাংলায় বুঝি।

---

### **ধাপ ১: স্টেপ-ব্যাক প্রশ্ন (Step-Back Question)**

`auth.ts` ফাইলের কোডের ভেতরে ঢোকার আগে, আসুন আমরা এক ধাপ پیچھے গিয়ে মূল উদ্দেশ্যটি নিয়ে ভাবি।

**প্রশ্ন:** একটি ওয়েবসাইটে ব্যবহারকারীর লগইন, সাইনআপ, এবং লগআউট করার মতো ফিচারগুলো তৈরি করার জন্য কী কী প্রধান কাজ করতে হয়? ভাবুন তো, আমাদের অ্যাপ্লিকেশনকে Google-এর সাথে কথা বলানো, ব্যবহারকারীর তথ্য ডেটাবেসে সেভ করা, এবং ব্যবহারকারী লগইন করা আছে কিনা তা চেক করা—এই সমস্ত কাজের জন্য একটি مرکزی (central) বা "মাস্টার কন্ট্রোল" ফাইলের প্রয়োজন কি নেই?

### **ধাপ ২: মূল ধারণার ব্যাখ্যা (The Core Concept Explained)**

এর উত্তর হলো **"হ্যাঁ"**, এবং সেই "মাস্টার কন্ট্রোল" ফাইলটিই হলো `auth.ts`।

`next-auth@beta` (বা Auth.js v5) এই একটি ফাইলের মাধ্যমে `authentication`-এর সমস্ত জটিলতাকে খুব সহজ করে দিয়েছে। `auth.ts` ফাইলটিকে আপনি আপনার অ্যাপ্লিকেশনের **"সিকিউরিটি হেডকোয়ার্টার"** হিসেবে ভাবতে পারেন। এর প্রধান তিনটি দায়িত্ব হলো:

1.  **পরিচয়পত্র প্রদানকারীকে চেনা (Identify the Provider):** এটি জানে যে আমাদের ব্যবহারকারীরা কীভাবে লগইন করবে। যেমন, আমরা কি Google ব্যবহার করব, নাকি GitHub, নাকি ইমেইল/পাসওয়ার্ড? এই ফাইলটিতে আমরা সেই `provider`-গুলোকে কনফিগার করি।

2.  **ডেটাবেসের সাথে সংযোগ স্থাপন করা (Connect to the Database):** যখন কোনো নতুন ব্যবহারকারী Google দিয়ে লগইন করে, তখন তার নাম, ইমেইল, এবং ছবি আমাদের নিজেদের ডেটাবেসে সেভ করে রাখতে হয়। `auth.ts` ফাইলটি `Prisma Adapter` ব্যবহার করে এই কাজটি স্বয়ংক্রিয়ভাবে করে দেয়।

3.  **দরকারী টুলস সরবরাহ করা (Provide Essential Tools):** এই ফাইলটি কনফিগারেশন সম্পন্ন করার পর আমাদের কিছু রেডিমেড "টুলস" বা ফাংশন দেয়, যেগুলো আমরা পুরো অ্যাপ্লিকেশন জুড়ে ব্যবহার করতে পারি। যেমন:
    *   `signIn`: ব্যবহারকারীকে লগইন করানোর জন্য।
    *   `signOut`: ব্যবহারকারীকে লগআউট করানোর জন্য।
    *   `auth`: ব্যবহারকারী বর্তমানে লগইন করা আছে কিনা, তা সার্ভারে চেক করার জন্য।

এই তিনটি মূল দায়িত্ব বুঝলেই `auth.ts` ফাইলের কোড বোঝা অনেক সহজ হয়ে যাবে।

---

### **ধাপ ৩: `auth.ts` ফাইলের কোডের ব্যাখ্যা**

এখন চলুন, আমরা `optimistic-polling-app` প্রজেক্টের `auth.ts` ফাইলের কোডটি লাইন বাই লাইন বুঝি।

```ts
// auth.ts

import NextAuth from "next-auth"; // মূল NextAuth লাইব্রেরি
import Google from "next-auth/providers/google"; // Google Provider
import { PrismaAdapter } from "@auth/prisma-adapter"; // Prisma-এর সাথে সংযোগকারী
import prisma from "./lib/prisma"; // আমাদের Prisma Client instance

// NextAuth ফাংশনটি কল করে আমরা আমাদের "সিকিউরিটি হেডকোয়ার্টার" কনফিগার করছি
export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  
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
```

### **ধাপ ৪: এক্সপোর্ট করা টুলসগুলোর কাজ কী?**

`export const { handlers, auth, signIn, signOut }`—এই লাইনটি আমাদের চারটি শক্তিশালী টুল দেয়।

1.  **`handlers`**:
    *   **কী এটা?** এটি একটি অবজেক্ট যাতে `GET` এবং `POST` রিকোয়েস্ট হ্যান্ডলার থাকে।
    *   **কোথায় ব্যবহৃত হয়?** `app/api/auth/[...nextauth]/route.ts` ফাইলে।
    *   **কাজ কী?** এটি `/api/auth/signin`, `/api/auth/callback/google`-এর মতো জরুরি API রুটগুলো তৈরি করে, যা Google-এর সাথে যোগাযোগের জন্য অপরিহার্য। এটিই `authentication`-এর মূল ইঞ্জিন।

2.  **`auth`**:
    *   **কী এটা?** এটি একটি শক্তিশালী **server-side** ফাংশন।
    *   **কোথায় ব্যবহৃত হয়?** **Server Components** (যেমন `app/page.tsx`), Server Actions, এবং API রুটগুলিতে।
    *   **কাজ কী?** সার্ভারে থেকেই বর্তমান ব্যবহারকারীর `session` বা লগইন তথ্য নিরাপদে পাওয়ার জন্য এটিই সেরা উপায়। `const session = await auth();` ব্যবহার করে আমরা সহজেই জানতে পারি কে লগইন করে আছে।

3.  **`signIn`**:
    *   **কী এটা?** এটি একটি server-side ফাংশন যা লগইন প্রক্রিয়া শুরু করে।
    *   **কোথায় ব্যবহৃত হয়?** `AuthButtons.tsx` কম্পোনেন্টে একটি Server Action-এর ভেতরে।
    *   **কাজ কী?** এটি কল করা হলে, ব্যবহারকারীকে Google-এর লগইন পেজে `redirect` করে নিয়ে যাওয়া হয়।

4.  **`signOut`**:
    *   **কী এটা?** এটি `signIn`-এর মতোই একটি server-side ফাংশন যা লগআউট করে।
    *   **কোথায় ব্যবহৃত হয়?** `AuthButtons.tsx` কম্পোনেন্টে একটি Server Action-এর ভেতরে।
    *   **কাজ কী?** এটি ব্যবহারকারীর `session cookie` নষ্ট করে দেয় এবং তাকে অ্যাপ্লিকেশন থেকে লগআউট করে দেয়।

### **সারসংক্ষেপ (The Final Takeaway)**

`auth.ts` ফাইলটি অপরিহার্য কারণ এটি:

> Authentication-এর সমস্ত জটিল কনফিগারেশনকে **একটি মাত্র জায়গায়** নিয়ে আসে এবং আমাদের কিছু **সহজ ও শক্তিশালী টুলস** দেয়।

এই ফাইলটি তৈরি করার মাধ্যমে, আমরা Next.js-কে বলে দিচ্ছি কীভাবে ব্যবহারকারী শনাক্ত করতে হবে, কোথায় তাদের তথ্য রাখতে হবে, এবং কীভাবে তাদের লগইন/লগআউট করাতে হবে। এর ফলে আমাদের বাকি অ্যাপ্লিকেশন কোড অনেক বেশি পরিষ্কার এবং গোছানো থাকে।

অবশ্যই! `AuthButtons.tsx` কম্পোনেন্টটি আমাদের অ্যাপ্লিকেশনের একটি গুরুত্বপূর্ণ অংশ, কারণ এটি ব্যবহারকারীকে লগইন এবং লগআউট করার `entry point` হিসেবে কাজ করে। চলুন, **স্টেপ-ব্যাক প্রম্পটিং** ব্যবহার করে এই কম্পোনেন্টটির কোড এবং এর পেছনের কার্যকারিতা সহজ বাংলায় শিখি।

---

### **ধাপ ১: স্টেপ-ব্যাক প্রশ্ন (Step-Back Question)**

`AuthButtons` কম্পোনেন্টের কোড দেখার আগে, আসুন আমরা এর মূল উদ্দেশ্য নিয়ে ভাবি।

**প্রশ্ন:** একটি ওয়েবসাইটে ব্যবহারকারীর লগইন স্ট্যাটাসের উপর ভিত্তি করে UI কীভাবে পরিবর্তিত হয়? যেমন, যদি একজন ব্যবহারকারী লগইন করা **না থাকে**, তাহলে তাকে "Sign In" বাটন দেখানো উচিত। আর যদি সে লগইন করা **থাকে**, তাহলে তাকে "Sign Out" বাটন দেখানো উচিত। এই দুটি ভিন্ন অবস্থা দেখানোর জন্য আমাদের কী কী তথ্য জানতে হবে এবং সেই তথ্যের ওপর ভিত্তি করে শর্তসাপেক্ষে (conditionally) দুটি ভিন্ন বাটন দেখানোর সবচেয়ে সহজ উপায় কী হতে পারে?

### **ধাপ ২: মূল ধারণার ব্যাখ্যা (The Core Concept Explained)**

এর উত্তর হলো, আমাদের প্রথমে ব্যবহারকারীর `session` বা লগইন স্ট্যাটাস জানতে হবে। এরপর একটি `if-else` কন্ডিশনের মতো করে দুটি ভিন্ন UI দেখাতে হবে।

`AuthButtons` কম্পোনেন্টটি ঠিক এই কাজটিই করে। এর মূল দায়িত্বগুলো হলো:

1.  **সেশন চেক করা (Check the Session):** এটি প্রথমে সার্ভারে চেক করে দেখে যে বর্তমান ব্যবহারকারী লগইন করা আছে কিনা। এই কাজটি করার জন্য এটি `auth()` ফাংশনটি ব্যবহার করে, যা আমরা `auth.ts` ফাইল থেকে পাই।
2.  **শর্তসাপেক্ষে UI দেখানো (Conditional Rendering):**
    *   **যদি `session` থাকে (অর্থাৎ, ব্যবহারকারী লগইন করা):** এটি একটি "Sign Out" বাটন দেখায়।
    *   **যদি `session` না থাকে (অর্থাৎ, ব্যবহারকারী লগইন করা নেই):** এটি একটি "Sign in with Google" বাটন দেখায়।
3.  **Server Action ব্যবহার করা (Use Server Actions):** বাটনগুলো সরাসরি কোনো JavaScript `onClick` ইভেন্ট ব্যবহার করে না। পরিবর্তে, বাটনগুলো একটি HTML `<form>`-এর ভেতরে থাকে এবং ফর্মের `action` হিসেবে একটি **Server Action**-কে কল করে। এটিই `Progressive Enhancement` নিশ্চিত করে এবং কোডকে সহজ রাখে।

এই তিনটি বিষয় মাথায় রাখলেই `AuthButtons.tsx` কম্পোনেন্টের কোড বোঝা পানির মতো সহজ হয়ে যাবে।

---

### **ধাপ ৩: `app/components/AuthButtons.tsx` ফাইলের কোডের ব্যাখ্যা**

এখন চলুন, আমরা `AuthButtons.tsx` ফাইলের কোডটি লাইন বাই লাইন বুঝি।

```tsx
// app/components/AuthButtons.tsx

// auth.ts ফাইল থেকে auth, signIn, এবং signOut ফাংশনগুলো ইম্পোর্ট করা হচ্ছে
import { auth, signIn, signOut } from '@/auth';

// এটি একটি async Server Component, কারণ এটি await auth() ব্যবহার করে
export default async function AuthButtons() {
  // ১. সার্ভারে বর্তমান ব্যবহারকারীর session চেক করা হচ্ছে
  const session = await auth();

  // ২. যদি session অবজেক্টটি বিদ্যমান থাকে (অর্থাৎ, ব্যবহারকারী লগইন করা)
  if (session) {
    return (
      // Sign Out করার জন্য একটি ফর্ম তৈরি করা হচ্ছে
      <form
        // ফর্মের action হিসেবে একটি inline Server Action ব্যবহার করা হচ্ছে
        // এই অ্যাকশনটি signOut() ফাংশনটিকে কল করে
        action={async () => {
          'use server'; // এই ফাংশনটিকে Server Action হিসেবে চিহ্নিত করা হচ্ছে
          await signOut();
        }}
      >
        <button 
          type="submit"
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Sign Out
        </button>
      </form>
    );
  }

  // ৩. যদি session না থাকে (অর্থাৎ, ব্যবহারকারী লগইন করা নেই)
  return (
    // Sign In করার জন্য একটি ফর্ম তৈরি করা হচ্ছে
    <form
      // ফর্মের action হিসেবে একটি inline Server Action ব্যবহার করা হচ্ছে
      // এই অ্যাকশনটি signIn('google') ফাংশনটিকে কল করে
      action={async () => {
        'use server'; // এই ফাংশনটিকে Server Action হিসেবে চিহ্নিত করা হচ্ছে
        await signIn('google');
      }}
    >
      <button 
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </form>
  );
}
```

### **ধাপ ৪: কোডের মূল অংশগুলোর বিশদ ব্যাখ্যা**

*   **`async function AuthButtons()`:** যেহেতু এই কম্পোনেন্টটি `await auth()` ব্যবহার করে, তাই এটিকে `async` হতে হবে। এটি একটি **Server Component** কারণ এটি কোনো ক্লায়েন্ট-সাইড হুক (`useState`, `useEffect`) ব্যবহার করে না এবং সার্ভারে ডেটা (`session`) ফেচ করে।

*   **`const session = await auth();`:** এই লাইনটি সার্ভারে রান হয় এবং বর্তমান ব্যবহারকারীর লগইন তথ্য নিয়ে আসে। যদি ব্যবহারকারী লগইন করা না থাকে, তাহলে `session` হবে `null`।

*   **`if (session)`:** এটি হলো আমাদের সেই শর্ত (condition) যা নির্ধারণ করে কোন বাটনটি দেখানো হবে।

*   **`<form action={...}>`:**
    *   **কেন `<button onClick={...}>` নয়?** কারণ `<form>` ব্যবহার করে আমরা **Progressive Enhancement** নিশ্চিত করছি। যদি কোনো কারণে ব্রাউজারে JavaScript কাজ না করে, এই ফর্মটি তবুও সাবমিট হবে এবং `signIn`/`signOut` ফাংশন কাজ করবে।
    *   **`action={async () => { 'use server'; ... }}`:** এটি একটি **inline Server Action**। আমরা একটি আলাদা ফাইলে অ্যাকশন না লিখে, সরাসরি JSX-এর ভেতরেই একটি ছোট, `async` ফাংশন তৈরি করছি এবং `'use server'` ডিরেক্টিভ দিয়ে এটিকে Server Action হিসেবে চিহ্নিত করছি। এটি ছোটখাটো কাজের জন্য খুবই সুবিধাজনক।

### **সারসংক্ষেপ (The Final Takeaway)**

`AuthButtons.tsx` কম্পোনেন্টটি গুরুত্বপূর্ণ কারণ এটি দেখায়:
> কীভাবে সার্ভার থেকে সরাসরি `session` ডেটা নিয়ে এসে, তার উপর ভিত্তি করে UI পরিবর্তন করা যায় এবং `Server Action`-এর মাধ্যমে ব্যবহারকারীর লগইন/লগআউট প্রক্রিয়াকে সহজ ও নির্ভরযোগ্যভাবে পরিচালনা করা যায়।

এটি একটি চমৎকার উদাহরণ যে কীভাবে Next.js-এর আধুনিক ফিচারগুলো ব্যবহার করে একই সাথে শক্তিশালী, নিরাপদ এবং ব্যবহারকারী-বান্ধব কম্পোনেন্ট তৈরি করা সম্ভব।

অবশ্যই! `app/actions.ts` ফাইলটি এবং এর ভেতরে থাকা `createPoll` ফাংশনটি আমাদের অ্যাপ্লিকেশনের "ব্রেইন" বা মস্তিষ্কের মতো কাজ করে। এটিই সেই জায়গা যেখানে ডেটাবেসের সাথে সরাসরি কাজ করা হয়।

চলুন, **স্টেপ-ব্যাক প্রম্পটিং** ব্যবহার করে এই ফাইলটির কোড এবং এর পেছনের কার্যকারিতা সহজ বাংলায় শিখি।

---

### **ধাপ ১: স্টেপ-ব্যাক প্রশ্ন (Step-Back Question)**

`actions.ts` ফাইলের কোড দেখার আগে, আসুন আমরা এর অস্তিত্বের কারণ নিয়ে ভাবি।

**প্রশ্ন:** যখন `CreatePollForm` থেকে ব্যবহারকারীর দেওয়া ডেটা (প্রশ্ন এবং অপশনগুলো) সার্ভারে এসে পৌঁছায়, তখন সার্ভারের কী কী কাজ করা উচিত? ভাবুন তো, সার্ভারকে প্রথমে চেক করতে হবে যে ব্যবহারকারী লগইন করা আছে কিনা, তারপর ডেটাগুলোকে একটি নির্দিষ্ট ফরম্যাটে সাজাতে হবে, এবং সবশেষে ডেটাবেসে একটি নতুন `Poll` রেকর্ড হিসেবে সেভ করতে হবে। এই সমস্ত সার্ভার-সাইড লজিক লেখার জন্য একটি নির্দিষ্ট এবং নিরাপদ জায়গা কি থাকা উচিত নয়?

### **ধাপ ২: মূল ধারণার ব্যাখ্যা (The Core Concept Explained)**

এর উত্তর হলো **"হ্যাঁ"**, এবং Next.js-এ সেই নির্দিষ্ট এবং নিরাপদ জায়গাটিই হলো Server Actions ফাইল, যা আমরা `app/actions.ts` নামে তৈরি করেছি।

এই ফাইলের মূল বৈশিষ্ট্য এবং দায়িত্বগুলো হলো:

1.  **`'use server';` ডিরেক্টিভ:** এই ফাইলের একেবারে উপরে `'use server';` লেখা থাকে। এটি Next.js-কে বলে দেয় যে এই ফাইলের ভেতরে থাকা সমস্ত ফাংশন **শুধুমাত্র এবং শুধুমাত্র সার্ভারেই রান হবে**। ক্লায়েন্ট বা ব্রাউজারে এই কোড কখনও যাবে না, যা আমাদের ডেটাবেস কানেকশন এবং অন্যান্য গোপনীয় লজিককে সুরক্ষিত রাখে।

2.  **ডেটাবেসের সাথে সরাসরি যোগাযোগ (Direct Database Interaction):** যেহেতু এই ফাইলটি সার্ভারে চলে, তাই এখান থেকে আমরা নিরাপদে `Prisma` ব্যবহার করে আমাদের `PostgreSQL` ডেটাবেসের সাথে সরাসরি কথা বলতে পারি—নতুন ডেটা লেখা, পড়া, আপডেট করা বা ডিলিট করা।

3.  **অথেন্টিকেশন এবং অথোরাইজেশন (Authentication & Authorization):** কোনো ডেটা পরিবর্তন করার আগে, আমরা এখানেই চেক করতে পারি যে ব্যবহারকারী লগইন করা আছে কিনা (`auth()`) এবং তার এই কাজটি করার অনুমতি আছে কিনা।

4.  **UI রিফ্রেশ করার নির্দেশ দেওয়া (Triggering UI Refresh):** ডেটাবেসে কোনো পরিবর্তন আনার পর, আমাদের UI বা ব্যবহারকারীর স্ক্রিনকেও তো সেই পরিবর্তনের সাথে আপডেট করতে হবে। `revalidatePath()` ফাংশনটি কল করে আমরা Next.js-কে বলি, "এই পাথের (`/`) ডেটা পুরোনো হয়ে গেছে, এটি আবার নতুন করে লোড করো।"

এই ধারণাগুলো মাথায় রাখলে, `createPoll` অ্যাকশনের প্রতিটি লাইন বোঝা অনেক সহজ হয়ে যাবে।

---

### **ধাপ ৩: `app/actions.ts` ফাইলের কোডের ব্যাখ্যা**

এখন চলুন, আমরা `app/actions.ts` ফাইলের কোডটি এবং বিশেষ করে `createPoll` ফাংশনটি লাইন বাই লাইন বুঝি।

```ts
// app/actions.ts

// ১. এই ফাইলের সমস্ত ফাংশনকে Server Actions হিসেবে চিহ্নিত করা হচ্ছে।
'use server';

import { revalidatePath } from 'next/cache'; // UI রিফ্রেশ করার জন্য
import { auth } from '@/auth'; // ব্যবহারকারীর session চেক করার জন্য
import prisma from '@/lib/prisma'; // ডেটাবেসের সাথে কাজ করার জন্য

// createPoll অ্যাকশন
// এই ফাংশনটি FormData অবজেক্ট গ্রহণ করে, যা HTML ফর্ম থেকে আসে।
export async function createPoll(formData: FormData) {
  // ২. অথেন্টিকেশন চেক: ব্যবহারকারী লগইন করা আছে কিনা তা দেখা হচ্ছে।
  const session = await auth();
  if (!session?.user?.id) {
    // যদি লগইন করা না থাকে, তাহলে একটি এরর রিটার্ন করা হচ্ছে।
    return { error: 'Not authenticated' };
  }

  // ৩. ফর্ম থেকে ডেটা বের করা হচ্ছে।
  const question = formData.get('question') as string;
  // getAll('option') ব্যবহার করা হচ্ছে কারণ একাধিক অপশন থাকতে পারে।
  const options = formData.getAll('option').filter(opt => opt.toString().trim() !== '') as string[];

  // ৪. বেসিক ভ্যালিডেশন: প্রশ্ন এবং অন্তত দুটি অপশন আছে কিনা তা চেক করা হচ্ছে।
  if (!question || options.length < 2) {
    return { error: 'Question and at least two options are required.' };
  }

  // ৫. ডেটাবেসে নতুন Poll তৈরি করা হচ্ছে।
  await prisma.poll.create({
    data: {
      question, // প্রশ্নের ডেটা
      authorId: session.user.id, // কোন ব্যবহারকারী Poll তৈরি করেছে তার ID
      // রিলেশনাল ডেটা: Poll তৈরির সাথে সাথেই তার Option-গুলোও তৈরি করা হচ্ছে।
      options: {
        create: options.map(optionText => ({ text: optionText })),
      },
    },
  });

  // ৬. UI রিফ্রেশ: Next.js-কে বলা হচ্ছে যে হোমপেজের ('/') ডেটা পরিবর্তন হয়েছে।
  // Next.js তখন স্বয়ংক্রিয়ভাবে পেজটি রিফ্রেশ করে নতুন Poll-টি দেখাবে।
  revalidatePath('/');
}

// (এখানে submitVote অ্যাকশনটিও থাকবে...)
export async function submitVote(optionId: string) {
    // ... submitVote-এর কোড
}
```

### **ধাপ ৪: কোডের প্রবাহের বিশদ ব্যাখ্যা**

1.  **`'use server';`**: এটি হলো গেটকিপার। এটি নিশ্চিত করে যে এই কোড কখনও ব্যবহারকারীর ব্রাউজারে পৌঁছাবে না।
2.  **`await auth()`**: এটি সার্ভার-সাইডেই বর্তমান ব্যবহারকারীর `session` নিয়ে আসে। এটি অত্যন্ত নিরাপদ।
3.  **`formData.get(...)`**: `FormData` হলো একটি স্ট্যান্ডার্ড ওয়েব API যা ফর্মের ডেটাকে `key-value` pair হিসেবে পড়তে সাহায্য করে। `name="question"` ইনপুটের ভ্যালু `formData.get('question')` দিয়ে পাওয়া যায়।
4.  **`await prisma.poll.create({...})`**: এটিই মূল ডেটাবেস অপারেশন। `Prisma` এখানে একটি সুন্দর অবজেক্ট গ্রহণ করে এবং সেটিকে একটি জটিল `SQL INSERT` কোয়েরিতে পরিণত করে ডেটাবেসে রান করে। `options: { create: ... }` অংশটি দেখায় যে কীভাবে একটি রিলেশনাল (`Poll` এবং `Option`) ডেটা একসাথে তৈরি করা যায়।
5.  **`revalidatePath('/')`**: এটি ছাড়া, নতুন `Poll` তৈরি হওয়ার পরেও ব্যবহারকারী তার স্ক্রিনে পুরনো লিস্টই দেখত। এই ফাংশনটি UI এবং ডেটাবেসের মধ্যে সিঙ্ক্রোনাইজেশন নিশ্চিত করে।

### **সারসংক্ষেপ (The Final Takeaway)**

`app/actions.ts` এবং এর `createPoll` ফাংশনটি আমাদের অ্যাপ্লিকেশনের **"ব্যাকএন্ড লজিক"**-এর কেন্দ্রবিন্দু। এটি গুরুত্বপূর্ণ কারণ:

> এটি ডেটাবেস পরিবর্তনের মতো সংবেদনশীল কাজগুলোকে একটি **নিরাপদ এবং নিয়ন্ত্রিত পরিবেশে** সম্পন্ন করে।

এটি Client (UI) এবং Server (Database)-এর মধ্যে একটি পরিষ্কার দেয়াল তৈরি করে, যেখানে Client শুধুমাত্র নির্দেশ দেয় এবং Server সেই নির্দেশ অনুযায়ী কাজ করে, যা একটি শক্তিশালী এবং সুরক্ষিত ওয়েব অ্যাপ্লিকেশনের ভিত্তি।