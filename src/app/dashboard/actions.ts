"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function createPost(formData: FormData): Promise<{ error?: string } | never> {
  const type = readString(formData, "type");
  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const creditValue = Number.parseInt(readString(formData, "credit_value"), 10);
  const imageUrl = readString(formData, "image_url");
  const category = readString(formData, "category") || "other";

  if (type !== "offer" && type !== "need") {
    return { error: "Choose whether this post is an offer or a need." };
  }

  if (title.length < 3 || title.length > 100) {
    return { error: "Title must be between 3 and 100 characters." };
  }

  if (description.length < 10 || description.length > 1000) {
    return { error: "Description must be between 10 and 1000 characters." };
  }

  if (!Number.isInteger(creditValue) || creditValue < 1 || creditValue > 5) {
    return { error: "Credit value must be a whole number from 1 to 5." };
  }

  const allowedCategories = ["items", "services", "errands", "other"];
  const validCategory = allowedCategories.includes(category) ? category : "other";

  let sanitizedImageUrl: string | null = null;
  if (imageUrl) {
    try {
      const parsedUrl = new URL(imageUrl);
      if (
        parsedUrl.protocol === "https:" &&
        (parsedUrl.hostname.endsWith(".supabase.co") ||
          parsedUrl.hostname === "localhost" ||
          parsedUrl.hostname === "127.0.0.1") &&
        parsedUrl.pathname.includes("/post_images/")
      ) {
        sanitizedImageUrl = imageUrl;
      }
    } catch {
      sanitizedImageUrl = null;
    }
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
    image_url: sanitizedImageUrl,
    category: validCategory,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");

  redirect("/dashboard?message=Post%20created.");
}

