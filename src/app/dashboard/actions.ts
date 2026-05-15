"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithPostError(message: string): never {
  const searchParams = new URLSearchParams({ create_error: message });

  redirect(`/dashboard?${searchParams.toString()}`);
}

export async function createPost(formData: FormData) {
  const type = readString(formData, "type");
  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const karmaValue = Number.parseInt(readString(formData, "karma_value"), 10);

  if (type !== "offer" && type !== "need") {
    redirectWithPostError("Choose whether this post is an offer or a need.");
  }

  if (title.length < 3 || title.length > 100) {
    redirectWithPostError("Title must be between 3 and 100 characters.");
  }

  if (description.length < 10 || description.length > 1000) {
    redirectWithPostError("Description must be between 10 and 1000 characters.");
  }

  if (!Number.isInteger(karmaValue) || karmaValue < 1 || karmaValue > 50) {
    redirectWithPostError("Karma value must be a whole number from 1 to 50.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    type,
    title,
    description,
    karma_value: karmaValue,
  });

  if (error) {
    redirectWithPostError(error.message);
  }

  revalidatePath("/dashboard");

  redirect("/dashboard?message=Post%20created.");
}
