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
  const creditValue = Number.parseInt(readString(formData, "credit_value"), 10);
  const imageUrl = readString(formData, "image_url");
  const category = readString(formData, "category") || "other";

  if (type !== "offer" && type !== "need") {
    redirectWithPostError("Choose whether this post is an offer or a need.");
  }

  if (title.length < 3 || title.length > 100) {
    redirectWithPostError("Title must be between 3 and 100 characters.");
  }

  if (description.length < 10 || description.length > 1000) {
    redirectWithPostError("Description must be between 10 and 1000 characters.");
  }

  if (!Number.isInteger(creditValue) || creditValue < 1 || creditValue > 5) {
    redirectWithPostError("Credit value must be a whole number from 1 to 5.");
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
    credit_value: creditValue,
    image_url: imageUrl || null,
    category,
  });

  if (error) {
    redirectWithPostError(error.message);
  }

  revalidatePath("/dashboard");

  redirect("/dashboard?message=Post%20created.");
}
