// app/components/CreatePollForm.tsx

// যেহেতু আমরা useRef হুক ব্যবহার করব, তাই এটিকে অবশ্যই একটি Client Component হতে হবে।
'use client'; 

import { useRef } from 'react';
// app/actions.ts ফাইল থেকে আমাদের createPoll সার্ভার অ্যাকশনটি ইম্পোর্ট করা হচ্ছে।
import { createPoll } from '@/app/actions';

export default function CreatePollForm() {
  // ১. একটি ref তৈরি করা হচ্ছে। এই ref-টি আমরা সরাসরি HTML form এলিমেন্টের সাথে সংযুক্ত করব।
  // এর মাধ্যমে আমরা ফর্মটিকে ম্যানিপুলেট করতে পারব (যেমন: রিসেট করা)।
  const formRef = useRef<HTMLFormElement>(null);

  // এই ফাংশনটি আমাদের ফর্মের action হিসেবে কাজ করবে।
  async function handleFormAction(formData: FormData) {
    // ২. প্রথমে সার্ভার অ্যাকশনটি কল করা হচ্ছে এবং ফর্মের ডেটা পাঠানো হচ্ছে।
    await createPoll(formData);

    // ৩. সার্ভার অ্যাকশন সম্পন্ন হওয়ার পর, ক্লায়েন্ট সাইডে ফর্মটিকে রিসেট করে দেওয়া হচ্ছে।
    // formRef.current? ব্যবহার করে আমরা নিশ্চিত করছি যে ফর্মটি মাউন্ট করা আছে।
    formRef.current?.reset();
  }

  return (
    // ৪. আমাদের HTML ফর্ম। 
    // ref অ্যাট্রিবিউটের মাধ্যমে formRef-কে সংযুক্ত করা হয়েছে।
    // action অ্যাট্রিবিউটের মাধ্যমে handleFormAction ফাংশনটিকে সংযুক্ত করা হয়েছে।
    <form action={handleFormAction} ref={formRef} className="p-6 border rounded-lg shadow-sm bg-white mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create a New Poll</h2>
      
      <div className="mb-4">
        <label htmlFor="question" className="block mb-2 font-medium text-gray-700">
          Question:
        </label>
        <input 
          type="text" 
          name="question" 
          id="question"
          required 
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" 
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Options:</label>
        {/* প্রতিটি ইনপুটের name="option" একই রাখা হয়েছে, যাতে formData.getAll('option') দিয়ে সব অপশন পাওয়া যায়। */}
        <input type="text" name="option" required className="w-full p-2 border rounded-md mb-2" placeholder="Option 1" />
        <input type="text" name="option" required className="w-full p-2 border rounded-md mb-2" placeholder="Option 2" />
        <input type="text" name="option" className="w-full p-2 border rounded-md" placeholder="Option 3 (Optional)" />
      </div>

      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Create Poll
      </button>
    </form>
  );
}