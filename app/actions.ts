// app/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
// CORRECTED IMPORT for the Prisma error class
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// ===================================================================
// =================== CORRECTED createPoll Action ===================
// ===================================================================
export async function createPoll(formData: FormData) {
  // The 'formData' parameter is now used
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  // Using the formData object to get form values
  const question = formData.get("question") as string;
  const options = formData
    .getAll("option")
    .filter((opt) => opt.toString().trim() !== "") as string[];

  if (!question || options.length < 2) {
    return { error: "Question and at least two options are required." };
  }

  await prisma.poll.create({
    data: {
      question,
      authorId: session.user.id,
      options: {
        create: options.map((optionText) => ({ text: optionText })),
      },
    },
  });

  revalidatePath("/");
}

// ===================================================================
// =================== CORRECTED submitVote Action ===================
// ===================================================================
export async function submitVote(optionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated. Please sign in to vote.");
  }

  if (!optionId || typeof optionId !== "string") {
    throw new Error("Invalid option ID provided.");
  }

  try {
    await prisma.vote.create({
      data: {
        optionId: optionId,
        userId: session.user.id,
      },
    });

    revalidatePath("/");
  } catch (error) {
    // 'error' is of type 'unknown'

    // Using the correctly imported error class for the type guard
    if (error instanceof PrismaClientKnownRequestError) {
      // Inside this block, TypeScript now knows the type of 'error'
      // and allows access to the 'code' property.
      if (error.code === "P2002") {
        // P2002 is the unique constraint violation code
        throw new Error("You have already voted on this poll.");
      }
    }

    // Fallback for any other type of error
    console.error("An unexpected error occurred in submitVote:", error);
    throw new Error("Could not submit vote. Please try again.");
  }
}
