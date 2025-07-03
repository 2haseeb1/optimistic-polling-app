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